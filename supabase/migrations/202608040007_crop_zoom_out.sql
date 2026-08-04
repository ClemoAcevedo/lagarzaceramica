alter table public.products
  drop constraint if exists products_crop_zoom_check;

alter table public.products
  add constraint products_crop_zoom_check check (crop_zoom between 0.25 and 3);

alter table public.product_images
  drop constraint if exists product_images_crop_zoom_check;

alter table public.product_images
  add constraint product_images_crop_zoom_check check (crop_zoom between 0.25 and 3);

alter table public.homepage_featured
  drop constraint if exists homepage_featured_crop_zoom_check;

alter table public.homepage_featured
  add constraint homepage_featured_crop_zoom_check check (crop_zoom between 0.25 and 3);

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
    least(3, greatest(0.25, coalesce((item->>'crop_zoom')::numeric, 1)))
  from jsonb_array_elements(selections) with ordinality as selected(item, ordinality);
end;
$$;

revoke all on function public.set_homepage_featured(jsonb) from public;
grant execute on function public.set_homepage_featured(jsonb) to authenticated;
