import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { headerLogo } from '../../assets/media.js';
import { contactUrl, homeContactUrl } from '../../utils/links.js';

const navigation = [
  { to: '/', label: 'Inicio' },
  { to: '/sobre-la-garza', label: 'Sobre La Garza' },
  { to: '/piezas', label: 'Piezas' },
  { to: '/talleres', label: 'Talleres' },
];

export default function Header({ overlay = false }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    const main = document.querySelector('main');
    if (menuOpen) main?.setAttribute('inert', '');
    else main?.removeAttribute('inert');
    return () => {
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', closeOnEscape);
      main?.removeAttribute('inert');
    };
  }, [menuOpen]);

  const headerClasses = [
    'site-header',
    overlay && 'site-header--overlay',
    scrolled && 'is-scrolled',
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClasses} data-header>
      <Link className="brand" to="/" aria-label="La Garza, inicio">
        <img src={headerLogo} alt={overlay ? 'La Garza, Valdivia Chile' : 'La Garza'} />
      </Link>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        aria-controls="menu-principal"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span>{menuOpen ? 'Cerrar' : 'Menú'}</span><i />
      </button>
      <nav
        className={`main-nav${menuOpen ? ' is-open' : ''}`}
        id="menu-principal"
        aria-label="Navegación principal"
      >
        {navigation.map(({ to, label }) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
        <a
          className="nav-contact"
          href={overlay ? homeContactUrl : contactUrl}
          target="_blank"
          rel="noopener"
        >
          Contacto
        </a>
      </nav>
    </header>
  );
}
