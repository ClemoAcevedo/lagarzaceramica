import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import LoadingImage from '../components/LoadingImage/LoadingImage.jsx';
import {
  permanentlyDeleteProduct,
  publishAllDrafts,
  reorderCategoryProducts,
  reorderProducts,
  setProductStatus,
} from '../lib/admin.js';
import AdminPageState from './AdminPageState.jsx';
import AdminModal from './AdminModal.jsx';
import useUnsavedChanges from '../hooks/useUnsavedChanges.js';

const statusLabels = { draft: 'Borrador', published: 'Publicada', archived: 'Archivada' };

function SortableProduct({ product, busy, canReorder, actionsDisabled, orderPosition, onArchive, onDelete, onOpen, onRestore }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: busy || !canReorder,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <article
      data-confirm-navigation
      className={`admin-product-tile${isDragging ? ' is-dragging' : ''}${canReorder ? '' : ' is-reorder-disabled'}`}
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(product)}
      {...attributes}
      {...listeners}
    >
      <div className="admin-product-tile__media">
        {product.image ? (
          <LoadingImage cropped src={product.image} alt="" style={cropStyle(product.cropX, product.cropY, product.cropZoom)} />
        ) : <span>Sin fotografía</span>}
        {canReorder && <span className="admin-drag-hint" aria-hidden="true"><span>⠿</span> Arrastra</span>}
        <span className="admin-order-rank">Orden {orderPosition}</span>
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
        {product.status === 'published' && <a href={`${import.meta.env.BASE_URL}piezas/${product.slug}`} target="_blank" rel="noopener">Ver sitio ↗</a>}
        {product.status === 'published' && <button type="button" disabled={actionsDisabled} onClick={() => onArchive(product)}>Archivar</button>}
        {product.status === 'archived' && (
          <>
            <button type="button" disabled={actionsDisabled} onClick={() => onRestore(product)}>Restaurar</button>
            <button className="is-danger" type="button" disabled={actionsDisabled} onClick={() => onDelete(product)}>Eliminar</button>
          </>
        )}
      </div>
    </article>
  );
}

export default function AdminProducts() {
  const { categories, products, loading, error, refresh } = useAdminCatalog();
  const location = useLocation();
  const navigate = useNavigate();
  const [ordered, setOrdered] = useState([]);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [confirmPublishAll, setConfirmPublishAll] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderDirty, setOrderDirty] = useState(false);
  const suppressCardClick = useRef(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const draftCount = products.filter(({ status }) => status === 'draft').length;
  const canReorder = !search.trim() && statusFilter === 'all';
  const selectedCategory = categories.find(({ id }) => id === categoryFilter);
  const orderLabel = selectedCategory ? `orden de ${selectedCategory.name}` : 'orden general';

  useUnsavedChanges(orderDirty && !busy);

  useEffect(() => {
    if (!location.state?.notification) return;
    setMessage({ text: location.state.notification, isError: false });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => { setOrdered(products); setOrderDirty(false); }, [products]);

  const categoryProducts = categoryFilter === 'all'
    ? ordered
    : ordered
      .filter(({ categoryId }) => categoryId === categoryFilter)
      .sort((first, second) => (
        first.categoryOrder - second.categoryOrder
        || first.catalogOrder - second.catalogOrder
      ));
  const visibleProducts = categoryProducts.filter((product) => {
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const haystack = `${product.title} ${product.collection}`.toLocaleLowerCase('es');
    return matchesStatus && haystack.includes(search.trim().toLocaleLowerCase('es'));
  });

  const run = async (action, success) => {
    setBusy(true);
    setMessage({ text: '', isError: false });
    try {
      await action();
      await refresh();
      setMessage({ text: success, isError: false });
    } catch (actionError) {
      setMessage({ text: actionError.message, isError: true });
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
    setMessage({ text: '', isError: false });
    try {
      const count = await publishAllDrafts();
      await refresh();
      setMessage({ text: `${count} pieza${count === 1 ? '' : 's'} publicada${count === 1 ? '' : 's'}. La vitrina ya está visible.`, isError: false });
    } catch (publishError) {
      setMessage({ text: publishError.message, isError: true });
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

  const finishDrag = ({ active, over }) => {
    if (!over || active.id === over.id) {
      releaseCardClick();
      return;
    }
    setOrdered((items) => {
      if (categoryFilter === 'all') {
        const from = items.findIndex(({ id }) => id === active.id);
        const to = items.findIndex(({ id }) => id === over.id);
        if (from < 0 || to < 0) return items;
        return arrayMove(items, from, to);
      }

      const categoryItems = items
        .filter(({ categoryId }) => categoryId === categoryFilter)
        .sort((first, second) => first.categoryOrder - second.categoryOrder);
      const from = categoryItems.findIndex(({ id }) => id === active.id);
      const to = categoryItems.findIndex(({ id }) => id === over.id);
      if (from < 0 || to < 0) return items;
      const nextCategoryItems = arrayMove(categoryItems, from, to);
      const positions = new Map(nextCategoryItems.map(({ id }, index) => [id, index]));
      return items.map((item) => positions.has(item.id)
        ? { ...item, categoryOrder: positions.get(item.id) }
        : item);
    });
    setOrderDirty(true);
    releaseCardClick();
  };

  const openProduct = (product) => {
    if (suppressCardClick.current) return;
    navigate(`/admin/piezas/${product.id}`);
  };

  const saveOrder = () => {
    if (categoryFilter === 'all') {
      return run(
        () => reorderProducts(ordered.map(({ id }) => id)),
        'Orden general guardado. La vista “Todas” usará esta secuencia.',
      );
    }
    return run(
      () => reorderCategoryProducts(categoryFilter, categoryProducts.map(({ id }) => id)),
      `Orden de ${selectedCategory?.name || 'la categoría'} guardado.`,
    );
  };

  return (
    <main id="contenido" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <p className="admin-kicker">Catálogo</p>
          <h1>Piezas</h1>
          <p>Elige “Todas” para ordenar la vitrina completa o una categoría para definir su propio orden. Haz clic para editar una pieza.</p>
        </div>
        <div className="admin-page-heading__actions">
          {draftCount > 0 && <button className="admin-secondary" type="button" disabled={busy || orderDirty} onClick={() => setConfirmPublishAll(true)}>Publicar todos ({draftCount})</button>}
          <Link className="admin-primary" to="/admin/piezas/nueva">Añadir nueva pieza</Link>
        </div>
      </header>

      <AdminPageState loading={loading} error={error} onRetry={refresh} />
      {message.text && <p className={`admin-message${message.isError ? ' admin-message--error' : ''}`} role={message.isError ? 'alert' : 'status'}>{message.text}</p>}

      {!loading && !error && (
        <>
          <div className="admin-catalog-tools">
            <label>Buscar piezas<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o categoría" /></label>
            <label>Categoría<select value={categoryFilter} disabled={orderDirty} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Estado<select value={statusFilter} disabled={orderDirty} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option><option value="published">Publicadas</option><option value="draft">Borradores</option><option value="archived">Archivadas</option></select></label>
          </div>
          <div className="admin-list-heading">
            <span>{visibleProducts.length} de {categoryProducts.length} piezas · {orderLabel}{orderDirty ? ' · cambios sin guardar' : ''}</span>
            <div className="admin-list-heading__actions">
              {orderDirty
                ? <small>Guarda el orden antes de publicar, archivar o restaurar piezas.</small>
                : !canReorder && <small>Limpia la búsqueda y muestra todos los estados para reordenar.</small>}
              <button
                className="admin-secondary"
                type="button"
                disabled={busy || !orderDirty}
                onClick={saveOrder}
              >
                {busy && orderDirty ? 'Guardando…' : 'Guardar orden'}
              </button>
            </div>
          </div>
          <div className="admin-global-order">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => { suppressCardClick.current = true; }}
              onDragCancel={releaseCardClick}
              onDragEnd={finishDrag}
            >
              <SortableContext items={visibleProducts.map(({ id }) => id)} strategy={rectSortingStrategy}>
                <div className="admin-product-grid">
                  {visibleProducts.map((product) => (
                    <SortableProduct
                      key={product.id}
                      product={product}
                      busy={busy}
                      canReorder={canReorder}
                      actionsDisabled={busy || orderDirty}
                      orderPosition={categoryFilter === 'all'
                        ? ordered.findIndex(({ id }) => id === product.id) + 1
                        : categoryProducts.findIndex(({ id }) => id === product.id) + 1}
                      onArchive={archive}
                      onDelete={setDeleting}
                      onOpen={openProduct}
                      onRestore={(item) => run(() => setProductStatus(item.id, 'draft'), 'La pieza volvió a borradores.')}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {visibleProducts.length === 0 && <p className="admin-empty">No hay piezas que coincidan con la búsqueda y el estado seleccionados.</p>}
            {orderDirty && (
              <div className="admin-order-save-bottom">
                <span>Cambios de orden sin guardar</span>
                <button className="admin-primary" type="button" disabled={busy} onClick={saveOrder}>{busy ? 'Guardando…' : `Guardar ${orderLabel}`}</button>
              </div>
            )}
          </div>
        </>
      )}

      {confirmPublishAll && (
        <AdminModal labelledBy="publish-all-title" onClose={() => setConfirmPublishAll(false)}>
          <div className="admin-modal__card">
            <p className="admin-kicker">Publicación inicial</p>
            <h2 id="publish-all-title">¿Publicar {draftCount} piezas?</h2>
            <p>Todas quedarán visibles inmediatamente. Los precios vacíos aparecerán como “Precio por definir” y recuperaremos la selección original de tres piezas en Inicio.</p>
            <div className="admin-modal__actions">
              <button className="admin-secondary" type="button" onClick={() => setConfirmPublishAll(false)}>Cancelar</button>
              <button className="admin-primary" type="button" onClick={publishEverything}>Sí, publicar todas</button>
            </div>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <AdminModal labelledBy="delete-title" onClose={() => setDeleting(null)}>
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
        </AdminModal>
      )}
    </main>
  );
}
