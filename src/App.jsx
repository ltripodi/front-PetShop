import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ComingSoonPage from './components/common/ComingSoonPage';
import Carrito from './pages/Carrito';
import CompraDetalle from './pages/CompraDetalle';
import CompraList from './pages/CompraList';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductoDetalle from './pages/ProductoDetalle';
import UiKit from './pages/UiKit';
import useCarrito from './hooks/useCarrito';

export default function App() {
  const { agregarProducto } = useCarrito();
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="productos" element={<ProductList />} />
          <Route path="productos/:id" element={<ProductoDetalle onAgregarAlCarrito={agregarProducto} />} />
          <Route path="carrito" element={<Carrito />} />
          <Route path="checkout" element={<ComingSoonPage title="Finalización de compra" />} />
          <Route path="compras" element={<CompraList />} />
          <Route path="compras/:id" element={<CompraDetalle />} />
          <Route path="gestion-productos" element={<ComingSoonPage title="Gestión de productos" />} />
          <Route path="ui-kit" element={<UiKit />} />
          <Route path="*" element={<ComingSoonPage title="Página no encontrada" description="La página que buscás no existe." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
