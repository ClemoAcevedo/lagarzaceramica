# La Garza

Sitio vitrina y panel de administración del taller de cerámica La Garza,
Valdivia. Está construido con React 19, Vite, Supabase y GitHub Pages.

## Requisitos

- Node.js 24.
- npm.
- Variables públicas de Supabase para usar el catálogo remoto y el panel.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY`. El archivo es local y está excluido de Git.
Sin esas variables, las páginas públicas usan el catálogo de respaldo; el panel
de administración requiere Supabase.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor local de desarrollo. |
| `npm run build` | Build de producción, snapshots SEO y sitemap. |
| `npm run preview` | Vista previa del build. |
| `npm test` | Pruebas funcionales en escritorio y móvil. |
| `npm run test:preview` | Build local y pruebas de snapshots SEO. |
| `npm run check` | Build y todas las pruebas antes de entregar. |
| `npm run db:status` | Compara migraciones locales y remotas. |
| `npm run db:push:dry` | Simula un despliegue de migraciones. |
| `npm run db:push` | Aplica las migraciones pendientes. |

## Rutas

- `/`: inicio.
- `/sobre-la-garza`: historia, filosofía y proceso.
- `/piezas`: vitrina con búsqueda, filtros y ordenamientos.
- `/talleres`: metodología, información y preguntas frecuentes.
- `/admin/login`: acceso al panel.
- `/admin/piezas`: catálogo, estados y orden general o por categoría.
- `/admin/categorias`: nombres y orden de categorías.
- `/admin/inicio`: selección de tres piezas para Inicio.

## Estructura

- `src/pages/`: páginas públicas asociadas a las rutas.
- `src/components/`: componentes compartidos.
- `src/admin/`: panel protegido.
- `src/context/`, `src/hooks/` y `src/lib/`: estado, sesión y acceso a datos.
- `src/styles/`: estilos separados por responsabilidad.
- `src/assets/media.js`: referencias centralizadas a imágenes y marca.
- `supabase/migrations/`: historial versionado de la base de datos.
- `scripts/`: generación SEO e importación inicial del catálogo.
- `tests/` y `tests-preview/`: pruebas funcionales y del build estático.
- `optimized/`: derivados WebP utilizados por el sitio.
- `assets/`: identidad visual oficial original.
- `fullphotos/`: archivo fotográfico original, excluido de Git.
- `legacy/`: versión estática anterior conservada como referencia.

## Catálogo y administración

Supabase almacena piezas, precios CLP opcionales, categorías, fotografías,
encuadres y la selección de Inicio. El panel permite crear borradores, publicar,
archivar, restaurar y eliminar piezas. La vitrina completa y cada categoría
tienen órdenes independientes administrables mediante arrastre.

El acceso combina rutas protegidas con Supabase Auth y políticas RLS. Las
personas visitantes solo pueden leer piezas publicadas y únicamente las cuentas
incluidas en `admin_users` pueden escribir. La operación de la base está
documentada en [supabase/README.md](supabase/README.md).

## Despliegue

Cada push a `main` ejecuta `.github/workflows/deploy.yml`. El workflow instala
dependencias, ejecuta las pruebas, compila y publica `dist/` en GitHub Pages. Se
ejecuta además una vez por semana para regenerar el sitemap con las piezas publicadas
desde el panel.

En GitHub deben existir estas variables de Actions:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

La URL pública y canónica es `https://lagarzaceramica.cl/`. Vite compila desde
la raíz (`/`) y GitHub Pages conserva el dominio configurado en **Settings →
Pages → Custom domain**. Como el despliegue usa GitHub Actions, no se requiere
un archivo `CNAME` en el repositorio ni dentro del build.

## Estado del lanzamiento

`lagarzaceramica.cl` está configurado en GitHub Pages con HTTPS obligatorio. El
dominio `www` redirige a la URL canónica, y el sitemap ya fue enviado desde
Google Search Console.

El único cambio pendiente es sustituir el logo horizontal `Logo E26.svg`. La
marca decorativa `E28` y el favicon actuales son definitivos. Como el nuevo logo
conservará proporciones similares, solo debería requerir una comprobación visual.

Consulta el procedimiento detallado en
[docs/launch-checklist.md](docs/launch-checklist.md).
