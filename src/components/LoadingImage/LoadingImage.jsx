import { useEffect, useRef, useState } from 'react';

export default function LoadingImage({ className = '', onLoad, onError, src, ...props }) {
  const imageRef = useRef(null);
  const [finishedSrc, setFinishedSrc] = useState(null);
  const loaded = finishedSrc === src;

  useEffect(() => {
    if (imageRef.current?.complete) setFinishedSrc(src);
  }, [src]);

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
        className={`${className} ${loaded ? 'is-loaded' : 'is-loading'}`.trim()}
        onLoad={(event) => finishLoading(event, onLoad)}
        onError={(event) => finishLoading(event, onError)}
      />
    </>
  );
}
