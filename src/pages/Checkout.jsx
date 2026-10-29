import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import ItemCarrito from '../components/carrito/ItemCarrito';
import ResumenCompra from '../components/compras/ResumenCompra';
import { checkout } from '../services/comprasService';
import { getProductos } from '../services/productosService';
import { cargarCarrito, selectCargandoCarrito, selectCarrito, selectErrorCarrito, vaciarCarrito as vaciarCarritoAction } from '../store/carritoSlice';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// Errores de negocio de checkout() (mismas reglas que CompraService): su mensaje se muestra tal cual.
const ERRORES_DE_NEGOCIO = new Set(['CarritoVacioError', 'RecursoNoEncontradoError', 'ProductoNoDisponibleError', 'StockInsuficienteError', 'DatosInvalidosError']);

const centavos = (importe) => Math.round(importe * 100);

// Anticipa en pantalla las validaciones que hace el backend al confirmar.
function problemaDe(item, producto) {
  if (!producto) return 'Este producto ya no está en el catálogo.';
  if (producto.disponible !== true) return 'Este producto no está disponible.';
  const stock = Number.isSafeInteger(producto.stock) && producto.stock > 0 ? producto.stock : 0;
  if (stock === 0) return 'Este producto no tiene stock.';
  if (item.cantidad > stock) return `Stock insuficiente: ${stock === 1 ? 'queda 1 unidad' : `quedan ${stock} unidades`}.`;
  return null;
}

export default function Checkout() {
  const dispatch = useDispatch();
  const carrito = useSelector(selectCarrito);
  const cargando = useSelector(selectCargandoCarrito);
  const error = useSelector(selectErrorCarrito);
  const reintentarCarga = () => dispatch(cargarCarrito());
  const vaciarCarrito = () => dispatch(vaciarCarritoAction());
  const navigate = useNavigate();
  const [catalogo, setCatalogo] = useState({ productos: new Map(), cargando: true, error: null });
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [errorCompra, setErrorCompra] = useState(null);
  const operacionEnCurso = useRef(false);
  const montado = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // StrictMode descarta el primer efecto antes de iniciar una consulta útil.
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const productos = await getProductos({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setCatalogo({ productos: new Map(productos.filter((producto) => producto?.id != null).map((producto) => [producto.id, producto])), cargando: false, error: null });
        }
      } catch (errorCatalogo) {
        if (!controller.signal.aborted) setCatalogo({ productos: new Map(), cargando: false, error: errorCatalogo });
      }
    });
    return () => controller.abort();
  }, [intentoCatalogo]);

  const items = carrito?.items ?? [];
  const verificado = !catalogo.cargando && !catalogo.error;
  const revision = items.map((item) => {
    const producto = catalogo.productos.get(item.productoId);
    const precioActual = typeof producto?.precio === 'number' && Number.isFinite(producto.precio) ? producto.precio : null;
    return {
      item,
      producto,
      problema: verificado ? problemaDe(item, producto) : null,
      precioActual: precioActual !== null && centavos(precioActual) !== centavos(item.precioUnitario) ? precioActual : null,
    };
  });
  const hayProblemas = revision.some(({ problema }) => problema);
  const hayPreciosNuevos = revision.some(({ precioActual }) => precioActual !== null);
  // El backend registra la compra con el precio vigente: el total a pagar puede diferir del carrito.
  const totalAPagar = verificado && !hayProblemas
    ? revision.reduce((total, { item, precioActual }) => total + centavos(precioActual ?? item.precioUnitario) * item.cantidad, 0) / 100
    : carrito?.total;
  const puedeConfirmar = verificado && !hayProblemas && items.length > 0 && !confirmando;

  function recargarCatalogo() {
    setCatalogo((actual) => ({ ...actual, cargando: true, error: null }));
    setIntentoCatalogo((actual) => actual + 1);
  }

  async function confirmarCompra() {
    if (operacionEnCurso.current || !puedeConfirmar) return;
    operacionEnCurso.current = true;
    setConfirmando(true);
    setErrorCompra(null);
    try {
      const compra = await checkout(carrito);
      // Igual que el backend: una compra confirmada deja el carrito vacío.
      try {
        vaciarCarrito();
      } catch {
        // La compra ya quedó registrada; el carrito no bloquea el resultado.
      }
      if (montado.current) navigate(`/checkout/confirmada/${compra.id}`, { replace: true, state: { compra } });
    } catch (errorCheckout) {
      if (!montado.current) return;
      if (ERRORES_DE_NEGOCIO.has(errorCheckout?.name)) {
        setErrorCompra(`${errorCheckout.message} No se registró la compra.`);
        // El stock pudo cambiar: se vuelve a consultar para marcar los productos afectados.
        recargarCatalogo();
      } else {
        setErrorCompra('No pudimos confirmar la compra. Revisá tu conexión e intentá de nuevo.');
      }
    } finally {
      operacionEnCurso.current = false;
      if (montado.current) setConfirmando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box component="header">
        <Button component={RouterLink} to="/carrito" sx={{ mb: 1 }}>← Volver al carrito</Button>
        <Typography variant="overline" color="primary.main" component="p" sx={{ fontWeight: 700 }}>Finalizar compra</Typography>
        <Typography component="h1" variant="h2">Revisá tu compra</Typography>
        {!cargando && !error && items.length > 0 && (
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
            Confirmá los productos y el total. La compra se registra con el precio y el stock vigentes.
          </Typography>
        )}
      </Box>

      {cargando ? (
        <Box role="status" aria-label="Cargando carrito" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={reintentarCarga}>Reintentar</Button>}>
          No pudimos cargar el carrito. Revisá tu conexión e intentá de nuevo.
        </Alert>
      ) : items.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', py: { xs: 6, md: 8 }, px: 3, textAlign: 'center' }}>
          <PawIcon aria-hidden="true" color="primary" sx={{ fontSize: 64, opacity: 0.7 }} />
          <Typography component="h2" variant="h5" sx={{ mt: 2 }}>No hay productos para comprar</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Agregá productos al carrito para finalizar una compra.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            <Button component={RouterLink} to="/productos" variant="contained">Ver productos</Button>
            <Button component={RouterLink} to="/compras" variant="outlined">Ver mis compras</Button>
          </Stack>
        </Box>
      ) : (
        <>
          {catalogo.error && (
            <Alert severity="warning" action={<Button color="inherit" size="small" onClick={recargarCatalogo}>Reintentar</Button>}>
              No pudimos verificar el stock de los productos. Reintentá para poder confirmar la compra.
            </Alert>
          )}
          {hayProblemas && (
            <Alert severity="warning" action={<Button component={RouterLink} to="/carrito" color="inherit" size="small">Ir al carrito</Button>}>
              Hay productos que no se pueden comprar con la cantidad elegida. Modificalos en el carrito para continuar.
            </Alert>
          )}
          {verificado && hayPreciosNuevos && (
            <Alert severity="info">Cambió el precio de algunos productos desde que los agregaste. El total ya incluye los precios vigentes.</Alert>
          )}
          {errorCompra && <Alert severity="error">{errorCompra}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
            <Stack component="ul" spacing={2} aria-label="Productos a comprar" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {revision.map(({ item, producto, problema, precioActual }) => {
                const imagen = producto?.imagenes?.find((actual) => actual?.principal) ?? producto?.imagenes?.[0];
                return (
                  <ItemCarrito
                    key={item.id}
                    item={item}
                    imagen={imagen?.ubicacion}
                    acciones={(problema || precioActual !== null) && (
                      <Typography variant="body2" color={problema ? 'error.main' : 'text.secondary'} sx={{ fontWeight: problema ? 700 : 400 }}>
                        {problema ?? `Precio vigente: ${pesos.format(precioActual)} c/u.`}
                      </Typography>
                    )}
                  />
                );
              })}
            </Stack>

            <ResumenCompra
              items={items}
              total={totalAPagar}
              titulo="Tu compra"
              nota={catalogo.cargando ? 'Verificando stock y precios…' : null}
            >
              <Button variant="contained" size="large" fullWidth disabled={!puedeConfirmar} onClick={confirmarCompra} aria-busy={confirmando}>
                {confirmando ? 'Confirmando…' : 'Confirmar compra'}
              </Button>
              <Button component={RouterLink} to="/carrito" fullWidth>Modificar carrito</Button>
            </ResumenCompra>
          </Box>
        </>
      )}
    </Stack>
  );
}
