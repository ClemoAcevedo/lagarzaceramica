alter table public.product_images
  add column if not exists storage_path_small text,
  add column if not exists storage_path_medium text;

alter table public.products
  add column if not exists cover_image_id uuid;

update public.products as product
set cover_image_id = (
  select image.id
  from public.product_images as image
  where image.product_id = product.id
  order by image.sort_order, image.created_at
  limit 1
)
where cover_image_id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_cover_image_id_fkey'
  ) then
    alter table public.products
      add constraint products_cover_image_id_fkey
      foreign key (cover_image_id)
      references public.product_images(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.validate_product_cover()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cover_image_id is not null and not exists (
    select 1 from public.product_images
    where id = new.cover_image_id and product_id = new.id
  ) then
    raise exception 'La portada debe pertenecer a la misma pieza.';
  end if;
  return new;
end;
$$;

drop trigger if exists products_validate_cover on public.products;
create trigger products_validate_cover
before insert or update of cover_image_id on public.products
for each row execute function public.validate_product_cover();

alter table public.homepage_featured
  add column if not exists crop_x numeric(5, 2) not null default 50 check (crop_x between 0 and 100),
  add column if not exists crop_y numeric(5, 2) not null default 50 check (crop_y between 0 and 100),
  add column if not exists crop_zoom numeric(4, 2) not null default 1 check (crop_zoom between 1 and 3);

create or replace function public.set_homepage_featured(selections jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado.'; end if;
  if jsonb_typeof(selections) <> 'array' or jsonb_array_length(selections) <> 3 then
    raise exception 'Debes elegir exactamente tres piezas.';
  end if;
  if (
    select count(distinct item->>'product_id')
    from jsonb_array_elements(selections) as item
  ) <> 3 then
    raise exception 'Debes elegir exactamente tres piezas diferentes.';
  end if;
  if (
    select count(*)
    from public.products
    where id in (
      select (item->>'product_id')::uuid
      from jsonb_array_elements(selections) as item
    ) and status = 'published'
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
    least(3, greatest(1, coalesce((item->>'crop_zoom')::numeric, 1)))
  from jsonb_array_elements(selections) with ordinality as selected(item, ordinality);
end;
$$;

revoke all on function public.set_homepage_featured(jsonb) from public;
grant execute on function public.set_homepage_featured(jsonb) to authenticated;

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
      coalesce((select max(catalog_order) + 1 from public.products), 0),
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
    where id = saved_id;
    if not found then raise exception 'La pieza ya no existe.'; end if;
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

  delete from public.product_images
  where product_id = saved_id and id = any(coalesce(removed_image_ids, array[]::uuid[]));

  update public.products set
    status = (product_data->>'status')::public.product_status,
    cover_image_id = selected_cover_id
  where id = saved_id;

  return saved_id;
end;
$$;

revoke all on function public.save_product(jsonb, jsonb, jsonb, uuid[], uuid) from public;
grant execute on function public.save_product(jsonb, jsonb, jsonb, uuid[], uuid) to authenticated;
