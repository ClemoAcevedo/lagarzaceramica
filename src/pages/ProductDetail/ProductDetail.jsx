import { useEffect, useState } from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { ButtonLink } from '../../components/Links/Links.jsx';
import { getProductBySlug } from '../../data/products.js';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function ProductDetail() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  const [activeImage, setActiveImage] = useState(0);
  const images = product?.images || [];

  useEffect(() => {
    setActiveImage(0);
  }, [slug]);

  usePageMeta(
    product ? `${product.title} — La Garza` : 'Pieza no encontrada — La Garza',
    product?.description || 'Piezas de cerámica en gres hechas por La Garza en Valdivia.',
  );

  if (!product) return <Navigate to="/piezas" replace />;

  const selectedImage = images[activeImage] || images[0];

  return (
    <main id="contenido">
      <article className="product-detail section">
        <Link className="product-detail__back" to="/piezas">← Volver a piezas</Link>
        <div className={`product-detail__gallery${images.length > 1 ? ' has-thumbnails' : ''}`}>
          <figure className="product-detail__media image-reveal">
            <img
              key={selectedImage.src}
              src={selectedImage.src}
              alt={selectedImage.alt}
              fetchPriority="high"
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
                  <img src={image.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail__copy reveal">
          <p className="eyebrow">{product.collection}</p>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <ButtonLink href={product.contactUrl} arrow>Consultar esta línea</ButtonLink>
        </div>
      </article>
    </main>
  );
}
