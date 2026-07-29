import { Link } from 'react-router-dom';

export default function ProductCard({ to, image, alt, title, material, tall = false }) {
  return (
    <article className="product-card reveal">
      <Link to={to}>
        <div className={`product-card__image${tall ? ' product-card__image--tall' : ''}`}>
          <img src={image} alt={alt} loading="lazy" />
        </div>
        <div className="product-card__meta">
          <h3>{title}</h3>
          <span>{material}</span>
        </div>
      </Link>
    </article>
  );
}

export function CatalogCard({ product, hidden }) {
  return (
    <article
      className={`catalog-card catalog-card--${product.format || 'portrait'} reveal`}
      data-category={product.category}
      id={product.id}
      hidden={hidden}
    >
      <Link className="catalog-card__link" to={`/piezas/${product.slug}`}>
        <figure className="catalog-card__media image-reveal">
          <img src={product.image} alt={product.alt} loading="lazy" />
        </figure>
        <div className="catalog-card__copy">
          <div>
            <p className="eyebrow">{product.collection}</p>
            <h2>{product.title}</h2>
          </div>
          <span className="catalog-card__action">Ver línea <span>↗</span></span>
        </div>
      </Link>
    </article>
  );
}
