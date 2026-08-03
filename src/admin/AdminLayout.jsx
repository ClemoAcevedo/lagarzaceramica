import { NavLink, Outlet } from 'react-router-dom';
import { headerLogo } from '../assets/media.js';
import { AdminCatalogProvider } from '../context/AdminCatalogContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/admin/piezas', label: 'Piezas' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/inicio', label: 'Selección de inicio' },
];

export default function AdminLayout() {
  const { session, signOut } = useAuth();

  return (
    <AdminCatalogProvider>
      <div className="admin-shell">
        <header className="admin-header">
          <NavLink className="admin-brand" to="/admin/piezas" aria-label="Panel de La Garza">
            <img src={headerLogo} alt="La Garza" />
            <span>Administración</span>
          </NavLink>
          <nav aria-label="Secciones de administración">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-account">
            <span>{session?.user.email}</span>
            <button type="button" onClick={signOut}>Cerrar sesión</button>
          </div>
        </header>
        <Outlet />
      </div>
    </AdminCatalogProvider>
  );
}
