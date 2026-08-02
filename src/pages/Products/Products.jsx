import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ButtonLink } from '../../components/Links/Links.jsx';
import { CatalogCard } from '../../components/ProductCard/ProductCard.jsx';
import { productFilters, products } from '../../data/products.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { whatsappUrl } from '../../utils/links.js';

const availabilityUrl = whatsappUrl('Hola La Garza, quisiera conocer las piezas disponibles.');

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('coleccion');
  const initialFilter = productFilters.some(({ value }) => value === requestedFilter) ? requestedFilter : 'all';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimeout = useRef();
  const entranceTimeout = useRef();
  const normalizedQuery = normalizeSearchText(searchQuery);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCollection = activeFilter === 'all' || activeFilter === product.category;
    if (!matchesCollection) return false;
    if (!normalizedQuery) return true;

    return normalizeSearchText([
      product.title,
      product.description,
      product.collection,
    ].join(' ')).includes(normalizedQuery);
  }), [activeFilter, normalizedQuery]);
  const visibleProductSlugs = new Set(visibleProducts.map(({ slug }) => slug));

  useEffect(() => () => {
    window.clearTimeout(filterTimeout.current);
    window.clearTimeout(entranceTimeout.current);
  }, []);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('la-garza:catalog-scroll');
    if (savedScroll === null) return undefined;
    sessionStorage.removeItem('la-garza:catalog-scroll');
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, Number(savedScroll)));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const changeFilter = (nextFilter) => {
    if (nextFilter === activeFilter || isFiltering) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveFilter(nextFilter);
      setSearchParams(nextFilter === 'all' ? {} : { coleccion: nextFilter }, { replace: true });
      return;
    }

    setIsFiltering(true);
    filterTimeout.current = window.setTimeout(() => {
      setActiveFilter(nextFilter);
      setSearchParams(nextFilter === 'all' ? {} : { coleccion: nextFilter }, { replace: true });
      entranceTimeout.current = window.setTimeout(() => setIsFiltering(false), 40);
    }, 180);
  };

  usePageMeta(
    'Piezas — La Garza',
    'Vitrina de piezas únicas de cerámica en gres hechas por La Garza en Valdivia.',
    { image: products[0].image },
  );

  return (
    <main id="contenido" className="page-enter">
      <section className="catalog-hero section">
        <div>
          <p className="eyebrow">Edición de taller · 2026</p>
          <h1>Piezas</h1>
        </div>
        <div className="catalog-hero__intro">
          <p>Series pequeñas y objetos únicos modelados en gres. No hay dos piezas exactamente iguales.</p>
        </div>
      </section>

      <div className="catalog-controls section">
        <div className="catalog-filters" role="group" aria-label="Filtrar piezas por colección">
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
        <form className="catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <input
            id="buscar-piezas"
            type="search"
            value={searchQuery}
            aria-label="Buscar piezas"
            placeholder="Buscar piezas"
            autoComplete="off"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearchQuery('')}>×</button>
          )}
        </form>
      </div>

      <section
        className={`catalog section${isFiltering ? ' is-filtering' : ''}`}
        data-catalog
        aria-busy={isFiltering}
      >
        {visibleProducts.length === 0 && (
          <p className="catalog-empty" role="status">
            No encontramos piezas que coincidan con tu búsqueda y clasificación.
          </p>
        )}
        {products.map((product) => (
          <CatalogCard
            key={product.title}
            product={product}
            fromCatalog
            hidden={!visibleProductSlugs.has(product.slug)}
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
