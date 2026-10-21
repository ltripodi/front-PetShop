import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ComingSoonPage from './components/common/ComingSoonPage';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import CompraConfirmada from './pages/CompraConfirmada';
import CompraDetalle from './pages/CompraDetalle';
import CompraList from './pages/CompraList';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductoForm from './pages/ProductoForm';
import ProductoGestion from './pages/ProductoGestion';
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
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/confirmada/:id" element={<CompraConfirmada />} />
          <Route path="compras" element={<CompraList />} />
          <Route path="compras/:id" element={<CompraDetalle />} />
          <Route path="gestion-productos" element={<ProductoGestion />} />
          <Route path="gestion-productos/nuevo" element={<ProductoForm />} />
          <Route path="gestion-productos/:id/editar" element={<ProductoForm />} />
          <Route path="ui-kit" element={<UiKit />} />
          <Route path="*" element={<ComingSoonPage title="Página no encontrada" description="La página que buscás no existe." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
