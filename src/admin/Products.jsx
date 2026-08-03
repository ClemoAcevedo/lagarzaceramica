import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { formatPriceCLP } from '../lib/catalog.js';
import { cropStyle } from '../lib/crop.js';
import {
  permanentlyDeleteProduct,
  publishAllDrafts,
  reorderProducts,
  setProductStatus,
} from '../lib/admin.js';
import AdminPageState from './AdminPageState.jsx';

const statusLabels = { draft: 'Borrador', published: 'Publicada', archived: 'Archivada' };

function SortableProduct({ product, busy, onArchive, onDelete, onOpen, onRestore }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: busy,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <article
      className={`admin-product-tile${isDragging ? ' is-dragging' : ''}`}
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(product)}
      {...attributes}
      {...listeners}
    >
      <div className="admin-product-tile__media">
        {product.image ? (
          <img src={product.image} alt="" style={cropStyle(product.cropX, product.cropY, product.cropZoom)} />
        ) : <span>Sin fotografía</span>}
        <span className="admin-drag-hint" aria-hidden="true"><span>⠿</span> Arrastra la tarjeta</span>
        <span className={`admin-status admin-status--${product.status}`}>{statusLabels[product.status]}</span>
      </div>
      <div className="admin-product-tile__copy">
        <p>{product.collection}</p>
        <h2>{product.title}</h2>
        <strong>{formatPriceCLP(product.priceClp)}</strong>
      </div>
      <div
        className="admin-product-tile__actions"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Link to={`/admin/piezas/${product.id}`}>Editar</Link>
        {product.status === 'published' && <button type="button" disabled={busy} onClick={() => onArchive(product)}>Archivar</button>}
        {product.status === 'archived' && (
          <>
            <button type="button" disabled={busy} onClick={() => onRestore(product)}>Restaurar</button>
            <button className="is-danger" type="button" disabled={busy} onClick={() => onDelete(product)}>Eliminar</button>
          </>
        )}
      </div>
    </article>
  );
}

export default function AdminProducts() {
  const { categories, products, loading, error, refresh } = useAdminCatalog();
  const navigate = useNavigate();
  const [ordered, setOrdered] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [confirmPublishAll, setConfirmPublishAll] = useState(false);
  const suppressCardClick = useRef(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const draftCount = products.filter(({ status }) => status === 'draft').length;

  useEffect(() => setOrdered(products), [products]);

  const groupedProducts = categories
    .map((category) => ({
      category,
      products: ordered.filter((product) => product.categoryId === category.id),
    }))
    .filter(({ products: categoryProducts }) => categoryProducts.length > 0);

  const knownCategoryIds = new Set(categories.map(({ id: categoryId }) => categoryId));
  const uncategorized = ordered.filter(({ categoryId }) => !knownCategoryIds.has(categoryId));
  if (uncategorized.length) {
    groupedProducts.push({ category: { id: 'uncategorized', name: 'Sin categoría' }, products: uncategorized });
  }

  const run = async (action, success) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (actionError) {
      setMessage(actionError.message);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const archive = (product) => {
    if (!window.confirm(`¿Archivar “${product.title}”? Dejará de aparecer en el sitio.`)) return;
    run(() => setProductStatus(product.id, 'archived'), 'La pieza quedó archivada.');
  };

  const removePermanently = async () => {
    if (!deleting || confirmation !== deleting.title) return;
    await run(() => permanentlyDeleteProduct(deleting), 'La pieza y sus fotografías fueron eliminadas.');
    setDeleting(null);
    setConfirmation('');
  };

  const publishEverything = async () => {
    setConfirmPublishAll(false);
    setBusy(true);
    setMessage('');
    try {
      const count = await publishAllDrafts();
      await refresh();
      setMessage(`${count} pieza${count === 1 ? '' : 's'} publicada${count === 1 ? '' : 's'}. La vitrina ya está visible.`);
    } catch (publishError) {
      setMessage(publishError.message);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const releaseCardClick = () => {
    window.setTimeout(() => {
      suppressCardClick.current = false;
    }, 0);
  };

  const finishDrag = (categoryId, { active, over }) => {
    if (!over || active.id === over.id) {
      releaseCardClick();
      return;
    }
    setOrdered((items) => {
      const from = items.findIndex(({ id }) => id === active.id);
      const to = items.findIndex(({ id }) => id === over.id);
      if (items[from]?.categoryId !== categoryId || items[to]?.categoryId !== categoryId) return items;
      return arrayMove(items, from, to);
    });
    releaseCardClick();
  };

  const openProduct = (product) => {
    if (suppressCardClick.current) return;
    navigate(`/admin/piezas/${product.id}`);
  };

  return (
    <main id="contenido" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <p className="admin-kicker">Catálogo</p>
          <h1>Piezas</h1>
          <p>Arrastra una tarjeta desde cualquier punto para ordenarla dentro de su categoría. Haz clic para editarla.</p>
        </div>
        <div className="admin-page-heading__actions">
          {draftCount > 0 && <button className="admin-secondary" type="button" disabled={busy} onClick={() => setConfirmPublishAll(true)}>Publicar todos ({draftCount})</button>}
          <Link className="admin-primary" to="/admin/piezas/nueva">Añadir nueva pieza</Link>
        </div>
      </header>

      <AdminPageState loading={loading} error={error} onRetry={refresh} />
      {message && <p className="admin-message" role="status">{message}</p>}

      {!loading && !error && (
        <>
          <div className="admin-list-heading">
            <span>{ordered.length} piezas · ordenadas por categoría</span>
            <button
              className="admin-secondary"
              type="button"
              disabled={busy}
              onClick={() => run(() => reorderProducts(ordered.map(({ id }) => id)), 'Nuevo orden guardado.')}
            >
              Guardar orden
            </button>
          </div>
          <div className="admin-category-groups">
            {groupedProducts.map(({ category, products: categoryProducts }) => (
              <section className="admin-category-group" key={category.id}>
                <header className="admin-category-group__heading">
                  <div><p className="admin-kicker">Categoría</p><h2>{category.name}</h2></div>
                  <span>{categoryProducts.length} pieza{categoryProducts.length === 1 ? '' : 's'}</span>
                </header>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={() => { suppressCardClick.current = true; }}
                  onDragCancel={releaseCardClick}
                  onDragEnd={(event) => finishDrag(category.id, event)}
                >
                  <SortableContext items={categoryProducts.map(({ id }) => id)} strategy={rectSortingStrategy}>
                    <div className="admin-product-grid">
                      {categoryProducts.map((product) => (
                        <SortableProduct
                          key={product.id}
                          product={product}
                          busy={busy}
                          onArchive={archive}
                          onDelete={setDeleting}
                          onOpen={openProduct}
                          onRestore={(item) => run(() => setProductStatus(item.id, 'draft'), 'La pieza volvió a borradores.')}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>
            ))}
          </div>
        </>
      )}

      {confirmPublishAll && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="publish-all-title">
          <div className="admin-modal__card">
            <p className="admin-kicker">Publicación inicial</p>
            <h2 id="publish-all-title">¿Publicar {draftCount} piezas?</h2>
            <p>Todas quedarán visibles inmediatamente. Los precios vacíos aparecerán como “Precio por definir” y recuperaremos la selección original de tres piezas en Inicio.</p>
            <div className="admin-modal__actions">
              <button className="admin-secondary" type="button" onClick={() => setConfirmPublishAll(false)}>Cancelar</button>
              <button className="admin-primary" type="button" onClick={publishEverything}>Sí, publicar todas</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="admin-modal__card">
            <p className="admin-kicker">Acción permanente</p>
            <h2 id="delete-title">Eliminar “{deleting.title}”</h2>
            <p>Se borrarán la pieza y todas sus fotografías. Esta acción no se puede deshacer.</p>
            <label>
              Escribe <strong>{deleting.title}</strong> para confirmar
              <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoFocus />
            </label>
            <div className="admin-modal__actions">
              <button className="admin-secondary" type="button" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="admin-danger" type="button" disabled={confirmation !== deleting.title || busy} onClick={removePermanently}>Eliminar definitivamente</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
