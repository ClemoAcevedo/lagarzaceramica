-- Make administrative operations deterministic, concurrency-aware and recoverable.

with ordered as (
  select id, row_number() over (order by sort_order, created_at, id) - 1 as position
  from public.categories
)
update public.categories as category
set sort_order = ordered.position
from ordered
where category.id = ordered.id;

with ordered as (
  select id, row_number() over (order by catalog_order, created_at, id) - 1 as position
  from public.products
)
update public.products as product
set catalog_order = ordered.position
from ordered
where product.id = ordered.id;

with ordered as (
  select
    id,
    row_number() over (
      partition by category_id
      order by category_order, catalog_order, created_at, id
    ) - 1 as position
  from public.products
)
update public.products as product
set category_order = ordered.position
from ordered
where product.id = ordered.id;

alter table public.categories
  add constraint categories_sort_order_unique
  unique (sort_order) deferrable initially deferred;

alter table public.products
  add constraint products_catalog_order_unique
  unique (catalog_order) deferrable initially deferred;

alter table public.products
  add constraint products_category_order_unique
  unique (category_id, category_order) deferrable initially deferred;

create unique index categories_name_unique_ci
on public.categories (lower(trim(name)));

create table public.storage_cleanup_queue (
  path text primary key,
  not_before timestamptz not null default now(),
  created_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text
);

alter table public.storage_cleanup_queue enable row level security;

create policy "Admins manage storage cleanup queue"
on public.storage_cleanup_queue for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.storage_cleanup_queue to authenticated;
grant all on public.storage_cleanup_queue to service_role;

create or replace function public.assign_product_category_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('products.catalog_order', 0));
    select coalesce(max(product.catalog_order) + 1, 0)
    into new.catalog_order
    from public.products as product
    where product.id <> new.id;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('products.category_order:' || new.category_id::text, 0));
    select coalesce(max(product.category_order) + 1, 0)
    into new.category_order
    from public.products as product
    where product.category_id = new.category_id
      and product.id <> new.id;
  elsif new.category_id is distinct from old.category_id then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('products.category_order:' || new.category_id::text, 0));
    select coalesce(max(product.category_order) + 1, 0)
    into new.category_order
    from public.products as product
    where product.category_id = new.category_id
      and product.id <> new.id;
  end if;
  return new;
end;
$$;

create or replace function public.create_category(category_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
  cleaned_name text := trim(category_name);
  category_slug text;
  base_slug text;
  suffix integer := 2;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  if char_length(cleaned_name) not between 1 and 80 then
    raise exception 'El nombre debe tener entre 1 y 80 caracteres.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('categories.sort_order', 0));
  if exists (select 1 from public.categories where lower(trim(name)) = lower(cleaned_name)) then
    raise exception 'Ya existe una categoría con ese nombre.';
  end if;

  base_slug := trim(both '-' from lower(regexp_replace(
    translate(cleaned_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )));
  if base_slug = '' then
    raise exception 'El nombre necesita al menos una letra o un número.';
  end if;
  category_slug := base_slug;
  while exists (select 1 from public.categories where slug = category_slug) loop
    category_slug := base_slug || '-' || suffix;
    suffix := suffix + 1;
  end loop;

  insert into public.categories(name, slug, sort_order)
  values (
    cleaned_name,
    category_slug,
    coalesce((select max(sort_order) + 1 from public.categories), 0)
  )
  returning id into saved_id;
  return saved_id;
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

  set constraints categories_sort_order_unique deferred;
  update public.categories as category
  set sort_order = ordered.ordinality - 1
  from unnest(category_ids) with ordinality as ordered(id, ordinality)
  where category.id = ordered.id;
end;
$$;

create or replace function public.save_categories(category_updates jsonb, category_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  update_count integer;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  if jsonb_typeof(coalesce(category_updates, '[]'::jsonb)) <> 'array' then
    raise exception 'Los cambios de categorías no son válidos.';
  end if;
  update_count := jsonb_array_length(coalesce(category_updates, '[]'::jsonb));
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(category_updates, '[]'::jsonb)) as item(id uuid, name text, expected_updated_at timestamptz)
    where char_length(trim(item.name)) not between 1 and 80
  ) then
    raise exception 'Cada nombre debe tener entre 1 y 80 caracteres.';
  end if;
  if (
    select count(*)
    from jsonb_to_recordset(coalesce(category_updates, '[]'::jsonb)) as item(id uuid, name text, expected_updated_at timestamptz)
    join public.categories as category
      on category.id = item.id and category.updated_at = item.expected_updated_at
  ) <> update_count then
    raise exception 'Otra sesión modificó una categoría. Recarga el panel antes de guardar.';
  end if;
  if (
    select count(distinct item.id)
    from jsonb_to_recordset(coalesce(category_updates, '[]'::jsonb)) as item(id uuid)
  ) <> update_count then
    raise exception 'Los cambios contienen categorías repetidas.';
  end if;

  update public.categories as category
  set name = trim(item.name)
  from jsonb_to_recordset(coalesce(category_updates, '[]'::jsonb)) as item(id uuid, name text)
  where category.id = item.id;

  perform public.reorder_categories(category_ids);
exception
  when unique_violation then
    raise exception 'Ya existe una categoría con ese nombre.';
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

  set constraints categories_sort_order_unique deferred;
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

  set constraints products_catalog_order_unique deferred;
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

  set constraints products_category_order_unique deferred;
  update public.products as product
  set category_order = ordered.ordinality - 1
  from unnest(product_ids) with ordinality as ordered(id, ordinality)
  where product.id = ordered.id and product.category_id = selected_category_id;
end;
$$;

create or replace function public.set_product_status(
  product_id uuid,
  next_status public.product_status,
  expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  update public.products as product
  set status = next_status
  where product.id = set_product_status.product_id
    and product.updated_at = set_product_status.expected_updated_at;
  if not found then
    raise exception 'La pieza cambió o ya no existe. Recarga el panel.';
  end if;
end;
$$;

create or replace function public.queue_storage_cleanup(paths text[], delay_seconds integer default 0)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  insert into public.storage_cleanup_queue(path, not_before)
  select distinct path, now() + make_interval(secs => greatest(delay_seconds, 0))
  from unnest(coalesce(paths, array[]::text[])) as queued(path)
  where nullif(trim(path), '') is not null
  on conflict (path) do update
  set not_before = least(public.storage_cleanup_queue.not_before, excluded.not_before);
end;
$$;

create or replace function public.storage_cleanup_candidates()
returns table(path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;

  delete from public.storage_cleanup_queue as queue
  where exists (
    select 1 from public.product_images as image
    where queue.path in (image.storage_path, image.storage_path_small, image.storage_path_medium)
  );

  return query
  select queue.path
  from public.storage_cleanup_queue as queue
  where queue.not_before <= now()
    and not exists (
      select 1 from public.product_images as image
      where queue.path in (image.storage_path, image.storage_path_small, image.storage_path_medium)
    )
  order by queue.created_at
  limit 200;
end;
$$;

create or replace function public.complete_storage_cleanup(paths text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  delete from public.storage_cleanup_queue as queue
  where queue.path = any(coalesce(complete_storage_cleanup.paths, array[]::text[]));
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
declare
  current_status public.product_status;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  select product.status into current_status
  from public.products as product
  where product.id = permanently_delete_product.product_id
    and product.updated_at = permanently_delete_product.expected_updated_at
  for update;
  if not found then raise exception 'La pieza cambió o ya no existe. Recarga el panel.'; end if;
  if current_status <> 'archived' then
    raise exception 'Solo puedes eliminar definitivamente una pieza archivada.';
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

create or replace function public.save_product(
  product_data jsonb,
  existing_images jsonb,
  new_images jsonb,
  removed_image_ids uuid[],
  selected_cover_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid := (product_data->>'id')::uuid;
  creating boolean := coalesce((product_data->>'is_new')::boolean, false);
  desired_status public.product_status := (product_data->>'status')::public.product_status;
  expected_updated_at timestamptz := (product_data->>'expected_updated_at')::timestamptz;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;

  if creating then
    insert into public.products (
      id, category_id, title, slug, description, price_clp, material, status,
      catalog_order, card_format, preview_fit, preview_position, crop_x, crop_y, crop_zoom
    ) values (
      saved_id,
      (product_data->>'category_id')::uuid,
      product_data->>'title',
      product_data->>'slug',
      product_data->>'description',
      (product_data->>'price_clp')::bigint,
      product_data->>'material',
      'draft',
      0,
      product_data->>'card_format',
      product_data->>'preview_fit',
      product_data->>'preview_position',
      (product_data->>'crop_x')::numeric,
      (product_data->>'crop_y')::numeric,
      (product_data->>'crop_zoom')::numeric
    );
  else
    update public.products set
      category_id = (product_data->>'category_id')::uuid,
      title = product_data->>'title',
      slug = product_data->>'slug',
      description = product_data->>'description',
      price_clp = (product_data->>'price_clp')::bigint,
      material = product_data->>'material',
      card_format = product_data->>'card_format',
      preview_fit = product_data->>'preview_fit',
      preview_position = product_data->>'preview_position',
      crop_x = (product_data->>'crop_x')::numeric,
      crop_y = (product_data->>'crop_y')::numeric,
      crop_zoom = (product_data->>'crop_zoom')::numeric
    where id = saved_id
      and (expected_updated_at is null or updated_at = expected_updated_at);
    if not found then
      raise exception 'Otra sesión modificó esta pieza. Recarga el panel antes de guardar.';
    end if;

    if desired_status <> 'published' then
      update public.products set status = desired_status where id = saved_id;
    end if;
  end if;

  update public.product_images as image set
    alt = item.alt,
    sort_order = item.sort_order,
    crop_x = item.crop_x,
    crop_y = item.crop_y,
    crop_zoom = item.crop_zoom
  from jsonb_to_recordset(coalesce(existing_images, '[]'::jsonb)) as item(
    id uuid, alt text, sort_order integer, crop_x numeric, crop_y numeric, crop_zoom numeric
  )
  where image.id = item.id and image.product_id = saved_id;

  insert into public.product_images (
    id, product_id, storage_path, storage_path_small, storage_path_medium,
    alt, sort_order, crop_x, crop_y, crop_zoom
  )
  select
    item.id, saved_id, item.storage_path, item.storage_path_small, item.storage_path_medium,
    item.alt, item.sort_order, item.crop_x, item.crop_y, item.crop_zoom
  from jsonb_to_recordset(coalesce(new_images, '[]'::jsonb)) as item(
    id uuid, storage_path text, storage_path_small text, storage_path_medium text,
    alt text, sort_order integer, crop_x numeric, crop_y numeric, crop_zoom numeric
  );

  insert into public.storage_cleanup_queue(path, not_before)
  select distinct path, now()
  from public.product_images as image
  cross join lateral (values (image.storage_path), (image.storage_path_small), (image.storage_path_medium)) as paths(path)
  where image.product_id = saved_id
    and image.id = any(coalesce(removed_image_ids, array[]::uuid[]))
    and nullif(trim(paths.path), '') is not null
  on conflict (path) do update set not_before = least(public.storage_cleanup_queue.not_before, excluded.not_before);

  delete from public.product_images
  where product_id = saved_id and id = any(coalesce(removed_image_ids, array[]::uuid[]));

  update public.products set
    status = desired_status,
    cover_image_id = selected_cover_id
  where id = saved_id;

  return saved_id;
end;
$$;

create or replace function public.set_homepage_featured(selections jsonb, expected_selections jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_selections jsonb;
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', product_id,
    'crop_x', crop_x,
    'crop_y', crop_y,
    'crop_zoom', crop_zoom
  ) order by slot), '[]'::jsonb)
  into current_selections
  from public.homepage_featured;
  if current_selections is distinct from coalesce(expected_selections, '[]'::jsonb) then
    raise exception 'Otra sesión modificó la selección de Inicio. Recarga antes de guardar.';
  end if;
  if jsonb_typeof(selections) <> 'array' or jsonb_array_length(selections) <> 3 then
    raise exception 'Debes elegir exactamente tres piezas.';
  end if;
  if (select count(distinct item->>'product_id') from jsonb_array_elements(selections) as item) <> 3 then
    raise exception 'Debes elegir exactamente tres piezas diferentes.';
  end if;
  if (
    select count(*) from public.products
    where id in (select (item->>'product_id')::uuid from jsonb_array_elements(selections) as item)
      and status = 'published'
  ) <> 3 then
    raise exception 'Las tres piezas deben estar publicadas.';
  end if;

  delete from public.homepage_featured;
  insert into public.homepage_featured(slot, product_id, crop_x, crop_y, crop_zoom)
  select
    ordinality::smallint,
    (item->>'product_id')::uuid,
    least(100, greatest(0, coalesce((item->>'crop_x')::numeric, 50))),
    least(100, greatest(0, coalesce((item->>'crop_y')::numeric, 50))),
    least(3, greatest(0.25, coalesce((item->>'crop_zoom')::numeric, 1)))
  from jsonb_array_elements(selections) with ordinality as selected(item, ordinality);
end;
$$;

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
  if exists (
    select 1
    from public.products as product
    where product.status = 'draft'
      and not exists (
        select 1 from public.product_images as image where image.product_id = product.id
      )
  ) then
    raise exception 'Hay borradores sin fotografías. Agrégales una imagen o publícalos individualmente.';
  end if;
  update public.products set status = 'published' where status = 'draft';
  get diagnostics published_count = row_count;
  return published_count;
end;
$$;

revoke all on function public.create_category(text) from public;
revoke all on function public.save_categories(jsonb, uuid[]) from public;
revoke all on function public.delete_category(uuid, timestamptz) from public;
revoke all on function public.reorder_products(uuid[], uuid[]) from public;
revoke all on function public.reorder_category_products(uuid, uuid[], uuid[]) from public;
revoke all on function public.set_product_status(uuid, public.product_status, timestamptz) from public;
revoke all on function public.queue_storage_cleanup(text[], integer) from public;
revoke all on function public.storage_cleanup_candidates() from public;
revoke all on function public.complete_storage_cleanup(text[]) from public;
revoke all on function public.permanently_delete_product(uuid, timestamptz) from public;
revoke all on function public.set_homepage_featured(jsonb, jsonb) from public;

grant execute on function public.create_category(text) to authenticated;
grant execute on function public.save_categories(jsonb, uuid[]) to authenticated;
grant execute on function public.delete_category(uuid, timestamptz) to authenticated;
grant execute on function public.reorder_products(uuid[], uuid[]) to authenticated;
grant execute on function public.reorder_category_products(uuid, uuid[], uuid[]) to authenticated;
grant execute on function public.set_product_status(uuid, public.product_status, timestamptz) to authenticated;
grant execute on function public.queue_storage_cleanup(text[], integer) to authenticated;
grant execute on function public.storage_cleanup_candidates() to authenticated;
grant execute on function public.complete_storage_cleanup(text[]) to authenticated;
grant execute on function public.permanently_delete_product(uuid, timestamptz) to authenticated;
grant execute on function public.set_homepage_featured(jsonb, jsonb) to authenticated;
