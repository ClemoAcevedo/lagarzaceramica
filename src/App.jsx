import { lazy, Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';

const About = lazy(() => import('./pages/About/About.jsx'));
const Home = lazy(() => import('./pages/Home/Home.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail.jsx'));
const Products = lazy(() => import('./pages/Products/Products.jsx'));
const Workshops = lazy(() => import('./pages/Workshops/Workshops.jsx'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound.jsx'));
const AdminGuard = lazy(() => import('./admin/AdminGuard.jsx'));
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const Login = lazy(() => import('./admin/Login.jsx'));
const AdminProducts = lazy(() => import('./admin/Products.jsx'));
const ProductForm = lazy(() => import('./admin/ProductForm.jsx'));
const Categories = lazy(() => import('./admin/Categories.jsx'));
const HomeSelection = lazy(() => import('./admin/HomeSelection.jsx'));

function PublicLayout() {
  return <CatalogProvider><Layout /></CatalogProvider>;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="admin/login" element={<Login />} />
      <Route element={<AdminGuard />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="piezas" replace />} />
          <Route path="piezas" element={<AdminProducts />} />
          <Route path="piezas/nueva" element={<ProductForm />} />
          <Route path="piezas/:id" element={<ProductForm />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="inicio" element={<HomeSelection />} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="sobre-la-garza" element={<About />} />
        <Route path="piezas" element={<Products />} />
        <Route path="piezas/nidos" element={<Navigate to="/piezas/testas-de-erizos" replace />} />
        <Route path="piezas/familia-azul-rio" element={<Navigate to="/piezas/vajilla-rio" replace />} />
        <Route path="piezas/fuente-orilla" element={<Navigate to="/piezas/frutero-orilla" replace />} />
        <Route path="piezas/vasos-bosque" element={<Navigate to="/piezas/vasos-sour" replace />} />
        <Route path="piezas/:slug" element={<ProductDetail />} />
      <Route path="talleres" element={<Workshops />} />
      <Route path="about" element={<Navigate to="/sobre-la-garza" replace />} />
        <Route path="products" element={<Navigate to="/piezas" replace />} />
        <Route path="workshops" element={<Navigate to="/talleres" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>,
  ),
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return (
    <Suspense fallback={<main className="route-loading" aria-busy="true"><span>Cargando…</span></main>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
