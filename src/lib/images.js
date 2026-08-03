const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2000;

export async function optimizeProductImage(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Usa una imagen JPEG, PNG o WebP.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen original no puede superar 20 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d', { alpha: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('No pudimos optimizar la imagen.'));
    }, 'image/webp', 0.84);
  });

  if (blob.size > 10 * 1024 * 1024) {
    throw new Error('La imagen optimizada supera el límite de 10 MB.');
  }
  return blob;
}

