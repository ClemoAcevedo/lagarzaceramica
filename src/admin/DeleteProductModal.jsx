import { useState } from 'react';
import AdminModal from './AdminModal.jsx';

export default function DeleteProductModal({ product, busy, error, hasUnsavedChanges = false, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const matches = confirmation === product.title;

  return (
    <AdminModal labelledBy="delete-title" onClose={() => { if (!busy) onClose(); }}>
      <div className="admin-modal__card">
        <p className="admin-kicker">Acción permanente</p>
        <h2 id="delete-title">Eliminar “{product.title}”</h2>
        <p>Se borrarán la pieza y todas sus fotografías. Si está publicada, dejará de aparecer inmediatamente en el sitio. Esta acción no se puede deshacer.</p>
        {hasUnsavedChanges && <p className="admin-delete-unsaved">Los cambios que todavía no hayas guardado también se descartarán.</p>}
        <label className="admin-delete-confirmation">
          <span className="admin-delete-confirmation__instruction">Escribe exactamente este nombre para confirmar:</span>
          <strong className="admin-delete-confirmation__name">{product.title}</strong>
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoFocus autoComplete="off" />
        </label>
        {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
        <div className="admin-modal__actions">
          <button className="admin-secondary" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
          <button className="admin-danger" type="button" disabled={!matches || busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button>
        </div>
      </div>
    </AdminModal>
  );
}
