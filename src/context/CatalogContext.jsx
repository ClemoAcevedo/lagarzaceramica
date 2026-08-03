import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPublicCatalog } from '../lib/catalog.js';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState({ categories: [], products: [], featuredProducts: [], source: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCatalog(await fetchPublicCatalog());
    } catch (catalogError) {
      setError(catalogError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('la-garza:catalog-changed', refresh);
    return () => window.removeEventListener('la-garza:catalog-changed', refresh);
  }, [refresh]);

  const value = useMemo(() => ({ ...catalog, loading, error, refresh }), [catalog, error, loading, refresh]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog debe usarse dentro de CatalogProvider.');
  return context;
}

