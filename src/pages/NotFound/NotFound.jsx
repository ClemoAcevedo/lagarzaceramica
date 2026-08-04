import { ButtonLink } from '../../components/Links/Links.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function NotFound() {
  usePageMeta(
    'Página no encontrada — La Garza',
    'La página que buscas no existe o cambió de dirección.',
    { robots: 'noindex,nofollow' },
  );

  return (
    <main id="contenido" className="page-enter">
      <section className="not-found section">
        <p className="eyebrow">Error 404</p>
        <h1>Esta página no está aquí.</h1>
        <p>Puede que la dirección haya cambiado. Puedes volver al inicio y seguir recorriendo La Garza.</p>
        <ButtonLink to="/">Volver al inicio</ButtonLink>
      </section>
    </main>
  );
}
