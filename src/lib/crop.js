export function cropStyle(cropX = 50, cropY = 50, cropZoom = 1) {
  return {
    '--crop-x': `${cropX}%`,
    '--crop-y': `${cropY}%`,
    '--crop-zoom': cropZoom,
    '--crop-hover-zoom': Math.min(3.1, cropZoom * 1.025),
    '--crop-entry-zoom': Math.min(3.1, cropZoom * 1.02),
  };
}
