import { Link } from 'react-router-dom';

import { formatPriceCLP } from '../../lib/catalog.js';
import { cropStyle } from '../../lib/crop.js';
import LoadingImage from '../LoadingImage/LoadingImage.jsx';

export default function ProductCard({ to, image, alt, title, material, priceClp, cropX, cropY, cropZoom, tall = false }) {
  return (
    <article className="product-card reveal">
      <Link to={to}>
        <div className={`product-card__image${tall ? ' product-card__image--tall' : ''}`}>
          <LoadingImage src={image} alt={alt} loading="lazy" style={cropStyle(cropX, cropY, cropZoom)} />
        </div>
        <div className="product-card__meta">
          <h3>{title}</h3>
          <span>{material}<br />{formatPriceCLP(priceClp)}</span>
        </div>
      </Link>
    </article>
  );
}

export function CatalogCard({ product, hidden, fromCatalog = false }) {
  return (
    <article
      className={`catalog-card catalog-card--${product.format || 'portrait'}${product.previewFit ? ` catalog-card--${product.previewFit}` : ''}${product.previewPosition === 'bottom' ? ' catalog-card--bottom' : ''} reveal`}
      data-category={product.category}
      id={product.id}
      hidden={hidden}
    >
      <Link
        className="catalog-card__link"
        to={`/piezas/${product.slug}`}
        state={fromCatalog ? { fromCatalog: true } : undefined}
        onClick={() => {
          if (fromCatalog) sessionStorage.setItem('la-garza:catalog-scroll', String(window.scrollY));
        }}
      >
        <figure className="catalog-card__media image-reveal">
          <LoadingImage src={product.image} alt={product.alt} loading="lazy" style={cropStyle(product.cropX, product.cropY, product.cropZoom)} />
        </figure>
        <div className="catalog-card__copy">
          <div>
            <p className="eyebrow">{product.collection}</p>
            <h2>{product.title}</h2>
          </div>
          <span className="catalog-card__action">Ver línea <span>↗</span></span>
          <p className="catalog-card__price">{formatPriceCLP(product.priceClp)}</p>
        </div>
      </Link>
    </article>
  );
}
