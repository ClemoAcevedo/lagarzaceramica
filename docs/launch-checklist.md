# Checklist de lanzamiento

Este documento reúne los cambios pendientes para publicar el logo horizontal
final y usar `lagarzaceramica.cl`. No deben aplicarse hasta tener acceso al
proveedor DNS y recibir el nuevo SVG.

## Dominio

La URL canónica prevista es `https://lagarzaceramica.cl/`; `www` debe redirigir
a ella.

1. Verificar el dominio en la cuenta propietaria de GitHub.
2. Configurar `lagarzaceramica.cl` en **Settings → Pages → Custom domain**.
3. Crear en el proveedor DNS los registros `A` del dominio raíz indicados por
   GitHub Pages y un `CNAME` de `www` hacia `clemoacevedo.github.io`.
4. Esperar la propagación, comprobar ambos hostnames y activar **Enforce HTTPS**.
5. Cambiar la base de producción de Vite desde `/lagarzaceramica/` a `/`.
6. Sustituir la URL temporal en `scripts/build-seo.mjs`, `index.html`,
   `public/robots.txt`, `public/sitemap.xml` y la documentación.
7. Compilar y verificar canonical, Open Graph, sitemap, rutas directas y 404.
8. Registrar ambas propiedades en Google Search Console y enviar
   `https://lagarzaceramica.cl/sitemap.xml`.
9. Añadir el dominio a Supabase Auth si se habilitan recuperación de contraseña,
   enlaces por correo u OAuth.

GitHub Actions publica este proyecto, por lo que no necesita un archivo `CNAME`
dentro del build; el dominio se conserva en la configuración de Pages.

## Identidad visual

Los archivos de marca cumplen tres funciones:

| Uso | Archivo actual |
| --- | --- |
| Header, login y panel | `assets/SVG Files (Transparent Background)/Logo E26.svg` — pendiente |
| Marca decorativa y footer | `assets/SVG Files (Transparent Background)/Logo E28.svg` — definitivo |
| Icono del navegador | `assets/Favicon Square A1-01.png` — definitivo |

Cuando llegue el nuevo `E26`:

1. Exportar el SVG con fondo transparente y un `viewBox` ajustado al dibujo.
2. Sustituir `Logo E26.svg`; si cambia su nombre, actualizar una sola referencia
   en `src/assets/media.js`.
3. Revisar header normal y superpuesto, menú móvil, login y panel.
4. Ejecutar `npm run check` y comprobar que no haya saltos de layout.

Como el nuevo logo mantendrá proporciones similares, no se anticipan cambios de
composición; los tamaños CSS solo se tocarán si la comprobación visual lo exige.
