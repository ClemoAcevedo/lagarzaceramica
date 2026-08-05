import { expect, test } from '@playwright/test';

async function firstProduct(request) {
  const response = await request.get('sitemap.xml');
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  const url = xml.match(/<loc>(https?:\/\/[^<]+\/piezas\/[^<]+)<\/loc>/)?.[1];
  expect(url).toBeTruthy();
  return {
    path: new URL(url).pathname.replace(/^\//, ''),
    url,
  };
}

test('las fichas publicadas incluyen contenido y metadatos antes de ejecutar React', async ({ request }) => {
  const product = await firstProduct(request);
  const response = await request.get(product.path);
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toMatch(/<h1>[^<]+<\/h1>/);
  expect(html).toContain('property="og:title"');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain(`rel="canonical" href="${product.url}"`);
  const snapshot = JSON.parse(html.match(/<script type="application\/ld\+json" data-la-garza-snapshot>(.*?)<\/script>/)?.[1]);
  expect(['Product', 'WebPage']).toContain(snapshot['@type']);
  if (snapshot['@type'] === 'Product') {
    expect(snapshot.offers).toMatchObject({ '@type': 'Offer', priceCurrency: 'CLP' });
    expect(Number(snapshot.offers.price)).toBeGreaterThan(0);
  } else {
    expect(snapshot.offers).toBeUndefined();
  }
});

test('la aplicación reemplaza el snapshot SEO sin errores', async ({ page, request }) => {
  const errors = [];
  const product = await firstProduct(request);
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(product.path);
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/);
  expect(errors).toEqual([]);
});

test('el sitemap se genera con las piezas y sus imágenes', async ({ request }) => {
  const response = await request.get('sitemap.xml');
  const xml = await response.text();
  expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/piezas\/[^<]+<\/loc>/);
  expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
});
