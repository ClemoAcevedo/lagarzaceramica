import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer/Footer.jsx';
import Header from './Header/Header.jsx';
import useRouteEffects from '../hooks/useRouteEffects.js';

export default function Layout() {
  const { pathname } = useLocation();
  useRouteEffects();

  return (
    <>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Header overlay={pathname === '/'} />
      <Outlet />
      <Footer />
    </>
  );
}
