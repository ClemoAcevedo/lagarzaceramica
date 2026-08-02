import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'Piezas con memoria'],
  ['/sobre-la-garza', 'Una manera'],
  ['/piezas', 'Piezas'],
  ['/piezas/gallina-contenedora', 'Gallina contenedora'],
  ['/talleres', 'Tiempo para'],
];

for (const [route, heading] of routes) {
  test(`${route} carga sin errores`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(route);
    await expect(page.locator('h1')).toContainText(heading);
    await expect(page.locator('main')).toHaveCSS('animation-name', 'page-in');
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('el menú móvil es legible, completo y bloquea el contenido posterior', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');

  const menu = page.locator('#menu-principal');
  await expect(menu).toHaveCSS('visibility', 'hidden');
  await page.getByRole('button', { name: 'Abrir menú' }).click();

  await expect(menu).toHaveCSS('visibility', 'visible');
  await expect(menu).toHaveCSS('background-color', 'rgb(40, 85, 54)');
  await expect(menu).toHaveCSS('color', 'rgb(255, 253, 248)');
  for (const label of ['Inicio', 'Sobre La Garza', 'Piezas', 'Talleres', 'Contacto', 'Instagram', 'WhatsApp']) {
    await expect(menu.getByRole('link', { name: new RegExp(label, 'i') })).toBeVisible();
  }
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('footer')).toHaveAttribute('inert', '');
});

test('el catálogo conserva filtro y posición al volver de una ficha', async ({ page }) => {
  await page.goto('/piezas');
  await page.getByRole('button', { name: 'Tierra', exact: true }).click();
  await expect(page).toHaveURL(/coleccion=tierra/);
  await page.locator('.catalog-card:not([hidden])').first().scrollIntoViewIfNeeded();
  const previousScroll = await page.evaluate(() => window.scrollY);
  await page.locator('.catalog-card:not([hidden]) a').first().click();
  await page.getByRole('button', { name: /volver a piezas/i }).click();

  await expect(page).toHaveURL(/coleccion=tierra/);
  await expect(page.getByRole('button', { name: 'Tierra', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => {
    const currentScroll = await page.evaluate(() => window.scrollY);
    return Math.abs(currentScroll - previousScroll);
  }).toBeLessThanOrEqual(40);
});

test('la búsqueda de piezas se combina con las clasificaciones', async ({ page }) => {
  await page.goto('/piezas');
  const search = page.getByRole('searchbox', { name: 'Buscar piezas' });

  await search.fill('florero huella');
  await expect(page.locator('.catalog-card:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.catalog-card:not([hidden]) h2')).toHaveText('Florero huella');

  await page.getByRole('button', { name: 'Tierra', exact: true }).click();
  await expect(page.locator('.catalog-card:not([hidden])')).toHaveCount(0);
  await expect(page.getByText('No encontramos piezas que coincidan')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(page.locator('.catalog-card:not([hidden])')).toHaveCount(17);
});

test('la página 404 está centrada', async ({ page }) => {
  await page.goto('/esta-pagina-no-existe');
  await expect(page.locator('h1')).toHaveText('Esta página no está aquí.');
  await expect(page.locator('.not-found')).toHaveCSS('text-align', 'center');
  await expect(page.locator('.not-found')).toHaveCSS('align-items', 'center');
  await expect(page.locator('.not-found')).toHaveCSS('justify-content', 'center');
});

test('las fichas muestran un único control para compartir', async ({ page }) => {
  await page.goto('/piezas/gallina-contenedora');
  const share = page.locator('.product-detail__share');
  await expect(share.getByRole('button', { name: 'Compartir', exact: true })).toBeVisible();
  await expect(share.getByRole('button')).toHaveCount(1);
  await expect(share.getByRole('link')).toHaveCount(0);
});
