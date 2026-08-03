import { productFilters as localFilters, products as localProducts } from '../data/products.js';
import { PRODUCT_IMAGES_BUCKET, isSupabaseConfigured, supabase } from './supabase.js';

const forceLocalCatalog = import.meta.env.VITE_CATALOG_SOURCE === 'local';

const FALLBACK_FEATURED_SLUGS = [
  'gallina-contenedora',
  'vajilla-rio',
  'taza-de-campo',
];

export function formatPriceCLP(value) {
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) return 'Precio por definir';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function storageUrl(path) {
  if (!path || !supabase) return path;
  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

function normalizeProduct(row) {
  const images = [...(row.images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      src: image.src || storageUrl(image.storage_path),
      storagePath: image.storage_path,
      alt: image.alt,
      sortOrder: image.sort_order,
      cropX: Number(image.crop_x ?? 50),
      cropY: Number(image.crop_y ?? 50),
      cropZoom: Number(image.crop_zoom ?? 1),
    }));
  const category = row.category || {};

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceClp: row.price_clp ?? null,
    material: row.material || 'Gres esmaltado',
    status: row.status || 'published',
    catalogOrder: row.catalog_order ?? 0,
    categoryId: row.category_id || category.id,
    category: category.slug || row.category,
    collection: category.name || row.collection,
    format: row.card_format || row.format || 'portrait',
    previewFit: row.preview_fit === 'cover' ? null : (row.preview_fit || row.previewFit),
    previewPosition: row.preview_position || (row.previewFit === 'bottom' ? 'bottom' : 'center'),
    cropX: Number(row.crop_x ?? 50),
    cropY: Number(row.crop_y ?? (row.previewFit === 'bottom' ? 100 : 50)),
    cropZoom: Number(row.crop_zoom ?? 1),
    previousSlugs: (row.slug_history || []).map(({ slug }) => slug),
    images,
    image: images[0]?.src,
    alt: images[0]?.alt || '',
  };
}

function sortProductsByCategory(products, categories) {
  const categoryPosition = new Map(categories.map(({ id }, index) => [id, index]));
  return [...products].sort((first, second) => {
    const firstCategory = categoryPosition.get(first.categoryId) ?? Number.MAX_SAFE_INTEGER;
    const secondCategory = categoryPosition.get(second.categoryId) ?? Number.MAX_SAFE_INTEGER;
    return firstCategory - secondCategory || first.catalogOrder - second.catalogOrder;
  });
}

function localCatalog() {
  const categories = localFilters
    .filter(({ value }) => value !== 'all')
    .map(({ value, label }, index) => ({ id: value, slug: value, name: label, sortOrder: index }));
  const products = sortProductsByCategory(localProducts.map((product, index) => normalizeProduct({
    ...product,
    id: product.slug,
    price_clp: null,
    material: 'Gres esmaltado',
    status: 'published',
    catalog_order: index,
    card_format: product.format,
    preview_fit: product.previewFit === 'contain' ? 'contain' : 'cover',
    preview_position: product.previewFit === 'bottom' ? 'bottom' : 'center',
    crop_x: 50,
    crop_y: product.previewFit === 'bottom' ? 100 : 50,
    crop_zoom: 1,
    category: categories.find(({ slug }) => slug === product.category),
    images: product.images.map((image, imageIndex) => ({
      id: `${product.slug}-${imageIndex}`,
      ...image,
      sort_order: imageIndex,
      crop_x: 50,
      crop_y: 50,
      crop_zoom: 1,
    })),
  })), categories);
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));

  return {
    categories,
    products,
    featuredProducts: FALLBACK_FEATURED_SLUGS.map((slug) => productsBySlug.get(slug)).filter(Boolean),
    source: 'local',
  };
}

const PRODUCT_SELECT = `
  id,
  slug,
  title,
  description,
  price_clp,
  material,
  status,
  catalog_order,
  category_id,
  card_format,
  preview_fit,
  preview_position,
  crop_x,
  crop_y,
  crop_zoom,
  slug_history:product_slug_history(slug),
  category:categories(id, name, slug, sort_order),
  images:product_images(id, storage_path, alt, sort_order, crop_x, crop_y, crop_zoom)
`;

async function throwIfError(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export async function fetchPublicCatalog() {
  if (!isSupabaseConfigured || forceLocalCatalog) return localCatalog();

  const [categoryRows, productRows, featuredRows] = await Promise.all([
    throwIfError(supabase.from('categories').select('id, name, slug, sort_order').order('sort_order')),
    throwIfError(
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        .order('catalog_order')
        .order('sort_order', { referencedTable: 'product_images' }),
    ),
    throwIfError(supabase.from('homepage_featured').select('slot, product_id').order('slot')),
  ]);

  const products = sortProductsByCategory(productRows.map(normalizeProduct), categoryRows);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const usedCategoryIds = new Set(products.map(({ categoryId }) => categoryId));

  return {
    categories: categoryRows
      .filter(({ id }) => usedCategoryIds.has(id))
      .map((category) => ({ ...category, sortOrder: category.sort_order })),
    products,
    featuredProducts: featuredRows.map(({ product_id: id }) => productsById.get(id)).filter(Boolean),
    source: 'supabase',
  };
}

export async function fetchAdminCatalog() {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const [categoryRows, productRows, featuredRows] = await Promise.all([
    throwIfError(supabase.from('categories').select('id, name, slug, sort_order').order('sort_order')),
    throwIfError(
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .order('catalog_order')
        .order('sort_order', { referencedTable: 'product_images' }),
    ),
    throwIfError(supabase.from('homepage_featured').select('slot, product_id').order('slot')),
  ]);

  return {
    categories: categoryRows.map((category) => ({ ...category, sortOrder: category.sort_order })),
    products: sortProductsByCategory(productRows.map(normalizeProduct), categoryRows),
    featuredIds: featuredRows.map(({ product_id: id }) => id),
  };
}

export function notifyCatalogChanged() {
  window.dispatchEvent(new Event('la-garza:catalog-changed'));
}
