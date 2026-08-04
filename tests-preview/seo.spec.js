import { expect, test } from '@playwright/test';

test('las fichas publicadas incluyen contenido y metadatos antes de ejecutar React', async ({ request }) => {
  const response = await request.get('piezas/gallina-contenedora');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toMatch(/<h1>Gallina [Cc]ontenedora<\/h1>/);
  expect(html).toContain('property="og:title"');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain('rel="canonical" href="https://clemoacevedo.github.io/lagarzaceramica/piezas/gallina-contenedora"');
});

test('la aplicación reemplaza el snapshot SEO sin errores', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('piezas/gallina-contenedora');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gallina contenedora');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/);
  expect(errors).toEqual([]);
});

test('el sitemap se genera con las piezas y sus imágenes', async ({ request }) => {
  const response = await request.get('sitemap.xml');
  const xml = await response.text();
  expect(xml).toContain('/piezas/gallina-contenedora');
  expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
});
