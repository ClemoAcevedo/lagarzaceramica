import { useEffect, useRef, useState } from 'react';

export default function LoadingImage({ className = '', cropped = false, onLoad, onError, src, style, ...props }) {
  const imageRef = useRef(null);
  const [finishedSrc, setFinishedSrc] = useState(null);
  const [cropLayout, setCropLayout] = useState(null);
  const loaded = finishedSrc === src;

  useEffect(() => {
    if (imageRef.current?.complete) setFinishedSrc(src);
  }, [src]);

  useEffect(() => {
    if (!cropped || !imageRef.current) return undefined;
    const image = imageRef.current;
    const container = image.parentElement;

    const updateLayout = () => {
      if (!container || !image.naturalWidth || !image.naturalHeight) return;
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const coverWidth = Math.max(width, height * imageRatio);
      const coverHeight = coverWidth / imageRatio;
      const parsedCropX = Number.parseFloat(style?.['--crop-x']);
      const parsedCropY = Number.parseFloat(style?.['--crop-y']);
      const cropX = Number.isFinite(parsedCropX) ? parsedCropX : 50;
      const cropY = Number.isFinite(parsedCropY) ? parsedCropY : 50;
      setCropLayout({
        inset: 'auto',
        width: `${coverWidth}px`,
        height: `${coverHeight}px`,
        left: `${(width - coverWidth) * (cropX / 100)}px`,
        top: `${(height - coverHeight) * (cropY / 100)}px`,
        objectFit: 'fill',
      });
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    if (container) observer.observe(container);
    image.addEventListener('load', updateLayout);
    return () => {
      observer.disconnect();
      image.removeEventListener('load', updateLayout);
    };
  }, [cropped, src, style]);

  const finishLoading = (event, callback) => {
    setFinishedSrc(src);
    callback?.(event);
  };

  return (
    <>
      {!loaded && <span className="image-loading-shimmer" aria-hidden="true" />}
      <img
        {...props}
        ref={imageRef}
        src={src}
        style={{ ...style, ...cropLayout }}
        className={`${className} ${loaded ? 'is-loaded' : 'is-loading'}`.trim()}
        onLoad={(event) => finishLoading(event, onLoad)}
        onError={(event) => finishLoading(event, onError)}
      />
    </>
  );
}
