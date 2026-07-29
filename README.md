# La Garza

Sitio vitrina del taller de cerámica La Garza, Valdivia, migrado a React 19.

## Desarrollo local

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

## Rutas

- `/`: inicio.
- `/about`: historia, filosofía y proceso.
- `/products`: vitrina filtrable, sin carrito ni pagos.
- `/workshops`: metodología, información y preguntas frecuentes.

## Estructura

- `src/components/`: componentes compartidos de interfaz.
- `src/pages/`: páginas asociadas a las rutas.
- `src/hooks/`: metadatos, scroll y animaciones de entrada.
- `src/data/`: contenido estructurado del catálogo.
- `src/styles/`: CSS propio separado por responsabilidad.
- `src/assets/media.js`: referencias a los recursos originales.
- `optimized/`: derivados WebP de las fotografías seleccionadas.
- `fullphotos/`: originales fotográficos, conservados sin cambios.
- `assets/`: identidad visual oficial, conservada sin cambios.
- `legacy/`: implementación estática anterior, conservada como referencia.

La navegación usa React Router. Vite genera el paquete de producción en `dist/`.
El servidor de producción debe redirigir las rutas desconocidas a `index.html`
para permitir la navegación directa a las rutas internas.

## Contenido pendiente

Antes de publicar se debe confirmar con la clienta:

1. Historia y filosofía definitivas.
2. Metodología, calendario, duración y valores de talleres.
3. Número de WhatsApp para sustituir los enlaces `wa.me` sin número.
4. Usuario oficial de Instagram.
5. Nombres y descripciones definitivas de las piezas.

Los textos pendientes conservan el atributo
`data-content-status="provisional"` en sus componentes de página.

## Categorías de piezas

Las piezas y categorías se administran en `src/data/products.js`. Los filtros
se mantienen sincronizados mediante `productFilters` y la propiedad `category`
de cada pieza.
