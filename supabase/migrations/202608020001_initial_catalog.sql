create extension if not exists pgcrypto;

create type public.product_status as enum ('draft', 'published', 'archived');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  price_clp bigint check (price_clp is null or price_clp > 0),
  material text not null default 'Gres esmaltado' check (char_length(trim(material)) between 1 and 100),
  status public.product_status not null default 'draft',
  catalog_order integer not null default 0 check (catalog_order >= 0),
  card_format text not null default 'portrait' check (card_format in ('portrait', 'landscape')),
  preview_fit text not null default 'cover' check (preview_fit in ('cover', 'contain')),
  preview_position text not null default 'center' check (preview_position in ('center', 'bottom')),
  crop_x numeric(5, 2) not null default 50 check (crop_x between 0 and 100),
  crop_y numeric(5, 2) not null default 50 check (crop_y between 0 and 100),
  crop_zoom numeric(4, 2) not null default 1 check (crop_zoom between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_slug_history (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt text not null check (char_length(trim(alt)) between 1 and 240),
  sort_order integer not null default 0 check (sort_order >= 0),
  crop_x numeric(5, 2) not null default 50 check (crop_x between 0 and 100),
  crop_y numeric(5, 2) not null default 50 check (crop_y between 0 and 100),
  crop_zoom numeric(4, 2) not null default 1 check (crop_zoom between 1 and 3),
  created_at timestamptz not null default now()
);

create table public.homepage_featured (
  slot smallint primary key check (slot between 1 and 3),
  product_id uuid not null unique references public.products(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_status_order_idx on public.products(status, catalog_order);
create index product_slug_history_product_id_idx on public.product_slug_history(product_id);
create index product_images_product_id_idx on public.product_images(product_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

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

create trigger products_remember_slug
before insert or update of slug on public.products
for each row execute function public.remember_product_slug();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.validate_published_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if not exists (
      select 1 from public.product_images where product_id = new.id
    ) then
      raise exception 'Una pieza publicada necesita al menos una imagen.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'published'
      and new.status <> 'published'
      and exists (select 1 from public.homepage_featured where product_id = new.id) then
      raise exception 'Reemplaza esta pieza en la selección de inicio antes de retirarla.';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_validate_publish
before insert or update on public.products
for each row execute function public.validate_published_product();

create or replace function public.protect_published_product_image()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.products
    where id = old.product_id and status = 'published'
  ) and (
    select count(*) from public.product_images where product_id = old.product_id
  ) <= 1 then
    raise exception 'Una pieza publicada debe conservar al menos una imagen.';
  end if;
  return old;
end;
$$;

create trigger product_images_protect_published
before delete on public.product_images
for each row execute function public.protect_published_product_image();

create or replace function public.validate_featured_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.products
    where id = new.product_id and status = 'published'
  ) then
    raise exception 'Solo se pueden destacar piezas publicadas.';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger homepage_featured_validate
before insert or update on public.homepage_featured
for each row execute function public.validate_featured_product();

create or replace function public.set_homepage_featured(product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  if cardinality(product_ids) <> 3
    or (select count(distinct id) from unnest(product_ids) as ids(id)) <> 3 then
    raise exception 'Debes elegir exactamente tres piezas diferentes.';
  end if;

  if (
    select count(*) from public.products
    where id = any(product_ids) and status = 'published'
  ) <> 3 then
    raise exception 'Las tres piezas deben estar publicadas.';
  end if;

  delete from public.homepage_featured;
  insert into public.homepage_featured(slot, product_id)
  select ordinality::smallint, id
  from unnest(product_ids) with ordinality as selected(id, ordinality);
end;
$$;

create or replace function public.reorder_products(product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  if cardinality(product_ids) <> (select count(*) from public.products)
    or (select count(distinct id) from unnest(product_ids) as ids(id)) <> cardinality(product_ids) then
    raise exception 'El orden debe incluir todas las piezas una sola vez.';
  end if;

  update public.products as product
  set catalog_order = ordered.ordinality - 1
  from unnest(product_ids) with ordinality as ordered(id, ordinality)
  where product.id = ordered.id;
end;
$$;

create or replace function public.reorder_categories(category_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  if cardinality(category_ids) <> (select count(*) from public.categories)
    or (select count(distinct id) from unnest(category_ids) as ids(id)) <> cardinality(category_ids) then
    raise exception 'El orden debe incluir todas las categorías una sola vez.';
  end if;

  update public.categories as category
  set sort_order = ordered.ordinality - 1
  from unnest(category_ids) with ordinality as ordered(id, ordinality)
  where category.id = ordered.id;
end;
$$;

revoke all on function public.set_homepage_featured(uuid[]) from public;
revoke all on function public.reorder_products(uuid[]) from public;
revoke all on function public.reorder_categories(uuid[]) from public;
grant execute on function public.set_homepage_featured(uuid[]) to authenticated;
grant execute on function public.reorder_products(uuid[]) to authenticated;
grant execute on function public.reorder_categories(uuid[]) to authenticated;

create or replace function public.publish_all_drafts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_count integer;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;

  update public.products set status = 'published' where status = 'draft';
  get diagnostics published_count = row_count;

  if not exists (select 1 from public.homepage_featured) then
    insert into public.homepage_featured(slot, product_id)
    select selected.slot, product.id
    from (
      values
        (1::smallint, 'gallina-contenedora'::text),
        (2::smallint, 'vajilla-rio'::text),
        (3::smallint, 'taza-de-campo'::text)
    ) as selected(slot, slug)
    join public.products as product on product.slug = selected.slug
    where product.status = 'published';
  end if;

  return published_count;
end;
$$;

revoke all on function public.publish_all_drafts() from public;
grant execute on function public.publish_all_drafts() to authenticated;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_slug_history enable row level security;
alter table public.product_images enable row level security;
alter table public.homepage_featured enable row level security;

create policy "Public can read categories in use"
on public.categories for select
to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.category_id = categories.id and products.status = 'published'
  )
);

create policy "Admins manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (status = 'published' or public.is_admin());

create policy "Admins insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

create policy "Admins update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete archived products"
on public.products for delete
to authenticated
using (public.is_admin() and status = 'archived');

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

create policy "Public can read published product images"
on public.product_images for select
to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.status = 'published'
  )
);

create policy "Admins manage product images"
on public.product_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read featured selection"
on public.homepage_featured for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = homepage_featured.product_id and products.status = 'published'
  )
);

grant select on public.categories, public.products, public.product_slug_history, public.product_images, public.homepage_featured to anon;
grant select on public.categories, public.products, public.product_slug_history, public.product_images, public.homepage_featured to authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant usage on type public.product_status to authenticated;
grant all on public.admin_users, public.categories, public.products, public.product_slug_history, public.product_images, public.homepage_featured to service_role;
grant usage on type public.product_status to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can inspect product image objects"
on storage.objects for select
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can upload product image objects"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can update product image objects"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can delete product image objects"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
