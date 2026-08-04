const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function cropPositionAfterDrag(position, pointerDelta, viewportSize, coverSize, zoom) {
  const travel = viewportSize - coverSize * zoom;
  if (!Number.isFinite(travel) || Math.abs(travel) < 0.5) return position;
  return clamp(position + (pointerDelta / travel) * 100, 0, 100);
}

export function cropStyle(cropX = 50, cropY = 50, cropZoom = 1) {
  return {
    '--crop-x': `${cropX}%`,
    '--crop-y': `${cropY}%`,
    '--crop-zoom': cropZoom,
    '--crop-hover-zoom': Math.min(3.1, cropZoom * 1.025),
    '--crop-entry-zoom': Math.min(3.1, cropZoom * 1.02),
  };
}
