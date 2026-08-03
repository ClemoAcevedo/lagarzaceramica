create table if not exists public.product_slug_history (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists product_slug_history_product_id_idx
on public.product_slug_history(product_id);

create or replace function public.remember_product_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from public.product_slug_history where slug = new.slug) then
      raise exception 'Esta dirección ya fue utilizada por otra pieza.';
    end if;
    return new;
  end if;

  if new.slug is distinct from old.slug then
    -- Permite que una pieza recupere una de sus propias direcciones anteriores.
    delete from public.product_slug_history
    where product_id = new.id and slug = new.slug;

    if exists (select 1 from public.product_slug_history where slug = new.slug) then
      raise exception 'Esta dirección ya fue utilizada por otra pieza.';
    end if;

    insert into public.product_slug_history(slug, product_id)
    values (old.slug, new.id)
    on conflict (slug) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists products_remember_slug on public.products;
create trigger products_remember_slug
before insert or update of slug on public.products
for each row execute function public.remember_product_slug();

alter table public.product_slug_history enable row level security;

create policy "Public can resolve published product slugs"
on public.product_slug_history for select
to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.id = product_slug_history.product_id
      and products.status = 'published'
  )
);

grant select on public.product_slug_history to anon, authenticated;
grant all on public.product_slug_history to service_role;
