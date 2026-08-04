# La Garza

Sitio vitrina del taller de cerámica La Garza, Valdivia, migrado a React 19.

## Desarrollo local

```bash
npm install
npm run dev
```

Sin variables de Supabase, el proyecto usa el catálogo local como respaldo. Para
trabajar con el panel y los datos remotos, copia `.env.example` a `.env.local` y
completa la URL y la clave publicable del proyecto.

## Producción

```bash
npm run build
npm run preview
```

## GitHub Pages

El repositorio está configurado para publicarse en
`https://clemoacevedo.github.io/lagarzaceramica/`.

Cada push a `main` ejecuta `.github/workflows/deploy.yml`, compila el proyecto
y publica `dist/`. En GitHub se debe seleccionar una sola vez:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

El build genera HTML indexable para cada ruta pública, metadatos sociales y un
sitemap basado en las piezas publicadas de Supabase. El workflow también se
ejecuta una vez al día para incorporar al sitemap las piezas creadas desde el
panel sin necesitar un nuevo commit.

Vite usa `/lagarzaceramica/` como base durante el build. El archivo
`dist/404.html` permite abrir y recargar directamente las rutas internas.

## Rutas

- `/`: inicio.
- `/sobre-la-garza`: historia, filosofía y proceso.
- `/piezas`: vitrina filtrable, sin carrito ni pagos.
- `/talleres`: metodología, información y preguntas frecuentes.
- `/admin/login`: acceso al panel.
- `/admin/piezas`: administración protegida del catálogo.
- `/admin/categorias`: categorías y su orden.
- `/admin/inicio`: tres piezas de la selección de inicio.

## Estructura

- `src/components/`: componentes compartidos de interfaz.
- `src/pages/`: páginas asociadas a las rutas.
- `src/hooks/`: metadatos, scroll y animaciones de entrada.
- `src/data/`: contenido estructurado del catálogo.
- `src/admin/`: interfaz protegida de administración.
- `src/context/` y `src/lib/`: sesión, consultas y operaciones de Supabase.
- `supabase/`: migración SQL, RLS y guía de configuración.
- `src/styles/`: CSS propio separado por responsabilidad.
- `src/assets/media.js`: referencias a los recursos originales.
- `optimized/`: derivados WebP de las fotografías seleccionadas.
- `fullphotos/`: originales fotográficos, conservados sin cambios.
- `assets/`: identidad visual oficial, conservada sin cambios.
- `legacy/`: implementación estática anterior, conservada como referencia.

La navegación usa React Router. Vite genera el paquete de producción en `dist/`.
El servidor de producción debe redirigir las rutas desconocidas a `index.html`
para permitir la navegación directa a las rutas internas.

## Publicación y SEO

Después del primer despliegue:

1. Registra `https://clemoacevedo.github.io/lagarzaceramica/` en Google Search
   Console y envía `/lagarzaceramica/sitemap.xml`.
2. Valida Inicio y una ficha con Rich Results Test y la inspección de URLs.
3. Completa el Perfil de Empresa de Google con el mismo nombre, teléfono,
   Instagram y localidad que aparecen en la web.
4. Si se conecta un dominio propio, actualiza `rootUrl` en
   `scripts/build-seo.mjs`, el canonical inicial de `index.html`, `robots.txt`
   y la URL documentada aquí.

Las rutas administrativas y la página 404 se marcan como `noindex`.

## Contenido pendiente

Antes de publicar se debe confirmar con la clienta:

1. Historia y filosofía definitivas.
2. Metodología, calendario, duración y valores de talleres.
3. Nombres y descripciones definitivas de las piezas.

Los textos pendientes conservan el atributo
`data-content-status="provisional"` en sus componentes de página.

## Catálogo y administración

En producción, Supabase almacena piezas, precios CLP opcionales, categorías,
fotografías, sus encuadres y la selección de inicio. El panel permite crear
borradores, publicar todas las piezas de una vez, archivar, restaurar, borrar y
definir el orden general de la vitrina arrastrando las tarjetas desde cualquier
punto. Al cambiar un título también cambia su URL; las direcciones anteriores
se conservan como redirecciones.

La vitrina pública permite buscar, filtrar por categoría y precio, establecer
un rango y ordenar por precio o nombre.

El acceso combina un guard de rutas en React con Supabase Auth y políticas RLS.
Los visitantes solo pueden leer piezas publicadas y únicamente las cuentas
incluidas en `admin_users` pueden escribir. Consulta [supabase/README.md](supabase/README.md)
para crear la estructura, la primera cuenta y migrar el catálogo existente.
