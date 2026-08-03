export default function CatalogStatus({ error, loading, onRetry, label = 'Cargando piezas…', variant = 'grid' }) {
  if (loading) {
    return (
      <div className={`catalog-loading catalog-loading--${variant}`} role="status" aria-label={label}>
        <span className="catalog-loading__sr">{label}</span>
        {variant === 'detail' ? (
          <><i className="catalog-loading__media" /><i className="catalog-loading__copy" /></>
        ) : (
          [0, 1, 2].map((item) => <i className="catalog-loading__card" key={item}><b /><span /><small /></i>)
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-status catalog-status--error" role="alert">
        <p>No pudimos cargar el catálogo.</p>
        <button type="button" onClick={onRetry}>Intentar nuevamente</button>
      </div>
    );
  }

  return null;
}
