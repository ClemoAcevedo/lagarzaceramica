import { useEffect, useState } from 'react';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { createCategory, deleteCategory, reorderCategories, updateCategory } from '../lib/admin.js';
import AdminPageState from './AdminPageState.jsx';
import useUnsavedChanges from '../hooks/useUnsavedChanges.js';

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
  const [message, setMessage] = useState({ text: '', isError: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRows(categories.map((category) => ({ ...category }))); }, [categories]);

  const originalNames = new Map(categories.map(({ id, name }) => [id, name]));
  const renamedRows = rows.filter(({ id, name }) => name.trim() !== originalNames.get(id));
  const orderDirty = rows.some(({ id }, index) => id !== categories[index]?.id);
  const existingDirty = renamedRows.length > 0 || orderDirty;
  const namesAreValid = rows.every(({ name }) => name.trim());
  const newCategoryStarted = Boolean(newName.trim());

  useUnsavedChanges((existingDirty || newCategoryStarted) && !busy);

  const run = async (action, success) => {
    setBusy(true);
    setMessage({ text: '', isError: false });
    try {
      await action();
      await refresh();
      setMessage({ text: success, isError: false });
    } catch (actionError) {
      setMessage({ text: actionError.message, isError: true });
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

  const saveChanges = async () => {
    if (!existingDirty || !namesAreValid) return;
    setBusy(true);
    setMessage({ text: '', isError: false });
    try {
      for (const category of renamedRows) {
        await updateCategory(category.id, category.name);
      }
      if (orderDirty) await reorderCategories(rows.map(({ id }) => id));
      await refresh();
      setMessage({ text: 'Nombres y orden de las categorías guardados.', isError: false });
    } catch (saveError) {
      setMessage({ text: saveError.message, isError: true });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = (category) => {
    const count = products.filter(({ categoryId }) => category.id === categoryId).length;
    if (count) {
      setMessage({ text: `“${category.name}” contiene ${count} pieza${count === 1 ? '' : 's'}. Reasígnalas antes de eliminar la categoría.`, isError: true });
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
      {message.text && <p className={`admin-message${message.isError ? ' admin-message--error' : ''}`} role={message.isError ? 'alert' : 'status'}>{message.text}</p>}
      {!loading && !error && (
        <div className="admin-split">
          <section className="admin-card">
            <div className="admin-card__heading"><span>1</span><div><h2>Categorías actuales</h2><p>Edita los nombres o el orden y guarda todo en una sola acción.</p></div></div>
            <div className="admin-category-list">
              {rows.map((category, index) => {
                const count = products.filter(({ categoryId }) => category.id === categoryId).length;
                return (
                  <div className="admin-category-row" key={category.id}>
                    <div className="admin-order-buttons">
                      <button type="button" aria-label={`Subir ${category.name}`} disabled={index === 0 || busy} onClick={() => setRows(move(rows, index, -1))}>↑</button>
                      <button type="button" aria-label={`Bajar ${category.name}`} disabled={index === rows.length - 1 || busy} onClick={() => setRows(move(rows, index, 1))}>↓</button>
                    </div>
                    <label>Nombre<input value={category.name} aria-invalid={!category.name.trim()} onChange={(event) => setRows((current) => current.map((row) => row.id === category.id ? { ...row, name: event.target.value } : row))} /></label>
                    <span>{count} pieza{count === 1 ? '' : 's'}</span>
                    <button className="is-danger" type="button" disabled={busy || existingDirty || newCategoryStarted} onClick={() => remove(category)}>Eliminar</button>
                  </div>
                );
              })}
            </div>
            <div className="admin-category-save">
              <span>{existingDirty ? 'Hay cambios sin guardar.' : 'Todo está guardado.'}</span>
              <button className="admin-primary" type="button" disabled={busy || !existingDirty || !namesAreValid} onClick={saveChanges}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </section>
          <section className="admin-card admin-card--aside">
            <div className="admin-card__heading"><span>2</span><div><h2>Nueva categoría</h2><p>Podrás asignarle piezas después de crearla.</p></div></div>
            <form className="admin-form" onSubmit={add}>
              <label>Nombre<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Por ejemplo, Costa" maxLength="80" required /></label>
              {existingDirty && <p className="admin-help">Guarda primero los cambios de las categorías actuales.</p>}
              <button className="admin-primary" type="submit" disabled={busy || existingDirty || !newName.trim()}>Añadir categoría</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
