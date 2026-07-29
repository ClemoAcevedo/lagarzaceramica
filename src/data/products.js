import {
  image5,
  image9,
  image12,
  image18,
  image23,
  image26,
  image41,
  image43,
  image46,
  image70,
  image74,
  image76,
  image90,
  image91,
  image102,
  image103,
  image104,
  image107,
  image116,
  image117,
  image123,
  image124,
  image125,
} from '../assets/media.js';
import { whatsappUrl } from '../utils/links.js';

const productEntries = [
  {
    id: 'coleccion-gallinas',
    slug: 'gallina-contenedora',
    category: 'especial',
    collection: 'Especiales',
    title: 'Gallina contenedora',
    description: 'Pieza escultórica con tapa, modelada y texturada a mano con acentos de esmalte rojo.',
    images: [
      { src: image12, alt: 'Familia de gallinas contenedoras de cerámica' },
      { src: image5, alt: 'Gallina contenedora de cerámica en primer plano' },
      { src: image9, alt: 'Conjunto de gallinas contenedoras en distintos tamaños' },
    ],
    format: 'landscape',
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por la Gallina contenedora.'),
  },
  {
    slug: 'cuencos-de-ribera',
    category: 'natural',
    collection: 'Natural',
    title: 'Cuencos de ribera',
    description: 'Cuencos de borde orgánico y superficie mate, disponibles en distintos formatos.',
    images: [
      { src: image23, alt: 'Conjunto de cuencos de gres en tonos naturales' },
      { src: image18, alt: 'Cuenco de ribera visto de frente' },
      { src: image26, alt: 'Familia de cuencos de ribera agrupados' },
    ],
    format: 'landscape',
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por los Cuencos de ribera.'),
  },
  {
    id: 'coleccion-azul',
    slug: 'familia-azul-rio',
    category: 'azul',
    collection: 'Azul río',
    title: 'Familia Azul Río',
    description: 'Platos y cuencos de silueta libre con esmalte profundo, azul y blanco.',
    images: [
      { src: image43, alt: 'Familia de vajilla esmaltada en azul' },
      { src: image41, alt: 'Plato y cuenco Azul Río vistos desde arriba' },
      { src: image46, alt: 'Familia Azul Río sostenida entre las manos' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por la Familia Azul Río.'),
  },
  {
    slug: 'testas-de-erizos',
    category: 'natural',
    collection: 'Natural',
    title: 'Testas de erizos',
    description: 'Piezas escultóricas de textura envolvente, esmalte interior oliva y terminación exterior cruda.',
    images: [
      { src: image74, alt: 'Conjunto de testas de erizos en cerámica color marfil' },
      { src: image70, alt: 'Testa de erizo de cerámica texturada en primer plano' },
      { src: image76, alt: 'Familia de testas de erizos vista desde arriba' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por las Testas de erizos.'),
  },
  {
    id: 'coleccion-tierra',
    slug: 'taza-de-campo',
    category: 'tierra',
    collection: 'Tierra',
    title: 'Taza de campo',
    description: 'Taza de asa amplia con esmalte miel, pensada para acompañar los rituales cotidianos.',
    images: [
      { src: image103, alt: 'Tazas de gres color tierra sobre una pila de platos' },
      { src: image102, alt: 'Tazas de campo agrupadas junto a platos de gres' },
      { src: image104, alt: 'Conjunto de tazas de campo y platos color tierra' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por la Taza de campo.'),
  },
  {
    slug: 'florero-jardin',
    category: 'especial',
    collection: 'Especiales',
    title: 'Florero jardín',
    description: 'Objeto único construido y decorado a mano con flores en relieve.',
    previewFit: 'bottom',
    images: [
      { src: image107, alt: 'Florero turquesa con flores modeladas en cerámica' },
      { src: image90, alt: 'Cuenco de la línea Jardín con flores modeladas' },
      { src: image91, alt: 'Detalle lateral de flores modeladas de la línea Jardín' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por el Florero jardín.'),
  },
  {
    slug: 'fuente-orilla',
    category: 'natural',
    collection: 'Natural',
    title: 'Fuente orilla',
    description: 'Fuente de centro sereno y borde ondulado, terminada en esmalte crema moteado.',
    images: [
      { src: image116, alt: 'Fuente ovalada de borde ondulado' },
      { src: image117, alt: 'Fuente orilla vista en perspectiva' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por la Fuente orilla.'),
  },
  {
    slug: 'vasos-bosque',
    category: 'tierra',
    collection: 'Tierra',
    title: 'Vasos bosque',
    description: 'Vasos de pared recta, textura suave y esmalte en tonos humo.',
    images: [
      { src: image123, alt: 'Grupo de vasos cilíndricos de gres oscuro' },
      { src: image124, alt: 'Vasos bosque agrupados sobre una bandeja de gres' },
      { src: image125, alt: 'Detalle de los vasos bosque y su esmalte interior' },
    ],
    contactUrl: whatsappUrl('Hola La Garza, quisiera consultar por los Vasos bosque.'),
  },
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const products = productEntries.map((product) => ({
  ...product,
  slug: product.slug || slugify(product.title),
  image: product.images[0].src,
  alt: product.images[0].alt,
}));

export const productFilters = [
  { value: 'all', label: 'Todas' },
  ...Array.from(
    new Map(products.map(({ category, collection }) => [category, collection])).entries(),
    ([value, label]) => ({ value, label }),
  ),
];

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}
