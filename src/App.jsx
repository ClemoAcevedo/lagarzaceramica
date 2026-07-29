import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import About from './pages/About/About.jsx';
import Home from './pages/Home/Home.jsx';
import ProductDetail from './pages/ProductDetail/ProductDetail.jsx';
import Products from './pages/Products/Products.jsx';
import Workshops from './pages/Workshops/Workshops.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sobre-la-garza" element={<About />} />
        <Route path="piezas" element={<Products />} />
        <Route path="piezas/:slug" element={<ProductDetail />} />
        <Route path="talleres" element={<Workshops />} />
        <Route path="about" element={<Navigate to="/sobre-la-garza" replace />} />
        <Route path="products" element={<Navigate to="/piezas" replace />} />
        <Route path="workshops" element={<Navigate to="/talleres" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
