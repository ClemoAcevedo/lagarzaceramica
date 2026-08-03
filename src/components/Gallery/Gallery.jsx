import LoadingImage from '../LoadingImage/LoadingImage.jsx';

export default function Gallery({ as: Tag = 'div', className, images, children }) {
  return (
    <Tag className={className}>
      {images.map(({ src, alt, className: imageClass, reveal = false }) => {
        const frameClass = [
          'gallery-frame',
          imageClass,
          reveal && 'image-reveal',
        ].filter(Boolean).join(' ');

        return (
          <figure key={src} className={frameClass}>
            <LoadingImage src={src} alt={alt} loading="lazy" />
          </figure>
        );
      })}
      {children}
    </Tag>
  );
}
