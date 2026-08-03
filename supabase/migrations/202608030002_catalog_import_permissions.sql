-- Proyectos creados con "Automatically expose new tables" desactivado no
-- conceden privilegios de tablas nuevos de forma automática. Esta migración
-- permite que una Secret key ejecute exclusivamente la importación inicial.
grant all on public.admin_users, public.categories, public.products, public.product_images, public.homepage_featured to service_role;
grant usage on type public.product_status to service_role;
