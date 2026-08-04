import { instagramUrl, whatsappNumber } from '../utils/links.js';

export function siteRootUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export function businessStructuredData() {
  const root = siteRootUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${root}#website`,
        url: root,
        name: 'La Garza',
        inLanguage: 'es-CL',
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${root}#taller`,
        name: 'La Garza',
        description: 'Taller de cerámica en gres hecho a mano en Valdivia, Chile.',
        url: root,
        telephone: `+${whatsappNumber}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Valdivia',
          addressRegion: 'Los Ríos',
          addressCountry: 'CL',
        },
        sameAs: [instagramUrl],
      },
    ],
  };
}

export function productStructuredData(product) {
  if (!product) return null;
  const url = new URL(`piezas/${product.slug}`, siteRootUrl()).href;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#product`,
      name: product.title,
      description: product.description,
      image: product.images.map(({ src }) => src),
      material: product.material,
      category: product.collection,
      brand: { '@type': 'Brand', name: 'La Garza' },
      url,
      ...(product.priceClp ? {
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'CLP',
          price: product.priceClp,
          seller: { '@id': `${siteRootUrl()}#taller` },
        },
      } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteRootUrl() },
        { '@type': 'ListItem', position: 2, name: 'Piezas', item: new URL('piezas', siteRootUrl()).href },
        { '@type': 'ListItem', position: 3, name: product.title, item: url },
      ],
    },
  ];
}

export function pageStructuredData({ type = 'WebPage', name, description, path = '', image }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url: new URL(path, siteRootUrl()).href,
    ...(image ? { primaryImageOfPage: new URL(image, window.location.origin).href } : {}),
    isPartOf: { '@id': `${siteRootUrl()}#website` },
    about: { '@id': `${siteRootUrl()}#taller` },
    inLanguage: 'es-CL',
  };
}
