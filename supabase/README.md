# Configuración de Supabase

## 1. Opciones del proyecto

- **Enable Data API:** activado.
- **Automatically expose new tables:** desactivado.
- **Enable automatic RLS:** activado.

## 2. Crear la estructura

Abre **SQL Editor → New query**, pega el contenido de
`supabase/migrations/202608020001_initial_catalog.sql` y ejecútalo una sola vez.

## 3. Crear la cuenta administradora

1. Abre **Authentication → Users → Add user**.
2. Crea la cuenta con correo y contraseña y marca el correo como confirmado.
3. Copia el UUID del usuario.
4. Ejecuta en SQL Editor, reemplazando el UUID:

```sql
insert into public.admin_users (user_id)
values ('UUID-DE-LA-CUENTA');
```

Mantén desactivado el registro público en **Authentication → Sign In / Providers**.

## 4. Conectar el desarrollo local

Crea `.env.local` a partir de `.env.example` usando la **Project URL** y la
**Publishable key**. La clave `secret` o `service_role` nunca debe guardarse en
un archivo `VITE_*`, en Git ni en el navegador.

## 5. Migrar el catálogo existente

La migración carga las fotografías WebP y crea las piezas como borradores sin
precio. La clave secreta se usa solo durante este comando y no se incorpora al
sitio:

```bash
read -s "SUPABASE_SECRET_KEY?Pega la clave secreta y presiona Enter: "
export SUPABASE_SECRET_KEY
npm run migrate:catalog
unset SUPABASE_SECRET_KEY
```

Luego entra a `/admin`, añade los precios, publica las piezas y configura las
tres posiciones de inicio. El script se detiene si encuentra piezas existentes
para evitar duplicaciones.

## 6. Activar reencuadre y publicación masiva

Si ya ejecutaste la migración inicial, abre **SQL Editor → New query**, pega el
contenido completo de `supabase/migrations/202608030003_visual_cropping.sql` y
ejecútalo una sola vez. Esta actualización:

- permite reencuadrar por separado la portada y cada fotografía;
- hace que el precio sea opcional (en el sitio se verá como “Precio por definir”);
- añade el botón **Publicar todos** al panel de piezas.

Después entra a `/admin/piezas` y pulsa **Publicar todos**. Además de publicar
los borradores, se recuperan automáticamente las tres piezas que aparecían en
Inicio antes de la migración.

## 7. Activar direcciones que siguen los cambios de nombre

Abre **SQL Editor → New query**, pega el contenido de
`supabase/migrations/202608030004_product_slug_history.sql` y ejecútalo una sola
vez. Desde ese momento, al cambiar el nombre de una pieza también cambia su URL.
Las direcciones anteriores se conservan como alias y redirigen a la nueva para
no romper enlaces que ya hayan sido compartidos.

## 8. GitHub Pages

Crea estas variables en **Settings → Secrets and variables → Actions →
Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

El workflow ya las entrega a Vite durante el build.

## 9. Portadas, encuadres de Inicio e imágenes responsivas

Ejecuta `supabase/migrations/202608030005_admin_seo_images.sql` en el SQL
Editor antes de desplegar la versión correspondiente. La migración permite
elegir una fotografía de portada sin alterar el orden de la galería, guardar un
encuadre independiente para Inicio y registrar variantes WebP para móvil.
