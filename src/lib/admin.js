import { notifyCatalogChanged, slugify } from './catalog.js';
import { optimizeProductImages } from './images.js';
import { PRODUCT_IMAGES_BUCKET, supabase } from './supabase.js';

async function result(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

async function removeStoragePaths(paths) {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(validPaths);
}

export async function saveProduct({ values, product, images, removedImages, coverClientId }) {
  const desiredStatus = values.status;
  const finalImageCount = images.length;
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
    status: desiredStatus,
    card_format: values.format,
    preview_fit: values.previewFit,
    preview_position: values.previewPosition,
    crop_x: values.cropX,
    crop_y: values.cropY,
    crop_zoom: values.cropZoom,
  };

  const productId = product?.id || crypto.randomUUID();
  payload.id = productId;
  payload.is_new = !product;
  const uploadedPaths = [];
  const preparedImages = [];

  try {
    for (const image of images) {
      if (image.kind !== 'new') continue;
      let variants;
      try {
        variants = await optimizeProductImages(image.file);
      } catch (imageError) {
        throw new Error(imageError.message.startsWith(`${image.file.name}:`) ? imageError.message : `${image.file.name}: ${imageError.message}`);
      }
      const basePath = `${productId}/${crypto.randomUUID()}`;
      const paths = {
        large: `${basePath}.webp`,
        medium: `${basePath}-1000.webp`,
        small: `${basePath}-500.webp`,
      };
      for (const size of ['large', 'medium', 'small']) {
        await result(supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(paths[size], variants[size], {
          contentType: 'image/webp',
          upsert: false,
        }));
        uploadedPaths.push(paths[size]);
      }
      preparedImages.push({ image, paths, id: crypto.randomUUID() });
    }

    const persistedIds = new Map();
    const existingImages = images.filter(({ kind }) => kind !== 'new').map((image) => {
      persistedIds.set(image.clientId, image.id);
      return {
        id: image.id,
        alt: image.alt.trim(),
        sort_order: image.sortOrder,
        crop_x: image.cropX,
        crop_y: image.cropY,
        crop_zoom: image.cropZoom,
      };
    });
    const newImageRows = preparedImages.map(({ image, paths, id }) => {
      persistedIds.set(image.clientId, id);
      return {
        id,
        storage_path: paths.large,
        storage_path_medium: paths.medium,
        storage_path_small: paths.small,
        alt: image.alt.trim(),
        sort_order: image.sortOrder,
        crop_x: image.cropX,
        crop_y: image.cropY,
        crop_zoom: image.cropZoom,
      };
    });

    const coverImageId = persistedIds.get(coverClientId) || persistedIds.get(images[0]?.clientId) || null;
    await result(supabase.rpc('save_product', {
      product_data: payload,
      existing_images: existingImages,
      new_images: newImageRows,
      removed_image_ids: removedImages.map(({ id }) => id),
      selected_cover_id: coverImageId,
    }));

    if (removedImages.length) {
      await removeStoragePaths(removedImages.flatMap((image) => [image.storagePath, image.storagePathMedium, image.storagePathSmall]));
    }

    notifyCatalogChanged();
    return { id: productId, slug: payload.slug };
  } catch (error) {
    await removeStoragePaths(uploadedPaths);
    throw error;
  }
}

export async function setProductStatus(productId, status) {
  await result(supabase.from('products').update({ status }).eq('id', productId));
  notifyCatalogChanged();
}

export async function permanentlyDeleteProduct(product) {
  if (product.status !== 'archived') throw new Error('Solo puedes eliminar definitivamente una pieza archivada.');
  const paths = product.images.flatMap((image) => [image.storagePath, image.storagePathMedium, image.storagePathSmall]).filter(Boolean);
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

export async function saveFeatured(selections) {
  await result(supabase.rpc('set_homepage_featured', {
    selections: selections.map((selection) => ({
      product_id: selection.productId,
      crop_x: selection.cropX,
      crop_y: selection.cropY,
      crop_zoom: selection.cropZoom,
    })),
  }));
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
