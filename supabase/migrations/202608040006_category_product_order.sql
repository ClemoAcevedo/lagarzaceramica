alter table public.products
  add column if not exists category_order integer;

with ordered as (
  select
    id,
    row_number() over (
      partition by category_id
      order by catalog_order, created_at, id
    ) - 1 as position
  from public.products
)
update public.products as product
set category_order = ordered.position
from ordered
where product.id = ordered.id
  and product.category_order is null;

alter table public.products
  alter column category_order set not null;

alter table public.products
  drop constraint if exists products_category_order_check;

alter table public.products
  add constraint products_category_order_check check (category_order >= 0);

create index if not exists products_category_order_idx
on public.products(category_id, category_order);

create or replace function public.assign_product_category_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select coalesce(max(product.category_order) + 1, 0)
    into new.category_order
    from public.products as product
    where product.category_id = new.category_id
      and product.id <> new.id;
  elsif new.category_id is distinct from old.category_id then
    select coalesce(max(product.category_order) + 1, 0)
    into new.category_order
    from public.products as product
    where product.category_id = new.category_id
      and product.id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists products_assign_category_order on public.products;
create trigger products_assign_category_order
before insert or update of category_id on public.products
for each row execute function public.assign_product_category_order();

create or replace function public.reorder_category_products(
  selected_category_id uuid,
  product_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;

  if cardinality(product_ids) <> (
      select count(*) from public.products where category_id = selected_category_id
    )
    or (select count(distinct id) from unnest(product_ids) as ids(id)) <> cardinality(product_ids)
    or exists (
      select 1
      from unnest(product_ids) as ids(id)
      left join public.products as product on product.id = ids.id
      where product.id is null or product.category_id <> selected_category_id
    ) then
    raise exception 'El orden debe incluir todas las piezas de la categoría una sola vez.';
  end if;

  update public.products as product
  set category_order = ordered.ordinality - 1
  from unnest(product_ids) with ordinality as ordered(id, ordinality)
  where product.id = ordered.id
    and product.category_id = selected_category_id;
end;
$$;

revoke all on function public.reorder_category_products(uuid, uuid[]) from public;
grant execute on function public.reorder_category_products(uuid, uuid[]) to authenticated;
