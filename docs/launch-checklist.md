# Checklist de lanzamiento

Este documento registra el lanzamiento de `lagarzaceramica.cl`.

## Dominio

La URL canónica prevista es `https://lagarzaceramica.cl/`; `www` debe redirigir
a ella.

1. Verificar el dominio en la cuenta propietaria de GitHub. — Hecho
2. Configurar `lagarzaceramica.cl` en **Settings → Pages → Custom domain**. — Hecho
3. Crear en el proveedor DNS los registros `A` del dominio raíz indicados por
   GitHub Pages y un `CNAME` de `www` hacia `clemoacevedo.github.io`. — Hecho
4. Esperar la propagación, comprobar ambos hostnames y activar **Enforce HTTPS**.
   — Hecho; HTTP redirige a HTTPS y `www` redirige al dominio principal.
5. Cambiar la base de producción de Vite desde `/lagarzaceramica/` a `/`. — Hecho
6. Sustituir la URL temporal en `scripts/build-seo.mjs`, `index.html`,
   `public/robots.txt`, `public/sitemap.xml` y la documentación. — Hecho
7. Compilar y verificar canonical, Open Graph, sitemap, rutas directas y 404.
   — Hecho en local y sobre el despliegue público.
8. Registrar la propiedad de dominio `lagarzaceramica.cl` en Google Search
   Console y enviar `https://lagarzaceramica.cl/sitemap.xml`. — Hecho
9. Añadir el dominio a Supabase Auth si se habilitan recuperación de contraseña,
   enlaces por correo u OAuth. — Hecho; también se conservaron las redirecciones
   locales de desarrollo.

GitHub Actions publica este proyecto, por lo que no necesita un archivo `CNAME`
dentro del build; GitHub ignora ese archivo en workflows personalizados y el
dominio se conserva en la configuración de Pages.

## Identidad visual

Los archivos de marca cumplen tres funciones:

| Uso | Archivo actual |
| --- | --- |
| Header, login y panel | `assets/SVG Files (Transparent Background)/lagarzahorizontal.svg` — definitivo |
| Marca decorativa y footer | `assets/SVG Files (Transparent Background)/Logo E28.svg` — definitivo |
| Icono del navegador | `assets/Favicon Square A1-01.png` — definitivo |

El logotipo horizontal final se centraliza en `src/assets/media.js`; esto lo usa
el header público, el acceso y el panel. Tras cualquier cambio de marca, revisar
esas tres vistas y ejecutar `npm run check` para detectar saltos de layout.
