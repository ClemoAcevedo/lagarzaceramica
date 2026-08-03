import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import About from './pages/About/About.jsx';
import Home from './pages/Home/Home.jsx';
import ProductDetail from './pages/ProductDetail/ProductDetail.jsx';
import Products from './pages/Products/Products.jsx';
import Workshops from './pages/Workshops/Workshops.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import AdminGuard from './admin/AdminGuard.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Login from './admin/Login.jsx';
import AdminProducts from './admin/Products.jsx';
import ProductForm from './admin/ProductForm.jsx';
import Categories from './admin/Categories.jsx';
import HomeSelection from './admin/HomeSelection.jsx';

export default function App() {
  return (
    <Routes>
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
      <Route element={<Layout />}>
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
    </Routes>
  );
}
