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

test('los clientes pueden filtrar y ordenar las piezas por precio', async ({ page }) => {
  await page.goto('/piezas');
  await page.getByRole('button', { name: 'Filtrar y ordenar' }).click();

  await page.getByLabel('Mostrar por precio').selectOption('priced');
  await expect(page.locator('.catalog-card:not([hidden])')).toHaveCount(0);
  await expect(page.locator('.catalog-empty')).toBeVisible();

  await page.getByLabel('Mostrar por precio').selectOption('undefined');
  await expect(page.locator('.catalog-card:not([hidden])').first()).toBeVisible();

  await page.getByLabel('Precio mínimo').fill('1000');
  await expect(page.locator('.catalog-card:not([hidden])')).toHaveCount(0);

  await page.getByRole('button', { name: 'Limpiar todos los filtros' }).click();
  await page.getByLabel('Ordenar piezas').selectOption('name');
  const titles = await page.locator('.catalog-card:not([hidden]) h2').allTextContents();
  const sortedTitles = [...titles].sort((first, second) => first.localeCompare(second, 'es'));
  expect(titles).toEqual(sortedTitles);
});

test('la vitrina respeta el orden general aunque cambie la categoría', async ({ page }) => {
  await page.goto('/piezas');
  await expect(page.locator('.catalog-card')).toHaveCount(35);
  expect((await page.locator('.catalog-card .eyebrow').allTextContents()).slice(0, 6)).toEqual([
    'Especiales',
    'Tierra',
    'Azul río',
    'Tierra',
    'Tierra',
    'Especiales',
  ]);
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

test('el catálogo y las fichas reservan un espacio para el precio', async ({ page }) => {
  await page.goto('/piezas');
  const firstCard = page.locator('.catalog-card:not([hidden])').first();
  await firstCard.scrollIntoViewIfNeeded();
  await expect(firstCard.locator('.catalog-card__price')).toHaveText('Precio por definir');
  await firstCard.locator('a').click();
  await expect(page.locator('.product-detail__price')).toHaveText('Precio por definir');
});

test('las imágenes dejan de mostrar la carga al completarse o venir desde caché', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.featured img.is-loaded')).toHaveCount(3);
  await expect(page.locator('.featured .image-loading-shimmer')).toHaveCount(0);

  await page.goto('/piezas/gallina-contenedora');
  const mainImage = page.locator('.product-detail__media img');
  await expect(mainImage).toHaveClass(/is-loaded/);
  await expect(page.locator('.product-detail__media .image-loading-shimmer')).toHaveCount(0);

  const secondThumbnail = page.locator('.product-detail__thumbnail').nth(1);
  if (await secondThumbnail.count()) {
    await secondThumbnail.click();
    await expect(mainImage).toHaveClass(/is-loaded/);
    await expect(page.locator('.product-detail__media .image-loading-shimmer')).toHaveCount(0);
  }
});

test('todas las fotografías de contenido usan el esqueleto compartido', async ({ page }) => {
  for (const route of ['/', '/sobre-la-garza', '/talleres']) {
    await page.goto(route);
    const photos = page.locator('main img:not(.page-hero__background):not(.workshop-intro__background):not(.process-timeline__bird)');
    const count = await photos.count();
    for (let index = 0; index < count; index += 1) {
      const photo = photos.nth(index);
      if ((await photo.getAttribute('src'))?.includes('Logo')) continue;
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveClass(/is-loaded/);
    }
    await expect(page.locator('main .image-loading-shimmer')).toHaveCount(0);
  }
});

test('los esqueletos respetan las composiciones de fotografías superpuestas', async ({ page }) => {
  await page.goto('/sobre-la-garza');
  const philosophyImages = page.locator('.philosophy__image');
  await expect(philosophyImages).toHaveCount(2);
  await expect(philosophyImages.first()).toHaveCSS('position', 'absolute');
  await expect(philosophyImages.last()).toHaveCSS('position', 'absolute');

  const [primary, secondary] = await Promise.all([
    philosophyImages.first().boundingBox(),
    philosophyImages.last().boundingBox(),
  ]);
  expect(primary).not.toBeNull();
  expect(secondary).not.toBeNull();
  expect(Math.min(primary.x + primary.width, secondary.x + secondary.width) - Math.max(primary.x, secondary.x)).toBeGreaterThan(0);
  expect(Math.min(primary.y + primary.height, secondary.y + secondary.height) - Math.max(primary.y, secondary.y)).toBeGreaterThan(0);

  await page.goto('/talleres');
  await expect(page.locator('.workshops-hero__image--primary')).toHaveCSS('position', 'absolute');
  await expect(page.locator('.workshops-hero__image--detail')).toHaveCSS('position', 'absolute');
});

test('la información de talleres mantiene una sola opción abierta', async ({ page }) => {
  await page.goto('/talleres');
  const accordion = page.locator('.workshop-guide__accordion');
  await expect(accordion.locator('details[open]')).toHaveCount(1);
  await expect(accordion.locator('details').first()).toHaveAttribute('open', '');

  await accordion.locator('summary').nth(1).click();
  await expect(accordion.locator('details[open]')).toHaveCount(1);
  await expect(accordion.locator('details').nth(1)).toHaveAttribute('open', '');
  await expect(accordion.locator('details').first()).not.toHaveAttribute('open', '');

  await accordion.locator('summary').nth(3).click();
  await expect(accordion.locator('details[open]')).toHaveCount(1);
  await expect(accordion.locator('details').nth(3)).toHaveAttribute('open', '');
  await expect(accordion.locator('details').nth(1)).not.toHaveAttribute('open', '');
});

test('las rutas administrativas redirigen al acceso protegido', async ({ page }) => {
  await page.goto('/admin/piezas');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Bienvenida al taller.' })).toBeVisible();
  await expect(page.locator('.admin-form, .admin-message--warning')).toBeVisible();
});
