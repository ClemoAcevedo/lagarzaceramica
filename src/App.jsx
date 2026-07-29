import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import About from './pages/About/About.jsx';
import Home from './pages/Home/Home.jsx';
import Products from './pages/Products/Products.jsx';
import Workshops from './pages/Workshops/Workshops.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="products" element={<Products />} />
        <Route path="workshops" element={<Workshops />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
