import { useEffect, useState } from 'react';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { saveFeatured } from '../lib/admin.js';
import { formatPriceCLP } from '../lib/catalog.js';
import { cropStyle } from '../lib/crop.js';
import LoadingImage from '../components/LoadingImage/LoadingImage.jsx';
import AdminPageState from './AdminPageState.jsx';
import CropEditor from './CropEditor.jsx';
import useUnsavedChanges from '../hooks/useUnsavedChanges.js';

export default function HomeSelection() {
  const { products, featuredSelections, loading, error, refresh } = useAdminCatalog();
  const published = products.filter(({ status }) => status === 'published');
  const [selection, setSelection] = useState(() => Array.from({ length: 3 }, () => ({ productId: '', cropX: 50, cropY: 50, cropZoom: 1 })));
  const [message, setMessage] = useState({ text: '', isError: false });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [cropDraft, setCropDraft] = useState(null);

  useUnsavedChanges(dirty || saving, saving ? 'Espera a que termine el guardado antes de salir.' : undefined, saving);

  useEffect(() => {
    setSelection(Array.from({ length: 3 }, (_, index) => featuredSelections[index] || { productId: '', cropX: 50, cropY: 50, cropZoom: 1 }));
    setDirty(false);
  }, [featuredSelections]);

  const save = async () => {
    if (selection.some(({ productId }) => !productId) || new Set(selection.map(({ productId }) => productId)).size !== 3) {
      setMessage({ text: 'Elige tres piezas diferentes antes de guardar.', isError: true });
      return;
    }
    setSaving(true);
    setMessage({ text: '', isError: false });
    try {
      await saveFeatured(selection, featuredSelections);
      const reloaded = await refresh();
      setDirty(false);
      setMessage({ text: `La selección de inicio quedó actualizada.${reloaded ? '' : ' No pudimos recargar el panel.'}`, isError: false });
    } catch (saveError) {
      setMessage({ text: saveError.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="contenido" className="admin-main">
      <header className="admin-page-heading"><div><p className="admin-kicker">Página de inicio</p><h1>Piezas singulares</h1><p>Elige las tres piezas, y su orden, para la sección “Selección del taller”.</p></div></header>
      <AdminPageState loading={loading} error={error} onRetry={refresh} />
      {message.text && <p className={`admin-message${message.isError ? ' admin-message--error' : ''}`} role={message.isError ? 'alert' : 'status'}>{message.text}</p>}
      {saving && <p className="admin-busy" role="status">Guardando la selección…</p>}
      {!loading && !error && (
        <section className="admin-card" aria-busy={saving} inert={saving ? true : undefined}>
          <div className="admin-featured-grid">
            {selection.map((selected, index) => {
              const product = published.find((item) => item.id === selected.productId);
              return (
                <div className="admin-featured-slot" key={index}>
                  <span className="admin-featured-slot__number">Posición {index + 1}</span>
                  <label>
                    Pieza
                    <select value={selected.productId} onChange={(event) => { setDirty(true); setSelection((current) => current.map((value, itemIndex) => itemIndex === index ? { productId: event.target.value, cropX: 50, cropY: 50, cropZoom: 1 } : value)); }}>
                      <option value="">Selecciona una pieza</option>
                      {published.map((option) => <option key={option.id} value={option.id} disabled={selection.some(({ productId }) => productId === option.id) && option.id !== selected.productId}>{option.title}</option>)}
                    </select>
                  </label>
                  <div className="admin-featured-preview">
                    {product ? <><div className="admin-featured-preview__media"><LoadingImage cropped src={product.image} alt="" style={cropStyle(selected.cropX, selected.cropY, selected.cropZoom)} /></div><h2>{product.title}</h2><p>{product.material} · {formatPriceCLP(product.priceClp)}</p><button className="admin-secondary" type="button" onClick={() => setCropDraft({ index, value: { x: selected.cropX, y: selected.cropY, zoom: selected.cropZoom } })}>Reencuadrar para Inicio</button></> : <p>Aquí verás una vista previa.</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="admin-sticky-actions admin-sticky-actions--inline">{dirty && <span className="admin-unsaved" role="status">Cambios sin guardar</span>}<button className="admin-primary" type="button" disabled={saving || published.length < 3 || !dirty} onClick={save}>{saving ? 'Guardando…' : 'Guardar selección'}</button></div>
          {published.length < 3 && <p className="admin-field-error">Necesitas al menos tres piezas publicadas para completar esta sección.</p>}
        </section>
      )}
      {cropDraft && (() => {
        const selected = selection[cropDraft.index];
        const product = published.find(({ id }) => id === selected.productId);
        return product ? (
          <CropEditor
            image={product.image}
            value={cropDraft.value}
            aspect="home"
            onChange={(value) => setCropDraft((current) => ({ ...current, value }))}
            onCancel={() => setCropDraft(null)}
            onSave={() => { setDirty(true); setSelection((current) => current.map((item, index) => index === cropDraft.index ? { ...item, cropX: cropDraft.value.x, cropY: cropDraft.value.y, cropZoom: cropDraft.value.zoom } : item)); setCropDraft(null); }}
          />
        ) : null;
      })()}
    </main>
  );
}
