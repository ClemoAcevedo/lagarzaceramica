import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'vite';

try {
  process.loadEnvFile('.env.local');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const projectUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

if (!projectUrl || !secretKey) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SECRET_KEY solo en esta terminal antes de migrar.');
}

if (secretKey.startsWith('sb_publishable_')) {
  throw new Error('Pegaste una Publishable key. Para esta migración necesitas una Secret key que comience con sb_secret_.');
}

if (secretKey.startsWith('eyJ')) {
  const [, payload] = secretKey.split('.');
  const role = JSON.parse(Buffer.from(payload, 'base64url').toString()).role;
  if (role !== 'service_role') {
    throw new Error('Pegaste la clave legacy anon. Usa una Secret key sb_secret_ o la clave legacy service_role.');
  }
} else if (!secretKey.startsWith('sb_secret_')) {
  throw new Error('La clave no tiene un formato administrativo reconocido. Debe comenzar con sb_secret_.');
}

const supabase = createClient(projectUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checked(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

const existing = await checked(supabase.from('products').select('id').limit(1));
if (existing.length) {
  throw new Error('La migración se detuvo porque el catálogo remoto ya contiene piezas.');
}

const vite = await createServer({
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});

try {
  const { products, productFilters } = await vite.ssrLoadModule('/src/data/products.js');
  const categories = productFilters.filter(({ value }) => value !== 'all');
  const categoryIds = new Map();

  for (let index = 0; index < categories.length; index += 1) {
    const category = categories[index];
    const [row] = await checked(supabase.from('categories').insert({
      name: category.label,
      slug: category.value,
      sort_order: index,
    }).select('id, slug'));
    categoryIds.set(row.slug, row.id);
  }

  for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
    const product = products[productIndex];
    const [row] = await checked(supabase.from('products').insert({
      category_id: categoryIds.get(product.category),
      title: product.title,
      slug: product.slug,
      description: product.description,
      price_clp: null,
      material: 'Gres esmaltado',
      status: 'draft',
      catalog_order: productIndex,
      card_format: product.format || 'portrait',
      preview_fit: product.previewFit === 'contain' ? 'contain' : 'cover',
      preview_position: product.previewFit === 'bottom' ? 'bottom' : 'center',
      crop_x: 50,
      crop_y: product.previewFit === 'bottom' ? 100 : 50,
      crop_zoom: 1,
    }).select('id'));

    for (let imageIndex = 0; imageIndex < product.images.length; imageIndex += 1) {
      const image = product.images[imageIndex];
      const sourcePath = resolve(process.cwd(), image.src.replace(/^\//, ''));
      const storagePath = `${row.id}/${String(imageIndex + 1).padStart(2, '0')}-${basename(sourcePath)}`;
      const contents = await readFile(sourcePath);
      await checked(supabase.storage.from('product-images').upload(storagePath, contents, {
        contentType: 'image/webp',
        upsert: false,
      }));
      await checked(supabase.from('product_images').insert({
        product_id: row.id,
        storage_path: storagePath,
        alt: image.alt,
        sort_order: imageIndex,
        crop_x: 50,
        crop_y: 50,
        crop_zoom: 1,
      }));
    }

    process.stdout.write(`Migrada ${productIndex + 1}/${products.length}: ${product.title}\n`);
  }

  process.stdout.write('\nMigración terminada. Completa los precios y publica las piezas desde /admin.\n');
} finally {
  await vite.close();
}
