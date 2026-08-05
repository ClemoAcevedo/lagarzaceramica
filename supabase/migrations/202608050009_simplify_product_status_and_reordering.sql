-- Keep only the two useful catalog states, allow direct deletion and repair
-- reorder functions created with an empty search_path.

update public.products
set status = 'draft'
where status = 'archived';

alter table public.products
  add constraint products_status_supported
  check (status in ('draft', 'published'));

drop policy if exists "Admins delete archived products" on public.products;
drop policy if exists "Admins delete products" on public.products;

create policy "Admins delete products"
on public.products for delete
to authenticated
using (public.is_admin());

drop function if exists public.set_product_status(uuid, public.product_status, timestamptz);

create or replace function public.reorder_categories(category_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('categories.sort_order', 0));

  if cardinality(category_ids) <> (select count(*) from public.categories)
    or (select count(distinct id) from unnest(category_ids) as ids(id)) <> cardinality(category_ids)
    or exists (
      select 1 from unnest(category_ids) as ids(id)
      left join public.categories as category on category.id = ids.id
      where category.id is null
    ) then
    raise exception 'El orden debe incluir todas las categorías una sola vez.';
  end if;

  update public.categories as category
  set sort_order = ordered.ordinality - 1
  from unnest(category_ids) with ordinality as ordered(id, ordinality)
  where category.id = ordered.id;
end;
$$;

create or replace function public.delete_category(category_id uuid, expected_updated_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('categories.sort_order', 0));
  if exists (select 1 from public.products where products.category_id = delete_category.category_id) then
    raise exception 'Reasigna o elimina las piezas de esta categoría antes de eliminarla.';
  end if;

  delete from public.categories
  where id = delete_category.category_id and updated_at = expected_updated_at;
  if not found then
    raise exception 'La categoría cambió o ya no existe. Recarga el panel.';
  end if;

  with ordered as (
    select id, row_number() over (order by sort_order, created_at, id) - 1 as position
    from public.categories
  )
  update public.categories as category
  set sort_order = ordered.position
  from ordered
  where category.id = ordered.id;
end;
$$;

create or replace function public.reorder_products(product_ids uuid[], expected_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_ids uuid[];
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('products.catalog_order', 0));
  select coalesce(array_agg(id order by catalog_order), array[]::uuid[])
  into current_ids from public.products;
  if current_ids is distinct from expected_product_ids then
    raise exception 'Otra sesión modificó el catálogo. Recarga antes de guardar el orden.';
  end if;
  if cardinality(product_ids) <> cardinality(current_ids)
    or (select count(distinct id) from unnest(product_ids) as ids(id)) <> cardinality(product_ids)
    or exists (
      select 1 from unnest(product_ids) as ids(id)
      left join public.products as product on product.id = ids.id
      where product.id is null
    ) then
    raise exception 'El orden debe incluir todas las piezas una sola vez.';
  end if;

  update public.products as product
  set catalog_order = ordered.ordinality - 1
  from unnest(product_ids) with ordinality as ordered(id, ordinality)
  where product.id = ordered.id;
end;
$$;

create or replace function public.reorder_category_products(
  selected_category_id uuid,
  product_ids uuid[],
  expected_product_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_ids uuid[];
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('products.category_order:' || selected_category_id::text, 0));
  select coalesce(array_agg(id order by category_order), array[]::uuid[])
  into current_ids
  from public.products
  where category_id = selected_category_id;
  if current_ids is distinct from expected_product_ids then
    raise exception 'Otra sesión modificó esta categoría. Recarga antes de guardar el orden.';
  end if;
  if cardinality(product_ids) <> cardinality(current_ids)
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
  where product.id = ordered.id and product.category_id = selected_category_id;
end;
$$;

create or replace function public.permanently_delete_product(
  product_id uuid,
  expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;

  perform 1
  from public.products as product
  where product.id = permanently_delete_product.product_id
    and product.updated_at = permanently_delete_product.expected_updated_at
  for update;
  if not found then raise exception 'La pieza cambió o ya no existe. Recarga el panel.'; end if;

  if exists (
    select 1
    from public.homepage_featured as featured
    where featured.product_id = permanently_delete_product.product_id
  ) then
    raise exception 'Reemplaza esta pieza en la selección de Inicio antes de eliminarla.';
  end if;

  insert into public.storage_cleanup_queue(path, not_before)
  select distinct path, now()
  from public.product_images as image
  cross join lateral (values (image.storage_path), (image.storage_path_small), (image.storage_path_medium)) as paths(path)
  where image.product_id = permanently_delete_product.product_id
    and nullif(trim(paths.path), '') is not null
  on conflict (path) do update set not_before = least(public.storage_cleanup_queue.not_before, excluded.not_before);

  delete from public.products as product
  where product.id = permanently_delete_product.product_id;
end;
$$;

revoke all on function public.reorder_categories(uuid[]) from public;
revoke all on function public.delete_category(uuid, timestamptz) from public;
revoke all on function public.reorder_products(uuid[], uuid[]) from public;
revoke all on function public.reorder_category_products(uuid, uuid[], uuid[]) from public;
revoke all on function public.permanently_delete_product(uuid, timestamptz) from public;

grant execute on function public.reorder_categories(uuid[]) to authenticated;
grant execute on function public.delete_category(uuid, timestamptz) to authenticated;
grant execute on function public.reorder_products(uuid[], uuid[]) to authenticated;
grant execute on function public.reorder_category_products(uuid, uuid[], uuid[]) to authenticated;
grant execute on function public.permanently_delete_product(uuid, timestamptz) to authenticated;
