export default function AdminPageState({ loading, error, onRetry }) {
  if (loading) return <div className="admin-page-state" role="status">Cargando información…</div>;
  if (!error) return null;
  return (
    <div className="admin-page-state admin-page-state--error" role="alert">
      <p>No pudimos cargar la información del panel.</p>
      <button type="button" onClick={onRetry}>Intentar nuevamente</button>
    </div>
  );
}

