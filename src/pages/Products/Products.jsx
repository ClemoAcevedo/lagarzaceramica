import { useState } from 'react';
import { ButtonLink } from '../../components/Links/Links.jsx';
import { CatalogCard } from '../../components/ProductCard/ProductCard.jsx';
import { productFilters, products } from '../../data/products.js';
import usePageMeta from '../../hooks/usePageMeta.js';

const availabilityUrl = 'https://wa.me/?text=Hola%20La%20Garza%2C%20quisiera%20conocer%20las%20piezas%20disponibles.';

export default function Products() {
  const [activeFilter, setActiveFilter] = useState('all');

  usePageMeta(
    'Piezas — La Garza',
    'Vitrina de piezas únicas de cerámica en gres hechas por La Garza en Valdivia.',
  );

  return (
    <main id="contenido">
      <section className="catalog-hero section">
        <div>
          <p className="eyebrow">Edición de taller · 2026</p>
          <h1>Piezas</h1>
        </div>
        <div className="catalog-hero__intro">
          <span>01 — 08</span>
          <p>Series pequeñas y objetos únicos modelados en gres. No hay dos piezas exactamente iguales.</p>
        </div>
      </section>

      <div className="catalog-controls section" role="group" aria-label="Filtrar piezas por colección">
        {productFilters.map(({ value, label }) => (
          <button
            className={`filter${activeFilter === value ? ' is-active' : ''}`}
            data-filter={value}
            type="button"
            key={value}
            aria-pressed={activeFilter === value}
            onClick={() => setActiveFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="catalog section" data-catalog>
        {products.map((product) => (
          <CatalogCard
            key={product.title}
            product={product}
            hidden={activeFilter !== 'all' && activeFilter !== product.category}
          />
        ))}
      </section>

      <section className="catalog-note section">
        <p>Las piezas son hechas a mano en series pequeñas. Escríbenos para conocer disponibilidad, medidas y variaciones.</p>
        <ButtonLink href={availabilityUrl}>Consultar disponibilidad</ButtonLink>
      </section>
    </main>
  );
}
