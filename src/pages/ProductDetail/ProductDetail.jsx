import { useEffect, useState } from 'react';
import { Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ButtonLink } from '../../components/Links/Links.jsx';
import CatalogStatus from '../../components/CatalogStatus/CatalogStatus.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { formatPriceCLP } from '../../lib/catalog.js';
import { cropStyle } from '../../lib/crop.js';
import LoadingImage from '../../components/LoadingImage/LoadingImage.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { productStructuredData } from '../../lib/seo.js';

export default function ProductDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { products, loading, error, refresh } = useCatalog();
  const product = products.find((item) => item.slug === slug || item.previousSlugs.includes(slug));
  const [activeImage, setActiveImage] = useState(0);
  const [shareStatus, setShareStatus] = useState('');
  const images = product?.images || [];

  useEffect(() => {
    setActiveImage(0);
  }, [slug]);

  usePageMeta(
    product ? `${product.title} — La Garza` : 'Pieza no encontrada — La Garza',
    product?.description || 'Piezas de cerámica en gres hechas por La Garza en Valdivia.',
    {
      image: product?.image,
      imageAlt: product?.alt,
      type: product ? 'product' : 'website',
      structuredData: productStructuredData(product),
    },
  );

  if (loading || error) {
    return <main id="contenido" className="product-detail section"><CatalogStatus loading={loading} error={error} onRetry={refresh} variant="detail" /></main>;
  }
  if (!product) return <Navigate to="/piezas" replace />;
  if (product.slug !== slug) {
    return <Navigate to={`/piezas/${product.slug}`} state={location.state} replace />;
  }

  const selectedImage = images[activeImage] || images[0];
  const shareUrl = new URL(`piezas/${product.slug}`, new URL(import.meta.env.BASE_URL, window.location.origin)).href;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShareStatus('Enlace copiado');
  };

  const shareProduct = async () => {
    if (!navigator.share) {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share({
        title: `${product.title} — La Garza`,
        text: `Mira ${product.title}, una pieza de cerámica de La Garza.`,
        url: shareUrl,
      });
    } catch (error) {
      if (error.name !== 'AbortError') await copyShareLink();
    }
  };

  return (
    <main id="contenido" className="page-enter">
      <article className="product-detail section">
        {location.state?.fromCatalog ? (
          <button className="product-detail__back" type="button" onClick={() => navigate(-1)}>
            ← Volver a piezas
          </button>
        ) : (
          <Link className="product-detail__back" to="/piezas">← Volver a piezas</Link>
        )}
        <div className={`product-detail__gallery${images.length > 1 ? ' has-thumbnails' : ''}`}>
          <figure className="product-detail__media image-reveal">
            <LoadingImage
              key={selectedImage.src}
              src={selectedImage.src}
              srcSet={selectedImage.srcSet}
              sizes="(max-width: 760px) 100vw, 58vw"
              alt={selectedImage.alt}
              fetchPriority="high"
              style={cropStyle(selectedImage.cropX, selectedImage.cropY, selectedImage.cropZoom)}
            />
          </figure>
          {images.length > 1 && (
            <div className="product-detail__thumbnails" aria-label={`Imágenes de ${product.title}`}>
              {images.map((image, index) => (
                <button
                  className={`product-detail__thumbnail${index === activeImage ? ' is-active' : ''}`}
                  type="button"
                  key={image.src}
                  aria-label={`Ver imagen ${index + 1} de ${product.title}`}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                >
                  <LoadingImage src={image.src} srcSet={image.srcSet} sizes="8rem" alt="" loading="lazy" style={cropStyle(image.cropX, image.cropY, image.cropZoom)} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail__copy reveal">
          <p className="eyebrow">{product.collection}</p>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <p className="product-detail__price">{formatPriceCLP(product.priceClp)}</p>
          <ButtonLink href={product.contactUrl} arrow>Consultar esta línea</ButtonLink>
          <div className="product-detail__share" aria-label={`Compartir ${product.title}`}>
            <button type="button" onClick={shareProduct}>Compartir</button>
            <span role="status" aria-live="polite">{shareStatus}</span>
          </div>
        </div>
      </article>
    </main>
  );
}
