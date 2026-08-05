import { expect, test } from '@playwright/test';
import { cropPositionAfterDrag } from '../src/lib/crop.js';

test('arrastrar el encuadre sigue al puntero tanto acercado como alejado', () => {
  const viewportSize = 200;
  const coverSize = 200;
  const pointerDelta = 20;

  const zoomedOutPosition = cropPositionAfterDrag(50, pointerDelta, viewportSize, coverSize, 0.5);
  const zoomedInPosition = cropPositionAfterDrag(50, pointerDelta, viewportSize, coverSize, 1.5);

  expect(((zoomedOutPosition - 50) / 100) * (viewportSize - coverSize * 0.5)).toBeCloseTo(pointerDelta);
  expect(((zoomedInPosition - 50) / 100) * (viewportSize - coverSize * 1.5)).toBeCloseTo(pointerDelta);
});

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

test('la selección del taller se revela al cargar Inicio directamente', async ({ page }) => {
  await page.goto('/');

  const featuredCards = page.locator('.featured .product-card');
  await expect(featuredCards).toHaveCount(3);
  await page.locator('.featured').scrollIntoViewIfNeeded();
  await expect(featuredCards).toHaveClass([/is-visible/, /is-visible/, /is-visible/]);
  await expect(featuredCards.first()).toBeVisible();
});

test('el hero móvil mantiene el título legible y sin palabras viudas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');

  await expect(page.locator('.hero__copy')).toHaveCSS('background-color', 'rgba(244, 241, 233, 0.76)');
  const titleLines = page.locator('.hero__title-line');
  await expect(titleLines).toHaveText(['Piezas con', 'memoria, hechas', 'para acompañar.']);
  const lineTops = await titleLines.evaluateAll((lines) => lines.map((line) => line.getBoundingClientRect().top));
  expect(new Set(lineTops.map(Math.round)).size).toBe(3);
});

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

test('las fichas sin precio no anuncian un fragmento de producto incompleto', async ({ page }) => {
  await page.goto('/piezas/gallina-contenedora');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gallina contenedora');
  const structuredData = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => (
    scripts.flatMap((script) => JSON.parse(script.textContent))
  ));
  expect(structuredData.some((entry) => entry['@type'] === 'Product')).toBe(false);
  expect(structuredData.some((entry) => entry['@type'] === 'WebPage')).toBe(true);
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

test('el reencuadre puede alejar una fotografía vertical y deja ver el fondo blanco', async ({ page }) => {
  await page.goto('/piezas/gallina-contenedora');
  await page.locator('.product-detail__thumbnail').nth(1).click();

  const media = page.locator('.product-detail__media');
  const image = media.locator('img');
  await expect(image).toHaveClass(/is-loaded/);
  await expect.poll(() => image.evaluate((element) => element.naturalHeight > element.naturalWidth)).toBe(true);

  await image.evaluate((element) => {
    element.style.transition = 'none';
    element.style.setProperty('--crop-zoom', '0.4');
  });

  await expect(media).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect.poll(async () => {
    const [mediaBox, imageBox] = await Promise.all([media.boundingBox(), image.boundingBox()]);
    return imageBox.width < mediaBox.width && imageBox.height < mediaBox.height;
  }).toBe(true);
});

test('las miniaturas de una pieza usan la misma proporción que la imagen seleccionada', async ({ page }) => {
  await page.goto('/piezas/gallina-contenedora');

  const media = page.locator('.product-detail__media');
  const thumbnail = page.locator('.product-detail__thumbnail').first();
  await expect(thumbnail).toBeVisible();
  await expect(thumbnail.locator('img')).toHaveCSS('position', 'absolute');

  const [mediaBox, thumbnailBox] = await Promise.all([media.boundingBox(), thumbnail.boundingBox()]);
  expect(mediaBox.width / mediaBox.height).toBeCloseTo(thumbnailBox.width / thumbnailBox.height, 2);
  expect(mediaBox.width / mediaBox.height).toBeCloseTo(4 / 3, 2);
});

test('las portadas horizontales conservan su proporción y cubren el catálogo sin franjas', async ({ page }) => {
  await page.goto('/piezas');

  const media = page.locator('.catalog-card:not([hidden]) .catalog-card__media').first();
  const image = media.locator('img');
  await expect(image).toHaveClass(/is-loaded/);
  await expect.poll(() => image.evaluate((element) => element.naturalWidth > element.naturalHeight)).toBe(true);

  const [mediaBox, imageBox, naturalRatio] = await Promise.all([
    media.boundingBox(),
    image.boundingBox(),
    image.evaluate((element) => element.naturalWidth / element.naturalHeight),
  ]);
  expect(imageBox.width / imageBox.height).toBeCloseTo(naturalRatio, 2);
  expect(imageBox.x).toBeLessThan(mediaBox.x);
  expect(imageBox.x + imageBox.width).toBeGreaterThan(mediaBox.x + mediaBox.width);
});

test('el visor de reencuadre administrativo refleja el zoom mientras se edita', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main img').first()).toBeVisible();
  await page.evaluate(() => {
    const source = document.querySelector('main img').currentSrc;
    const viewport = document.createElement('div');
    viewport.className = 'admin-crop-viewport admin-crop-viewport--cover';
    viewport.innerHTML = `<img src="${source}" alt="" style="--crop-x: 50%; --crop-y: 50%; --crop-zoom: 1">`;
    document.body.append(viewport);
  });

  const viewport = page.locator('.admin-crop-viewport');
  const image = viewport.locator('img');
  await expect(image).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  await image.evaluate((element) => element.style.setProperty('--crop-zoom', '0.5'));
  await expect(image).toHaveCSS('transform', 'matrix(0.5, 0, 0, 0.5, 0, 0)');
  const [zoomedOutViewport, zoomedOutImage] = await Promise.all([viewport.boundingBox(), image.boundingBox()]);
  expect(zoomedOutImage.width).toBeLessThan(zoomedOutViewport.width);

  await image.evaluate((element) => element.style.setProperty('--crop-zoom', '2'));
  await expect(image).toHaveCSS('transform', 'matrix(2, 0, 0, 2, 0, 0)');
  const [zoomedInViewport, zoomedInImage] = await Promise.all([viewport.boundingBox(), image.boundingBox()]);
  expect(zoomedInImage.width).toBeGreaterThan(zoomedInViewport.width);
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
