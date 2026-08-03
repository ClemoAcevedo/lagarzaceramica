import { useEffect, useState } from 'react';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { createCategory, deleteCategory, reorderCategories, updateCategory } from '../lib/admin.js';
import AdminPageState from './AdminPageState.jsx';

function move(items, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function Categories() {
  const { categories, products, loading, error, refresh } = useAdminCatalog();
  const [rows, setRows] = useState([]);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setRows(categories.map((category) => ({ ...category }))), [categories]);

  const run = async (action, success) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (actionError) {
      setMessage(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;
    await run(() => createCategory(newName, rows.length), 'Categoría añadida.');
    setNewName('');
  };

  const remove = (category) => {
    const count = products.filter(({ categoryId }) => category.id === categoryId).length;
    if (count) {
      setMessage(`“${category.name}” contiene ${count} pieza${count === 1 ? '' : 's'}. Reasígnalas antes de eliminar la categoría.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”?`)) return;
    run(() => deleteCategory(category.id), 'Categoría eliminada.');
  };

  return (
    <main id="contenido" className="admin-main">
      <header className="admin-page-heading">
        <div><p className="admin-kicker">Organización</p><h1>Categorías</h1><p>Estas opciones aparecen como filtros en la página de piezas.</p></div>
      </header>
      <AdminPageState loading={loading} error={error} onRetry={refresh} />
      {message && <p className="admin-message" role="status">{message}</p>}
      {!loading && !error && (
        <div className="admin-split">
          <section className="admin-card">
            <div className="admin-card__heading"><span>1</span><div><h2>Categorías actuales</h2><p>Renombra o cambia su posición y guarda los cambios.</p></div></div>
            <div className="admin-category-list">
              {rows.map((category, index) => {
                const count = products.filter(({ categoryId }) => category.id === categoryId).length;
                return (
                  <div className="admin-category-row" key={category.id}>
                    <div className="admin-order-buttons">
                      <button type="button" aria-label="Subir" disabled={index === 0 || busy} onClick={() => setRows(move(rows, index, -1))}>↑</button>
                      <button type="button" aria-label="Bajar" disabled={index === rows.length - 1 || busy} onClick={() => setRows(move(rows, index, 1))}>↓</button>
                    </div>
                    <label>Nombre<input value={category.name} onChange={(event) => setRows((current) => current.map((row) => row.id === category.id ? { ...row, name: event.target.value } : row))} /></label>
                    <span>{count} pieza{count === 1 ? '' : 's'}</span>
                    <button type="button" disabled={busy || !category.name.trim()} onClick={() => run(() => updateCategory(category.id, category.name), 'Nombre actualizado.')}>Guardar nombre</button>
                    <button className="is-danger" type="button" disabled={busy} onClick={() => remove(category)}>Eliminar</button>
                  </div>
                );
              })}
            </div>
            <button className="admin-secondary" type="button" disabled={busy} onClick={() => run(() => reorderCategories(rows.map(({ id }) => id)), 'Orden de categorías guardado.')}>Guardar orden</button>
          </section>
          <section className="admin-card admin-card--aside">
            <div className="admin-card__heading"><span>2</span><div><h2>Nueva categoría</h2><p>Podrás asignarle piezas después de crearla.</p></div></div>
            <form className="admin-form" onSubmit={add}>
              <label>Nombre<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Por ejemplo, Costa" maxLength="80" required /></label>
              <button className="admin-primary" type="submit" disabled={busy || !newName.trim()}>Añadir categoría</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

