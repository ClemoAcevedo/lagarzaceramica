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

  -- pg-safeupdate rejects DELETE statements without an explicit WHERE clause.
  -- These are the only slots permitted by the table constraint.
  delete from public.homepage_featured
  where slot between 1 and 3;

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

revoke all on function public.set_homepage_featured(jsonb, jsonb) from public;
grant execute on function public.set_homepage_featured(jsonb, jsonb) to authenticated;
