import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '../../components/Links/Links.jsx';
import { CatalogCard } from '../../components/ProductCard/ProductCard.jsx';
import { productFilters, products } from '../../data/products.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { whatsappUrl } from '../../utils/links.js';

const availabilityUrl = whatsappUrl('Hola La Garza, quisiera conocer las piezas disponibles.');

export default function Products() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimeout = useRef();
  const entranceTimeout = useRef();

  useEffect(() => () => {
    window.clearTimeout(filterTimeout.current);
    window.clearTimeout(entranceTimeout.current);
  }, []);

  const changeFilter = (nextFilter) => {
    if (nextFilter === activeFilter || isFiltering) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveFilter(nextFilter);
      return;
    }

    setIsFiltering(true);
    filterTimeout.current = window.setTimeout(() => {
      setActiveFilter(nextFilter);
      entranceTimeout.current = window.setTimeout(() => setIsFiltering(false), 40);
    }, 180);
  };

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
            onClick={() => changeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        className={`catalog section${isFiltering ? ' is-filtering' : ''}`}
        data-catalog
        aria-busy={isFiltering}
      >
        {products.map((product) => (
          <CatalogCard
            key={product.title}
            product={product}
            hidden={activeFilter !== 'all' && activeFilter !== product.category}
          />
        ))}
      </section>

      <section className="catalog-note section">
        <div className="catalog-note__heading">
          <p className="eyebrow">Disponibilidad del taller</p>
          <h2>Cada pieza tiene su propio gesto.</h2>
        </div>
        <div className="catalog-note__details">
          <p>Las piezas son hechas a mano en series pequeñas. Escríbenos para conocer disponibilidad, medidas y variaciones.</p>
          <ButtonLink href={availabilityUrl} light arrow>Consultar disponibilidad</ButtonLink>
        </div>
      </section>
    </main>
  );
}
