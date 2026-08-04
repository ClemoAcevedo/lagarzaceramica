import { useRef } from 'react';
import LoadingImage from '../components/LoadingImage/LoadingImage.jsx';
import { cropPositionAfterDrag, cropStyle } from '../lib/crop.js';
import AdminModal from './AdminModal.jsx';

export default function CropEditor({ image, value, aspect = 'cover', onChange, onCancel, onSave }) {
  const viewport = useRef(null);
  const drag = useRef(null);

  const beginDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      cropX: value.x,
      cropY: value.y,
    };
  };

  const moveImage = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId || !viewport.current) return;
    const bounds = viewport.current.getBoundingClientRect();
    const imageElement = viewport.current.querySelector('img');
    if (!imageElement?.naturalWidth || !imageElement.naturalHeight) return;
    const imageRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const coverWidth = Math.max(bounds.width, bounds.height * imageRatio);
    const coverHeight = coverWidth / imageRatio;
    onChange({
      ...value,
      x: cropPositionAfterDrag(drag.current.cropX, event.clientX - drag.current.clientX, bounds.width, coverWidth, value.zoom),
      y: cropPositionAfterDrag(drag.current.cropY, event.clientY - drag.current.clientY, bounds.height, coverHeight, value.zoom),
    });
  };

  const endDrag = (event) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  const imageStyle = cropStyle(value.x, value.y, value.zoom);

  return (
    <AdminModal className="admin-crop-modal" labelledBy="crop-title" onClose={onCancel}>
      <div className="admin-modal__card admin-crop-modal__card">
        <div className="admin-crop-modal__heading">
          <div>
            <p className="admin-kicker">{aspect === 'cover' ? 'Portada del catálogo' : aspect === 'home' ? 'Selección de Inicio' : 'Fotografía de la galería'}</p>
            <h2 id="crop-title">Reencuadrar fotografía</h2>
          </div>
          <button type="button" aria-label="Cerrar reencuadre" onClick={onCancel}>×</button>
        </div>
        <p className="admin-crop-modal__hint">Arrastra la fotografía para moverla. Al alejarla, el espacio libre se verá blanco.</p>
        <div
          className={`admin-crop-viewport admin-crop-viewport--${aspect}`}
          ref={viewport}
          onPointerDown={beginDrag}
          onPointerMove={moveImage}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <LoadingImage cropped src={image} alt="Vista previa del encuadre" draggable="false" style={imageStyle} />
          <span aria-hidden="true" />
        </div>
        <label className="admin-crop-zoom">
          <span><strong>Alejar / acercar</strong><output>{Math.round(value.zoom * 100)}%</output></span>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.01"
            value={value.zoom}
            onChange={(event) => onChange({ ...value, zoom: Number(event.target.value) })}
          />
        </label>
        <div className="admin-crop-modal__footer">
          <button className="admin-secondary" type="button" onClick={() => onChange({ x: 50, y: 50, zoom: 1 })}>Centrar y restablecer</button>
          <div>
            <button className="admin-secondary" type="button" onClick={onCancel}>Cancelar</button>
            <button className="admin-primary" type="button" onClick={onSave}>Usar este encuadre</button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
