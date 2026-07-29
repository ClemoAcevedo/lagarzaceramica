import { Link } from 'react-router-dom';
import { footerMark } from '../../assets/media.js';
import { contactUrl, instagramUrl } from '../../utils/links.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <img className="footer-mark" src={footerMark} alt="" aria-hidden="true" />
      <div className="footer-main">
        <p>Objetos de gres hechos<br />en Valdivia, Chile.</p>
        <nav aria-label="Navegación del pie">
          <Link to="/about">Sobre La Garza</Link>
          <Link to="/products">Piezas</Link>
          <Link to="/workshops">Talleres</Link>
        </nav>
        <div>
          <a href={instagramUrl} target="_blank" rel="noopener">Instagram ↗</a>
          <a href={contactUrl} target="_blank" rel="noopener">WhatsApp ↗</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} La Garza</span>
        <span>Taller de Lola · Valdivia</span>
      </div>
    </footer>
  );
}
