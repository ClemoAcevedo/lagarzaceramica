import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAdminCatalog } from '../context/AdminCatalogContext.jsx';
import { saveProduct } from '../lib/admin.js';
import { slugify } from '../lib/catalog.js';
import { cropStyle } from '../lib/crop.js';
import useUnsavedChanges from '../hooks/useUnsavedChanges.js';
import { validateProductImage } from '../lib/images.js';
import AdminPageState from './AdminPageState.jsx';
import CropEditor from './CropEditor.jsx';

const emptyValues = {
  title: '',
  description: '',
  price: '',
  material: 'Gres esmaltado',
  categoryId: '',
  status: 'draft',
  format: 'portrait',
  previewFit: 'cover',
  previewPosition: 'center',
  cropX: 50,
  cropY: 50,
  cropZoom: 1,
};

function move(items, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }));
}

export default function ProductForm() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const { categories, products, loading, error, refresh } = useAdminCatalog();
  const product = useMemo(() => products.find((item) => item.id === id), [id, products]);
  const [values, setValues] = useState(emptyValues);
  const [images, setImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [coverClientId, setCoverClientId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cropDraft, setCropDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const previewUrls = useRef(new Set());

  useUnsavedChanges(dirty && !saving);

  useEffect(() => {
    if (isNew) {
      setValues((current) => ({ ...current, categoryId: current.categoryId || categories[0]?.id || '' }));
      return;
    }
    if (!product) return;
    setValues({
      title: product.title,
      description: product.description,
      price: product.priceClp ? String(product.priceClp) : '',
      material: product.material,
      categoryId: product.categoryId,
      status: product.status,
      format: product.format,
      previewFit: product.previewFit || 'cover',
      previewPosition: product.previewPosition || 'center',
      cropX: product.cropX,
      cropY: product.cropY,
      cropZoom: product.cropZoom,
    });
    setImages(product.images.map((image, index) => ({ ...image, kind: 'existing', clientId: image.id, sortOrder: index })));
    setCoverClientId(product.coverImageId || product.images[0]?.id || null);
    setRemovedImages([]);
    setDirty(false);
  }, [categories, isNew, product]);

  useEffect(() => () => {
    previewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
  }, []);

  if (loading) return <main className="admin-main"><AdminPageState loading /></main>;
  if (error) return <main className="admin-main"><AdminPageState error={error} onRetry={refresh} /></main>;
  if (!isNew && !product) return <Navigate to="/admin/piezas" replace />;

  const setField = (field) => (event) => {
    setDirty(true);
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const addFiles = (event) => {
    const additions = [];
    const failures = [];
    [...event.target.files].forEach((file) => {
      try {
        validateProductImage(file);
      } catch (validationError) {
        failures.push(validationError.message);
        return;
      }
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      additions.push({
        kind: 'new',
        clientId: crypto.randomUUID(),
        file,
        alt: values.title ? `${values.title} — fotografía de la pieza` : file.name.replace(/\.[^.]+$/, ''),
        preview,
        cropX: 50,
        cropY: 50,
        cropZoom: 1,
      });
    });
    setFormError(failures.join(' '));
    if (!coverClientId && additions[0]) setCoverClientId(additions[0].clientId);
    setImages((current) => [...current, ...additions].map((image, index) => ({ ...image, sortOrder: index })));
    if (additions.length) setDirty(true);
    event.target.value = '';
  };

  const removeImage = (index) => {
    const target = images[index];
    if (target.kind === 'existing') setRemovedImages((current) => [...current, target]);
    else {
      URL.revokeObjectURL(target.preview);
      previewUrls.current.delete(target.preview);
    }
    const nextImages = images.filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, sortOrder: imageIndex }));
    if (target.clientId === coverClientId) setCoverClientId(nextImages[0]?.clientId || null);
    setImages(nextImages);
    setDirty(true);
  };

  const coverItem = images.find(({ clientId }) => clientId === coverClientId) || images[0];
  const coverImage = coverItem?.src || coverItem?.preview;

  const openCoverCropEditor = () => {
    if (!coverImage) return;
    setCropDraft({
      kind: 'cover',
      image: coverImage,
      aspect: 'cover',
      value: { x: values.cropX, y: values.cropY, zoom: values.cropZoom },
    });
  };

  const openImageCropEditor = (image) => {
    setCropDraft({
      kind: 'gallery',
      clientId: image.clientId,
      image: image.src || image.preview,
      aspect: 'gallery',
      value: { x: image.cropX, y: image.cropY, zoom: image.cropZoom },
    });
  };

  const saveCrop = () => {
    const crop = {
      cropX: Number(cropDraft.value.x.toFixed(2)),
      cropY: Number(cropDraft.value.y.toFixed(2)),
      cropZoom: Number(cropDraft.value.zoom.toFixed(2)),
    };
    if (cropDraft.kind === 'cover') {
      setValues((current) => ({
        ...current,
        ...crop,
        previewFit: 'cover',
        previewPosition: 'center',
      }));
    } else {
      setImages((current) => current.map((image) => image.clientId === cropDraft.clientId ? { ...image, ...crop } : image));
    }
    setDirty(true);
    setCropDraft(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!values.title.trim() || !values.description.trim() || !values.material.trim() || !values.categoryId) {
      setFormError('Completa el título, la descripción, el material y la categoría.');
      return;
    }
    if (!slugify(values.title)) {
      setFormError('El nombre necesita al menos una letra o un número para crear su dirección.');
      return;
    }
    if (images.some(({ alt }) => !alt.trim())) {
      setFormError('Cada fotografía necesita una descripción alternativa.');
      return;
    }

    setSaving(true);
    try {
      await saveProduct({
        product,
        values: {
          ...values,
          priceClp: values.price ? Number(values.price) : null,
        },
        images,
        removedImages,
        coverClientId,
      });
      setDirty(false);
      await refresh();
      navigate('/admin/piezas', { replace: true });
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="contenido" className="admin-main admin-editor">
      <header className="admin-page-heading admin-page-heading--compact">
        <div>
          <Link className="admin-back" to="/admin/piezas">← Volver a piezas</Link>
          <p className="admin-kicker">{isNew ? 'Nueva pieza' : 'Editar pieza'}</p>
          <h1>{isNew ? 'Añadir una pieza' : product.title}</h1>
          <p>La dirección pública será <code>/piezas/{slugify(values.title) || 'nombre-de-la-pieza'}</code>. Si cambias el nombre, las direcciones anteriores seguirán redirigiendo aquí.</p>
        </div>
      </header>

      <form className="admin-editor__form" onSubmit={submit}>
        <section className="admin-card">
          <div className="admin-card__heading">
            <span>1</span>
            <div><h2>Información principal</h2><p>Lo que las personas verán en el catálogo y en la ficha.</p></div>
          </div>
          <div className="admin-fields admin-fields--two">
            <label className="admin-field--wide">
              Nombre de la pieza
              <input value={values.title} onChange={setField('title')} maxLength="140" required />
            </label>
            <label className="admin-field--wide">
              Descripción
              <textarea value={values.description} onChange={setField('description')} rows="5" required />
            </label>
            <label>
              Precio en pesos chilenos
              <span className="admin-help">Opcional. Si lo dejas vacío se mostrará “Precio por definir”.</span>
              <div className="admin-price-input"><span>$</span><input type="number" min="1" step="1" value={values.price} onChange={setField('price')} inputMode="numeric" /></div>
            </label>
            <label>
              Material
              <input value={values.material} onChange={setField('material')} maxLength="100" required />
            </label>
            <label>
              Categoría
              <select value={values.categoryId} onChange={setField('categoryId')} required>
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              Estado
              <select value={values.status} onChange={setField('status')}>
                <option value="draft">Borrador — solo visible aquí</option>
                <option value="published">Publicada — visible en el sitio</option>
                {product?.status === 'archived' && <option value="archived">Archivada</option>}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__heading">
            <span>2</span>
            <div><h2>Fotografías</h2><p>Ordena la galería y elige su portada por separado. Cada fotografía conserva su propio encuadre.</p></div>
          </div>
          <div className="admin-image-list">
            {images.map((image, index) => (
              <article className={`admin-image-item${image.kind === 'new' ? ' admin-image-item--new' : ''}${image.clientId === coverClientId ? ' is-cover' : ''}`} key={image.clientId}>
                <span className="admin-image-item__preview">
                  <img src={image.src || image.preview} alt="" style={cropStyle(image.cropX, image.cropY, image.cropZoom)} />
                </span>
                <label>Descripción para accesibilidad<input value={image.alt} onChange={(event) => { setDirty(true); setImages((current) => current.map((item) => item.clientId === image.clientId ? { ...item, alt: event.target.value } : item)); }} /></label>
                <div>
                  {image.kind === 'new' && <span>Nueva fotografía</span>}
                  {image.clientId === coverClientId ? <span>Portada actual</span> : <button type="button" onClick={() => { setCoverClientId(image.clientId); setValues((current) => ({ ...current, cropX: 50, cropY: 50, cropZoom: 1 })); setDirty(true); }}>Usar como portada</button>}
                  <button type="button" disabled={index === 0} onClick={() => { setImages(move(images, index, -1)); setDirty(true); }}>↑ Subir</button>
                  <button type="button" disabled={index === images.length - 1} onClick={() => { setImages(move(images, index, 1)); setDirty(true); }}>↓ Bajar</button>
                  <button type="button" onClick={() => openImageCropEditor(image)}>Reencuadrar galería</button>
                  <button className="is-danger" type="button" onClick={() => removeImage(index)}>Quitar</button>
                </div>
              </article>
            ))}
          </div>
          <label className="admin-upload">
            <strong>Añadir fotografías</strong>
            <span>Selecciona una o varias imágenes JPEG, PNG o WebP. Se optimizarán automáticamente.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} />
          </label>
          <div className="admin-cover-tool">
            <div>
              <strong>Encuadre de la portada</strong>
              <span>Este encuadre se usa en el catálogo. No modifica el encuadre de la misma fotografía dentro de la galería.</span>
            </div>
            <button className="admin-secondary" type="button" disabled={!coverImage} onClick={openCoverCropEditor}>
              Reencuadrar portada del catálogo
            </button>
          </div>
        </section>

        {formError && <p className="admin-message admin-message--error" role="alert">{formError}</p>}
        <div className="admin-sticky-actions">
          {dirty && <span className="admin-unsaved" role="status">Cambios sin guardar</span>}
          {!isNew && product.status === 'published' && <a className="admin-secondary" href={`${import.meta.env.BASE_URL}piezas/${product.slug}`} target="_blank" rel="noopener">Ver en el sitio ↗</a>}
          <Link className="admin-secondary" to="/admin/piezas">Cancelar</Link>
          <button className="admin-primary" type="submit" disabled={saving || !dirty}>{saving ? 'Guardando…' : 'Guardar pieza'}</button>
        </div>
      </form>
      {cropDraft && (
        <CropEditor
          image={cropDraft.image}
          value={cropDraft.value}
          aspect={cropDraft.aspect}
          onChange={(value) => setCropDraft((current) => ({ ...current, value }))}
          onCancel={() => setCropDraft(null)}
          onSave={saveCrop}
        />
      )}
    </main>
  );
}
