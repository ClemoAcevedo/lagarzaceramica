import { notifyCatalogChanged, slugify } from './catalog.js';
import { optimizeProductImage } from './images.js';
import { PRODUCT_IMAGES_BUCKET, supabase } from './supabase.js';

async function result(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export async function saveProduct({ values, product, images, removedImages, newImages }) {
  const desiredStatus = values.status;
  const finalImageCount = images.length + newImages.length;
  if (desiredStatus === 'published' && finalImageCount === 0) {
    throw new Error('Agrega al menos una imagen antes de publicar.');
  }

  const payload = {
    category_id: values.categoryId,
    title: values.title.trim(),
    slug: slugify(values.title),
    description: values.description.trim(),
    price_clp: values.priceClp || null,
    material: values.material.trim(),
    status: !product && desiredStatus === 'published' ? 'draft' : desiredStatus,
    card_format: values.format,
    preview_fit: values.previewFit,
    preview_position: values.previewPosition,
    crop_x: values.cropX,
    crop_y: values.cropY,
    crop_zoom: values.cropZoom,
  };

  let savedProduct = product;
  if (product) {
    [savedProduct] = await result(
      supabase.from('products').update(payload).eq('id', product.id).select('id, slug'),
    );
  } else {
    const [lastProduct] = await result(
      supabase.from('products').select('catalog_order').order('catalog_order', { ascending: false }).limit(1),
    );
    [savedProduct] = await result(
      supabase.from('products').insert({
        ...payload,
        catalog_order: Number(lastProduct?.catalog_order ?? -1) + 1,
      }).select('id, slug'),
    );
  }

  for (const image of images) {
    await result(
      supabase.from('product_images').update({
        alt: image.alt.trim(),
        sort_order: image.sortOrder,
        crop_x: image.cropX,
        crop_y: image.cropY,
        crop_zoom: image.cropZoom,
      }).eq('id', image.id),
    );
  }

  for (const image of removedImages) {
    await result(supabase.from('product_images').delete().eq('id', image.id));
    if (image.storagePath) {
      await result(supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storagePath]));
    }
  }

  for (let index = 0; index < newImages.length; index += 1) {
    const pendingImage = newImages[index];
    const blob = await optimizeProductImage(pendingImage.file);
    const storagePath = `${savedProduct.id}/${crypto.randomUUID()}.webp`;
    try {
      await result(supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(storagePath, blob, {
        contentType: 'image/webp',
        upsert: false,
      }));
      await result(supabase.from('product_images').insert({
        product_id: savedProduct.id,
        storage_path: storagePath,
        alt: pendingImage.alt.trim(),
        sort_order: images.length + index,
        crop_x: pendingImage.cropX,
        crop_y: pendingImage.cropY,
        crop_zoom: pendingImage.cropZoom,
      }));
    } catch (error) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
      throw error;
    }
  }

  if (!product && desiredStatus === 'published') {
    await result(supabase.from('products').update({ status: 'published' }).eq('id', savedProduct.id));
  }

  notifyCatalogChanged();
  return savedProduct;
}

export async function setProductStatus(productId, status) {
  await result(supabase.from('products').update({ status }).eq('id', productId));
  notifyCatalogChanged();
}

export async function permanentlyDeleteProduct(product) {
  if (product.status !== 'archived') throw new Error('Solo puedes eliminar definitivamente una pieza archivada.');
  const paths = product.images.map(({ storagePath }) => storagePath).filter(Boolean);
  await result(supabase.from('products').delete().eq('id', product.id));
  if (paths.length) await result(supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths));
  notifyCatalogChanged();
}

export async function reorderProducts(ids) {
  await result(supabase.rpc('reorder_products', { product_ids: ids }));
  notifyCatalogChanged();
}

export async function publishAllDrafts() {
  const count = await result(supabase.rpc('publish_all_drafts'));
  notifyCatalogChanged();
  return count;
}

export async function saveFeatured(ids) {
  await result(supabase.rpc('set_homepage_featured', { product_ids: ids }));
  notifyCatalogChanged();
}

export async function createCategory(name, sortOrder) {
  await result(supabase.from('categories').insert({ name: name.trim(), slug: slugify(name), sort_order: sortOrder }));
  notifyCatalogChanged();
}

export async function updateCategory(id, name) {
  await result(supabase.from('categories').update({ name: name.trim() }).eq('id', id));
  notifyCatalogChanged();
}

export async function deleteCategory(id) {
  const products = await result(supabase.from('products').select('id').eq('category_id', id).limit(1));
  if (products.length) throw new Error('Reasigna o elimina las piezas de esta categoría antes de eliminarla.');
  await result(supabase.from('categories').delete().eq('id', id));
  notifyCatalogChanged();
}

export async function reorderCategories(ids) {
  await result(supabase.rpc('reorder_categories', { category_ids: ids }));
  notifyCatalogChanged();
}
