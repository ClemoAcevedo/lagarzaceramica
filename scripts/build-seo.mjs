import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootUrl = 'https://lagarzaceramica.cl/';
const distDir = new URL('../dist/', import.meta.url);

function loadLocalEnv() {
  const path = new URL('../.env.local', import.meta.url);
  if (!existsSync(path)) return;
  return readFile(path, 'utf8').then((contents) => {
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);
const escapeHtml = (value) => String(value).replace(/[<>&"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[character]);

async function fetchProducts() {
  await loadLocalEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client
    .from('products')
    .select('slug,title,description,material,price_clp,updated_at,images:product_images!product_images_product_id_fkey(storage_path,alt,sort_order)')
    .eq('status', 'published')
    .order('catalog_order')
    .order('sort_order', { referencedTable: 'product_images' });
  if (error) throw error;
  return data.map((product) => ({
    ...product,
    images: product.images.map((image) => ({
      ...image,
      url: client.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl,
    })),
  }));
}

async function fallbackProducts() {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  return [...sitemap.matchAll(/<loc>[^<]*\/piezas\/([^<\/]+)<\/loc>/g)].map(([, slug]) => ({
    slug,
    title: slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: `Pieza de cerámica en gres hecha a mano por La Garza en Valdivia.`,
    material: 'Gres',
    images: [],
  }));
}

function setMeta(html, selector, content) {
  const [attribute, key] = selector;
  const pattern = new RegExp(`<meta\\s+([^>]*${attribute}=["']${key}["'][^>]*)>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`;
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace('</head>', `    ${replacement}\n  </head>`);
}

function snapshotHtml(baseHtml, page, products) {
  const canonical = new URL(page.path.replace(/^\//, ''), rootUrl).href;
  let html = baseHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  html = setMeta(html, ['name', 'description'], page.description);
  html = setMeta(html, ['name', 'robots'], page.robots || 'index,follow,max-image-preview:large');
  html = setMeta(html, ['property', 'og:title'], page.title);
  html = setMeta(html, ['property', 'og:description'], page.description);
  html = setMeta(html, ['property', 'og:url'], canonical);
  html = setMeta(html, ['property', 'og:type'], page.type || 'website');
  html = setMeta(html, ['name', 'twitter:card'], page.image ? 'summary_large_image' : 'summary');
  html = setMeta(html, ['name', 'twitter:title'], page.title);
  html = setMeta(html, ['name', 'twitter:description'], page.description);
  if (page.image) {
    html = setMeta(html, ['property', 'og:image'], page.image);
    html = setMeta(html, ['name', 'twitter:image'], page.image);
  }
  html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);

  const links = (page.includeProducts ? products : []).map((product) => `<li><a href="${new URL(`piezas/${product.slug}`, rootUrl).href}">${escapeHtml(product.title)}</a></li>`).join('');
  const body = `<main id="contenido" class="seo-snapshot"><p>La Garza · Valdivia, Chile</p><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${links ? `<ul>${links}</ul>` : ''}</main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const structured = {
    '@context': 'https://schema.org',
    '@type': page.schemaType || 'WebPage',
    name: page.heading,
    description: page.description,
    url: canonical,
    ...(page.product ? {
      '@type': 'Product',
      image: page.product.images.map(({ url }) => url),
      material: page.product.material,
      brand: { '@type': 'Brand', name: 'La Garza' },
      ...(page.product.price_clp ? { offers: { '@type': 'Offer', url: canonical, priceCurrency: 'CLP', price: page.product.price_clp } } : {}),
    } : {}),
  };
  html = html.replace('</head>', `    <script type="application/ld+json" data-la-garza-snapshot>${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>\n  </head>`);
  return html;
}

async function writeRoute(path, html) {
  if (path === '/') {
    await writeFile(new URL('index.html', distDir), html);
    return;
  }
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  const directoryFile = new URL(`${clean}/index.html`, distDir);
  await mkdir(dirname(directoryFile.pathname), { recursive: true });
  await writeFile(directoryFile, html);
  await writeFile(new URL(`${clean}.html`, distDir), html);
}

async function build() {
  let products = [];
  try {
    products = await fetchProducts();
  } catch (error) {
    console.warn(`SEO: no se pudo consultar Supabase; se usará el catálogo local de respaldo (${error.message}).`);
  }
  if (products.length === 0) products = await fallbackProducts();

  const baseHtml = await readFile(new URL('index.html', distDir), 'utf8');
  const pages = [
    { path: '/', title: 'La Garza — Cerámica en gres, Valdivia', heading: 'Cerámica en gres hecha a mano en Valdivia', description: 'La Garza crea piezas de cerámica en gres y talleres presenciales en Valdivia, Chile.', includeProducts: true },
    { path: '/sobre-la-garza', title: 'Sobre La Garza — Cerámica en Valdivia', heading: 'Sobre La Garza', description: 'Conoce la historia, filosofía y proceso artesanal del taller de cerámica La Garza en Valdivia.', schemaType: 'AboutPage' },
    { path: '/piezas', title: 'Piezas de cerámica en gres — La Garza', heading: 'Piezas de cerámica en gres', description: 'Vitrina de piezas únicas de cerámica en gres hechas por La Garza en Valdivia.', schemaType: 'CollectionPage', includeProducts: true },
    { path: '/talleres', title: 'Talleres de cerámica en Valdivia — La Garza', heading: 'Talleres de cerámica en Valdivia', description: 'Talleres presenciales de cerámica en gres para aprender, experimentar y crear con las manos en Valdivia.', schemaType: 'Service' },
    ...products.map((product) => ({ path: `/piezas/${product.slug}`, title: `${product.title} — La Garza`, heading: product.title, description: product.description, type: 'product', schemaType: 'Product', image: product.images[0]?.url, product })),
  ];

  for (const page of pages) await writeRoute(page.path, snapshotHtml(baseHtml, page, products));

  const urls = pages.filter(({ robots }) => !robots?.startsWith('noindex')).map((page) => {
    const image = page.product?.images[0];
    return `  <url><loc>${escapeXml(new URL(page.path.replace(/^\//, ''), rootUrl).href)}</loc>${page.product?.updated_at ? `<lastmod>${page.product.updated_at.slice(0, 10)}</lastmod>` : ''}${image ? `<image:image><image:loc>${escapeXml(image.url)}</image:loc><image:caption>${escapeXml(image.alt)}</image:caption></image:image>` : ''}</url>`;
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
  await writeFile(new URL('sitemap.xml', distDir), sitemap);

  let notFound = setMeta(baseHtml, ['name', 'robots'], 'noindex,nofollow');
  notFound = notFound.replace(/<title>.*?<\/title>/i, '<title>Página no encontrada — La Garza</title>');
  await writeFile(new URL('404.html', distDir), notFound);
}

await build();
