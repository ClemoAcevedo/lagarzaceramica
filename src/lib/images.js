const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2000;
const MAX_IMAGE_PIXELS = 40_000_000;

const WEBP_VARIANTS = {
  large: { maxSide: MAX_IMAGE_SIDE, quality: 0.84 },
  medium: { maxSide: 1000, quality: 0.82 },
  small: { maxSide: 500, quality: 0.8 },
};

async function resizeToWebp(bitmap, { maxSide, quality }) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d', { alpha: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('No pudimos optimizar la imagen.'));
    }, 'image/webp', quality);
  });
}

export function validateProductImage(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name}: usa una imagen JPEG, PNG o WebP.`);
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name}: la imagen original no puede superar 20 MB.`);
  }
}

export async function optimizeProductImages(file) {
  validateProductImage(file);

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
      throw new Error('La imagen tiene demasiada resolución; usa una fotografía de hasta 40 megapíxeles.');
    }
    const variants = {};
    for (const [name, settings] of Object.entries(WEBP_VARIANTS)) {
      variants[name] = await resizeToWebp(bitmap, settings);
    }

    if (variants.large.size > 10 * 1024 * 1024) {
      throw new Error('La imagen optimizada supera el límite de 10 MB.');
    }
    return variants;
  } finally {
    bitmap.close();
  }
}
