import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAdminCatalog } from '../lib/catalog.js';
import { cleanupOrphanedStorage } from '../lib/admin.js';

const AdminCatalogContext = createContext(null);

export function AdminCatalogProvider({ children }) {
  const [catalog, setCatalog] = useState({ categories: [], products: [], featuredSelections: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCatalog(await fetchAdminCatalog());
      return true;
    } catch (catalogError) {
      setError(catalogError);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    cleanupOrphanedStorage().catch(() => {});
  }, [refresh]);

  const value = useMemo(() => ({ ...catalog, loading, error, refresh }), [catalog, error, loading, refresh]);
  return <AdminCatalogContext.Provider value={value}>{children}</AdminCatalogContext.Provider>;
}

export function useAdminCatalog() {
  const context = useContext(AdminCatalogContext);
  if (!context) throw new Error('useAdminCatalog debe usarse dentro de AdminCatalogProvider.');
  return context;
}
