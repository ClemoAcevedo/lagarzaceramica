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

function imageSources(image) {
  const small = storageUrl(image.storage_path_small);
  const medium = storageUrl(image.storage_path_medium);
  const large = image.src || storageUrl(image.storage_path);
  return {
    src: large,
    srcSet: small || medium
      ? [small && `${small} 500w`, medium && `${medium} 1000w`, large && `${large} 2000w`].filter(Boolean).join(', ')
      : undefined,
  };
}

function normalizeProduct(row) {
  const images = [...(row.images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      ...imageSources(image),
      storagePath: image.storage_path,
      storagePathSmall: image.storage_path_small,
      storagePathMedium: image.storage_path_medium,
      alt: image.alt,
      sortOrder: image.sort_order,
      cropX: Number(image.crop_x ?? 50),
      cropY: Number(image.crop_y ?? 50),
      cropZoom: Number(image.crop_zoom ?? 1),
    }));
  const category = row.category || {};
  const coverImage = images.find(({ id }) => id === row.cover_image_id) || images[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceClp: row.price_clp ?? null,
    material: row.material || 'Gres esmaltado',
    status: row.status || 'published',
    updatedAt: row.updated_at || null,
    catalogOrder: row.catalog_order ?? 0,
    categoryOrder: row.category_order ?? row.catalog_order ?? 0,
    categoryId: row.category_id || category.id,
    category: category.slug || row.category,
    collection: category.name || row.collection,
    format: row.card_format || row.format || 'portrait',
    previewFit: row.preview_fit === 'cover' ? null : (row.preview_fit || row.previewFit),
    previewPosition: row.preview_position || (row.previewFit === 'bottom' ? 'bottom' : 'center'),
    cropX: Number(row.crop_x ?? 50),
    cropY: Number(row.crop_y ?? (row.previewFit === 'bottom' ? 100 : 50)),
    cropZoom: Number(row.crop_zoom ?? 1),
    coverImageId: coverImage?.id || null,
    previousSlugs: (row.slug_history || []).map(({ slug }) => slug),
    images,
    image: coverImage?.src,
    imageSrcSet: coverImage?.srcSet,
    alt: coverImage?.alt || '',
  };
}

function sortProductsGlobally(products) {
  return [...products].sort((first, second) => (
    first.catalogOrder - second.catalogOrder
    || first.title.localeCompare(second.title, 'es')
  ));
}

async function localCatalog() {
  const { productFilters: localFilters, products: localProducts } = await import('../data/products.js');
  const categories = localFilters
    .filter(({ value }) => value !== 'all')
    .map(({ value, label }, index) => ({ id: value, slug: value, name: label, sortOrder: index }));
  const products = sortProductsGlobally(localProducts.map((product, index) => normalizeProduct({
    ...product,
    id: product.slug,
    price_clp: null,
    material: 'Gres esmaltado',
    status: 'published',
    catalog_order: index,
    category_order: localProducts
      .slice(0, index)
      .filter(({ category }) => category === product.category).length,
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
  })));
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
  updated_at,
  catalog_order,
  category_order,
  category_id,
  card_format,
  preview_fit,
  preview_position,
  crop_x,
  crop_y,
  crop_zoom,
  cover_image_id,
  slug_history:product_slug_history(slug),
  category:categories(id, name, slug, sort_order),
  images:product_images!product_images_product_id_fkey(id, storage_path, storage_path_small, storage_path_medium, alt, sort_order, crop_x, crop_y, crop_zoom)
`;

async function throwIfError(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export async function fetchPublicCatalog() {
  if (!isSupabaseConfigured || forceLocalCatalog) return localCatalog();

  const [categoryRows, productRows, featuredRows] = await Promise.all([
    throwIfError(supabase.from('categories').select('id, name, slug, sort_order, updated_at').order('sort_order')),
    throwIfError(
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        .order('catalog_order')
        .order('sort_order', { referencedTable: 'product_images' }),
    ),
    throwIfError(supabase.from('homepage_featured').select('slot, product_id, crop_x, crop_y, crop_zoom').order('slot')),
  ]);

  const products = sortProductsGlobally(productRows.map(normalizeProduct));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const usedCategoryIds = new Set(products.map(({ categoryId }) => categoryId));

  return {
    categories: categoryRows
      .filter(({ id }) => usedCategoryIds.has(id))
      .map((category) => ({ ...category, sortOrder: category.sort_order, updatedAt: category.updated_at })),
    products,
    featuredProducts: featuredRows.map((row) => {
      const product = productsById.get(row.product_id);
      return product ? {
        ...product,
        homeCropX: Number(row.crop_x ?? 50),
        homeCropY: Number(row.crop_y ?? 50),
        homeCropZoom: Number(row.crop_zoom ?? 1),
      } : null;
    }).filter(Boolean),
    source: 'supabase',
  };
}

export async function fetchAdminCatalog() {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const [categoryRows, productRows, featuredRows] = await Promise.all([
    throwIfError(supabase.from('categories').select('id, name, slug, sort_order, updated_at').order('sort_order')),
    throwIfError(
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .order('catalog_order')
        .order('sort_order', { referencedTable: 'product_images' }),
    ),
    throwIfError(supabase.from('homepage_featured').select('slot, product_id, crop_x, crop_y, crop_zoom').order('slot')),
  ]);

  return {
    categories: categoryRows.map((category) => ({ ...category, sortOrder: category.sort_order, updatedAt: category.updated_at })),
    products: sortProductsGlobally(productRows.map(normalizeProduct)),
    featuredSelections: featuredRows.map((row) => ({
      productId: row.product_id,
      cropX: Number(row.crop_x ?? 50),
      cropY: Number(row.crop_y ?? 50),
      cropZoom: Number(row.crop_zoom ?? 1),
    })),
  };
}

export function notifyCatalogChanged() {
  window.dispatchEvent(new Event('la-garza:catalog-changed'));
}
