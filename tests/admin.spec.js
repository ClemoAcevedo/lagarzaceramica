import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const localEnv = existsSync('.env.local') ? Object.fromEntries(readFileSync('.env.local', 'utf8')
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
  })) : {};
const env = { ...process.env, ...localEnv };
const projectRef = new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
const now = Math.floor(Date.now() / 1000);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ aud: 'authenticated', exp: now + 3600, sub: '11111111-1111-4111-8111-111111111111', role: 'authenticated' })}.audit`;
const session = {
  access_token: accessToken,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: now + 3600,
  refresh_token: 'audit-refresh-token',
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'audit@lagarza.cl',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  },
};
const updatedAt = '2026-08-05T12:00:00.000Z';

function adminFixture() {
  const categories = [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'Especiales', slug: 'especiales', sort_order: 0, updated_at: updatedAt },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'Tierra', slug: 'tierra', sort_order: 1, updated_at: updatedAt },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'Vacía', slug: 'vacia', sort_order: 2, updated_at: updatedAt },
  ];
  const products = ['Gallina contenedora', 'Vajilla Río', 'Taza de campo'].map((title, index) => {
    const id = `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb${index + 1}`;
    const category = categories[index === 1 ? 1 : 0];
    const imageId = `cccccccc-cccc-4ccc-8ccc-ccccccccccc${index + 1}`;
    return {
      id,
      slug: title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title,
      description: `Descripción de ${title}.`,
      price_clp: null,
      material: 'Gres esmaltado',
      status: 'published',
      updated_at: updatedAt,
      catalog_order: index,
      category_order: index === 2 ? 1 : 0,
      category_id: category.id,
      card_format: 'portrait',
      preview_fit: 'cover',
      preview_position: 'center',
      crop_x: 50,
      crop_y: 50,
      crop_zoom: 1,
      cover_image_id: imageId,
      slug_history: [],
      category: { id: category.id, name: category.name, slug: category.slug, sort_order: category.sort_order },
      images: [{ id: imageId, storage_path: `${id}/image.webp`, storage_path_small: null, storage_path_medium: null, alt: title, sort_order: 0, crop_x: 50, crop_y: 50, crop_zoom: 1 }],
    };
  });
  const featured = products.map((product, index) => ({ slot: index + 1, product_id: product.id, crop_x: 50, crop_y: 50, crop_zoom: 1 }));
  return { categories, products, featured };
}

async function mockAdmin(page, onRpc = async () => undefined) {
  const state = adminFixture();
  const calls = [];
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: `sb-${projectRef}-auth-token`,
    value: session,
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/rest/v1/rpc/is_admin')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
    }
    if (url.pathname.endsWith('/rest/v1/categories') && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.categories) });
    }
    if (url.pathname.endsWith('/rest/v1/products') && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.products) });
    }
    if (url.pathname.endsWith('/rest/v1/homepage_featured') && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.featured) });
    }
    if (url.pathname.includes('/storage/v1/object/public/product-images/')) {
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900"><rect width="100%" height="100%" fill="#d7c9ae"/></svg>' });
    }
    const rpc = url.pathname.match(/\/rest\/v1\/rpc\/([^/]+)$/)?.[1];
    if (rpc) {
      const body = request.postDataJSON?.() || {};
      calls.push({ rpc, body });
      if (rpc === 'storage_cleanup_candidates') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      const response = await onRpc({ rpc, body, route, state });
      if (response !== undefined) return response;
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }
    return route.continue();
  });
  return { state, calls };
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'El panel administrativo se opera en computador.');
});

test('el panel carga una sola copia del catálogo y conserva controles legibles', async ({ page }) => {
  const { calls } = await mockAdmin(page);
  let productRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/rest/v1/products')) productRequests += 1;
  });
  await page.goto('/admin/piezas');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Piezas');
  await expect(page.locator('.admin-product-tile')).toHaveCount(3);
  expect(productRequests).toBeLessThanOrEqual(2); // StrictMode repite efectos solo en desarrollo.
  expect(calls.filter(({ rpc }) => rpc === 'storage_cleanup_candidates').length).toBeLessThanOrEqual(2);
  const editHeight = await page.getByRole('link', { name: 'Editar' }).first().evaluate((element) => element.getBoundingClientRect().height);
  expect(editHeight).toBeGreaterThanOrEqual(32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('una categoría con piezas se bloquea y una categoría vacía se elimina mediante la operación atómica', async ({ page }) => {
  const { calls, state } = await mockAdmin(page, async ({ rpc, body, route }) => {
    if (rpc !== 'delete_category') return undefined;
    const index = state.categories.findIndex(({ id }) => id === body.category_id);
    state.categories.splice(index, 1);
    state.categories.forEach((category, order) => { category.sort_order = order; });
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    return true;
  });
  await page.goto('/admin/categorias');
  await page.locator('.admin-category-row').first().getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByRole('alert')).toContainText('contiene 2 piezas');
  expect(calls.some(({ rpc }) => rpc === 'delete_category')).toBe(false);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.admin-category-row').last().getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.locator('.admin-message')).toContainText('Categoría eliminada');
  const deletion = calls.find(({ rpc }) => rpc === 'delete_category');
  expect(deletion.body).toMatchObject({ category_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', expected_updated_at: updatedAt });
});

test('un error al crear categoría conserva el nombre ingresado', async ({ page }) => {
  await mockAdmin(page, async ({ rpc, route }) => {
    if (rpc !== 'create_category') return undefined;
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'Ya existe una categoría con ese nombre.' }) });
    return true;
  });
  await page.goto('/admin/categorias');
  const input = page.getByPlaceholder('Por ejemplo, Costa');
  await input.fill('Nueva categoría');
  await page.getByRole('button', { name: 'Añadir categoría' }).click();
  await expect(page.getByRole('alert')).toContainText('Ya existe');
  await expect(input).toHaveValue('Nueva categoría');
});

test('los nombres y el orden de categorías se guardan juntos con control de versión', async ({ page }) => {
  const { calls } = await mockAdmin(page, async ({ rpc, route }) => {
    if (rpc !== 'save_categories') return undefined;
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    return true;
  });
  await page.goto('/admin/categorias');
  const firstRow = page.locator('.admin-category-row').first();
  await firstRow.getByLabel('Nombre').fill('Especiales del taller');
  await firstRow.getByRole('button', { name: /Bajar/ }).click();
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.admin-message')).toContainText('guardados');

  const save = calls.find(({ rpc }) => rpc === 'save_categories');
  expect(save.body.category_updates).toHaveLength(3);
  expect(save.body.category_updates.every((category) => category.expected_updated_at === updatedAt)).toBe(true);
  expect(save.body.category_ids).toEqual([
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  ]);
});

test('retirar una pieza y quitar su última imagen se envía como una sola operación', async ({ page }) => {
  let savedPayload;
  const { state } = await mockAdmin(page, async ({ rpc, body, route }) => {
    if (rpc !== 'save_product') return undefined;
    savedPayload = body;
    state.products[0].status = 'draft';
    state.products[0].images = [];
    state.products[0].cover_image_id = null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.products[0].id) });
    return true;
  });
  await page.goto(`/admin/piezas/${state.products[0].id}`);
  await page.getByLabel('Estado').selectOption('draft');
  await page.getByRole('button', { name: 'Quitar' }).click();
  await page.getByRole('button', { name: 'Guardar pieza' }).click();
  await expect(page).toHaveURL(/\/admin\/piezas$/);
  expect(savedPayload.product_data).toMatchObject({ status: 'draft', expected_updated_at: updatedAt });
  expect(savedPayload.removed_image_ids).toEqual(['cccccccc-cccc-4ccc-8ccc-ccccccccccc1']);
});

test('un conflicto concurrente se muestra sin anunciar un archivado inexistente', async ({ page }) => {
  await mockAdmin(page, async ({ rpc, route }) => {
    if (rpc !== 'set_product_status') return undefined;
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'La pieza cambió o ya no existe. Recarga el panel.' }) });
    return true;
  });
  await page.goto('/admin/piezas');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.admin-product-tile').first().getByRole('button', { name: 'Archivar' }).click();
  await expect(page.getByRole('alert')).toContainText('cambió o ya no existe');
  await expect(page.locator('.admin-product-tile').first().locator('.admin-status')).toHaveText('Publicada');
});

test('un error al eliminar definitivamente conserva abierta la confirmación', async ({ page }) => {
  const { state } = await mockAdmin(page, async ({ rpc, route }) => {
    if (rpc !== 'permanently_delete_product') return undefined;
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'La pieza cambió o ya no existe. Recarga el panel.' }) });
    return true;
  });
  state.products[0].status = 'archived';
  await page.goto('/admin/piezas');
  await page.locator('.admin-product-tile').first().getByRole('button', { name: 'Eliminar' }).click();
  await page.getByLabel(/Escribe/).fill(state.products[0].title);
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('cambió o ya no existe');
  await expect(page.getByLabel(/Escribe/)).toHaveValue(state.products[0].title);
});

test('la selección de Inicio envía la versión original y conserva el error concurrente', async ({ page }) => {
  let featuredPayload;
  await mockAdmin(page, async ({ rpc, body, route }) => {
    if (rpc !== 'set_homepage_featured') return undefined;
    featuredPayload = body;
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'Otra sesión modificó la selección de Inicio. Recarga antes de guardar.' }) });
    return true;
  });
  await page.goto('/admin/inicio');
  await page.getByRole('button', { name: 'Reencuadrar para Inicio' }).first().click();
  await page.locator('.admin-crop-zoom input[type="range"]').fill('0.8');
  await page.getByRole('button', { name: 'Usar este encuadre' }).click();
  await page.getByRole('button', { name: 'Guardar selección' }).click();
  await expect(page.getByRole('alert')).toContainText('Otra sesión modificó');
  expect(featuredPayload.expected_selections).toHaveLength(3);
  expect(featuredPayload.expected_selections.every((selection) => selection.crop_zoom === 1)).toBe(true);
  expect(featuredPayload.selections[0].crop_zoom).toBe(0.8);
});
