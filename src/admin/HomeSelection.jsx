import { useEffect, useState } from 'react';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { saveFeatured } from '../lib/admin.js';
import { formatPriceCLP } from '../lib/catalog.js';
import { cropStyle } from '../lib/crop.js';
import AdminPageState from './AdminPageState.jsx';

export default function HomeSelection() {
  const { products, featuredIds, loading, error, refresh } = useAdminCatalog();
  const published = products.filter(({ status }) => status === 'published');
  const [selection, setSelection] = useState(['', '', '']);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelection([featuredIds[0] || '', featuredIds[1] || '', featuredIds[2] || '']), [featuredIds]);

  const save = async () => {
    if (selection.some((id) => !id) || new Set(selection).size !== 3) {
      setMessage('Elige tres piezas diferentes antes de guardar.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await saveFeatured(selection);
      await refresh();
      setMessage('La selección de inicio quedó actualizada.');
    } catch (saveError) {
      setMessage(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="contenido" className="admin-main">
      <header className="admin-page-heading"><div><p className="admin-kicker">Página de inicio</p><h1>Piezas singulares</h1><p>Elige las tres piezas, y su orden, para la sección “Selección del taller”.</p></div></header>
      <AdminPageState loading={loading} error={error} onRetry={refresh} />
      {message && <p className="admin-message" role="status">{message}</p>}
      {!loading && !error && (
        <section className="admin-card">
          <div className="admin-featured-grid">
            {selection.map((id, index) => {
              const product = published.find((item) => item.id === id);
              return (
                <div className="admin-featured-slot" key={index}>
                  <span className="admin-featured-slot__number">Posición {index + 1}</span>
                  <label>
                    Pieza
                    <select value={id} onChange={(event) => setSelection((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}>
                      <option value="">Selecciona una pieza</option>
                      {published.map((option) => <option key={option.id} value={option.id} disabled={selection.includes(option.id) && option.id !== id}>{option.title}</option>)}
                    </select>
                  </label>
                  <div className="admin-featured-preview">
                    {product ? <><div className="admin-featured-preview__media"><img src={product.image} alt="" style={cropStyle(product.cropX, product.cropY, product.cropZoom)} /></div><h2>{product.title}</h2><p>{product.material} · {formatPriceCLP(product.priceClp)}</p></> : <p>Aquí verás una vista previa.</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="admin-sticky-actions"><button className="admin-primary" type="button" disabled={saving || published.length < 3} onClick={save}>{saving ? 'Guardando…' : 'Guardar selección'}</button></div>
          {published.length < 3 && <p className="admin-field-error">Necesitas al menos tres piezas publicadas para completar esta sección.</p>}
        </section>
      )}
    </main>
  );
}
