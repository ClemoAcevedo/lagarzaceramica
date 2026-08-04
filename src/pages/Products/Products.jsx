import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ButtonLink } from '../../components/Links/Links.jsx';
import { CatalogCard } from '../../components/ProductCard/ProductCard.jsx';
import CatalogStatus from '../../components/CatalogStatus/CatalogStatus.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { pageStructuredData } from '../../lib/seo.js';
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
  const { categories, products, loading, error, refresh } = useCatalog();
  const productFilters = useMemo(() => [
    { value: 'all', label: 'Todas' },
    ...categories.map(({ slug, name }) => ({ value: slug, label: name })),
  ], [categories]);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('coleccion');
  const initialFilter = productFilters.some(({ value }) => value === requestedFilter) ? requestedFilter : 'all';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMode, setPriceMode] = useState('all');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('workshop');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimeout = useRef();
  const entranceTimeout = useRef();
  const normalizedQuery = normalizeSearchText(searchQuery);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCollection = activeFilter === 'all' || activeFilter === product.category;
    if (!matchesCollection) return false;
    if (priceMode === 'priced' && !product.priceClp) return false;
    if (priceMode === 'undefined' && product.priceClp) return false;
    if (minimumPrice && (!product.priceClp || product.priceClp < Number(minimumPrice))) return false;
    if (maximumPrice && (!product.priceClp || product.priceClp > Number(maximumPrice))) return false;
    if (!normalizedQuery) return true;

    return normalizeSearchText([
      product.title,
      product.description,
      product.collection,
    ].join(' ')).includes(normalizedQuery);
  }), [activeFilter, maximumPrice, minimumPrice, normalizedQuery, priceMode, products]);
  const visibleProductSlugs = new Set(visibleProducts.map(({ slug }) => slug));
  const orderedProducts = useMemo(() => {
    const workshopOrder = activeFilter === 'all' ? 'catalogOrder' : 'categoryOrder';
    if (sortOrder === 'workshop') {
      return activeFilter === 'all'
        ? products
        : [...products].sort((first, second) => (
          first.categoryOrder - second.categoryOrder
          || first.catalogOrder - second.catalogOrder
        ));
    }
    return [...products].sort((first, second) => {
      if (sortOrder === 'name') return first.title.localeCompare(second.title, 'es');
      if (!first.priceClp && !second.priceClp) return first[workshopOrder] - second[workshopOrder];
      if (!first.priceClp) return 1;
      if (!second.priceClp) return -1;
      return sortOrder === 'price-desc'
        ? second.priceClp - first.priceClp
        : first.priceClp - second.priceClp;
    });
  }, [activeFilter, products, sortOrder]);
  const activeExtraFilters = [
    priceMode !== 'all',
    Boolean(minimumPrice),
    Boolean(maximumPrice),
    sortOrder !== 'workshop',
  ].filter(Boolean).length;

  useEffect(() => () => {
    window.clearTimeout(filterTimeout.current);
    window.clearTimeout(entranceTimeout.current);
  }, []);

  useEffect(() => {
    if (!requestedFilter) return;
    setActiveFilter(productFilters.some(({ value }) => value === requestedFilter) ? requestedFilter : 'all');
  }, [productFilters, requestedFilter]);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('la-garza:catalog-scroll');
    if (savedScroll === null) return undefined;
    sessionStorage.removeItem('la-garza:catalog-scroll');
    const restore = () => window.scrollTo(0, Number(savedScroll));
    const frame = window.requestAnimationFrame(restore);
    const settledLayout = window.setTimeout(restore, 420);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settledLayout);
    };
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

  const clearAllFilters = () => {
    setActiveFilter('all');
    setSearchParams({}, { replace: true });
    setSearchQuery('');
    setPriceMode('all');
    setMinimumPrice('');
    setMaximumPrice('');
    setSortOrder('workshop');
  };

  usePageMeta(
    'Piezas — La Garza',
    'Vitrina de piezas únicas de cerámica en gres hechas por La Garza en Valdivia.',
    { image: products[0]?.image, imageAlt: products[0]?.alt, structuredData: pageStructuredData({ type: 'CollectionPage', name: 'Piezas de La Garza', description: 'Vitrina de piezas únicas de cerámica en gres hechas por La Garza en Valdivia.', path: 'piezas', image: products[0]?.image }) },
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
        <button
          className={`catalog-refine-toggle${filtersOpen ? ' is-open' : ''}`}
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="filtros-avanzados"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          Filtrar y ordenar {activeExtraFilters > 0 && <span>{activeExtraFilters}</span>}
        </button>
        {filtersOpen && (
          <div className="catalog-refinements" id="filtros-avanzados">
            <label>
              Mostrar por precio
              <select value={priceMode} onChange={(event) => setPriceMode(event.target.value)}>
                <option value="all">Todas las piezas</option>
                <option value="priced">Solo con precio</option>
                <option value="undefined">Precio por definir</option>
              </select>
            </label>
            <label>
              Precio mínimo
              <span className="catalog-price-field"><span>$</span><input type="number" min="1" step="1000" inputMode="numeric" value={minimumPrice} placeholder="0" onChange={(event) => setMinimumPrice(event.target.value)} /></span>
            </label>
            <label>
              Precio máximo
              <span className="catalog-price-field"><span>$</span><input type="number" min="1" step="1000" inputMode="numeric" value={maximumPrice} placeholder="Sin límite" onChange={(event) => setMaximumPrice(event.target.value)} /></span>
            </label>
            <label>
              Ordenar piezas
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="workshop">Orden del taller</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre: A–Z</option>
              </select>
            </label>
            <div className="catalog-refinements__summary" role="status">
              <span>{visibleProducts.length} pieza{visibleProducts.length === 1 ? '' : 's'}</span>
              <button type="button" onClick={clearAllFilters}>Limpiar todos los filtros</button>
            </div>
          </div>
        )}
      </div>

      <section
        className={`catalog section${isFiltering ? ' is-filtering' : ''}`}
        data-catalog
        aria-busy={isFiltering}
      >
        <CatalogStatus loading={loading} error={error} onRetry={refresh} />
        {!loading && !error && visibleProducts.length === 0 && (
          <p className="catalog-empty" role="status">
            No encontramos piezas que coincidan con tu búsqueda y clasificación.
          </p>
        )}
        {!loading && !error && orderedProducts.map((product) => (
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
