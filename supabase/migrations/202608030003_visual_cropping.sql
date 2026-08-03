alter table public.products
  add column if not exists crop_x numeric(5, 2) not null default 50
    check (crop_x between 0 and 100),
  add column if not exists crop_y numeric(5, 2) not null default 50
    check (crop_y between 0 and 100),
  add column if not exists crop_zoom numeric(4, 2) not null default 1
    check (crop_zoom between 1 and 3);

-- Conserva los encuadres especiales que existían antes de la herramienta visual.
update public.products
set crop_y = 100
where preview_position = 'bottom';

alter table public.product_images
  add column if not exists crop_x numeric(5, 2) not null default 50
    check (crop_x between 0 and 100),
  add column if not exists crop_y numeric(5, 2) not null default 50
    check (crop_y between 0 and 100),
  add column if not exists crop_zoom numeric(4, 2) not null default 1
    check (crop_zoom between 1 and 3);

alter table public.products
  drop constraint if exists published_product_has_price;

create or replace function public.validate_published_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.product_images where product_id = new.id
  ) then
    raise exception 'Una pieza publicada necesita al menos una imagen.';
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
