import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import SelectorCantidad from '../components/products/SelectorCantidad';
import { getProductos } from '../services/productosService';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// Fede puede pasar onAgregarAlCarrito({ producto, cantidad }).
// Debe resolver con { agregado: true } únicamente después de completar la operación.
export default function ProductoDetalle({ onAgregarAlCarrito }) {
  const { id } = useParams();
  return <Detalle key={id} id={id} onAgregarAlCarrito={onAgregarAlCarrito} />;
}

function Detalle({ id, onAgregarAlCarrito }) {
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [imagenFallida, setImagenFallida] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const operacionEnCurso = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(false);
    getProductos({ signal: controller.signal })
      .then((productos) => {
        if (!controller.signal.aborted) {
          setProducto(productos.find((item) => item && String(item.id) === id) ?? null);
          setCantidad(1);
          setImagenFallida(false);
          setMensaje(null);
        }
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [id, reintento]);

  const stockValido = Number.isSafeInteger(producto?.stock) && producto.stock >= 0;
  const stock = stockValido ? producto.stock : 0;
  const precioValido = typeof producto?.precio === 'number' && Number.isFinite(producto.precio) && producto.precio >= 0;
  const disponible = producto?.disponible === true && stock > 0;
  const cantidadValida = Number.isSafeInteger(cantidad) && cantidad >= 1 && cantidad <= stock;
  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes.filter((imagen) => imagen?.ubicacion) : [];
  const imagen = imagenes.find((item) => item.principal) ?? imagenes[0];
  const especies = Array.isArray(producto?.especies) ? producto.especies.map((item) => item?.nombre).filter(Boolean).join(' · ') : '';

  async function agregarAlCarrito() {
    if (operacionEnCurso.current) return;
    if (!disponible || !precioValido || !cantidadValida) {
      setMensaje({ severity: 'error', texto: 'Revisá la disponibilidad y la cantidad seleccionada.' });
      return;
    }
    if (typeof onAgregarAlCarrito !== 'function') {
      setMensaje({ severity: 'info', texto: 'La función de carrito todavía no está habilitada. No se agregó ningún producto.' });
      return;
    }
    operacionEnCurso.current = true;
    setAgregando(true);
    setMensaje(null);
    try {
      const resultado = await onAgregarAlCarrito({ producto, cantidad });
      setMensaje(resultado?.agregado === true
        ? { severity: 'success', texto: 'Producto agregado al carrito.' }
        : { severity: 'warning', texto: 'El carrito no confirmó la operación. No podemos confirmar que se haya agregado el producto.' });
    } catch {
      setMensaje({ severity: 'error', texto: 'No se pudo completar la operación. Revisá el carrito antes de intentar nuevamente.' });
    } finally {
      operacionEnCurso.current = false;
      setAgregando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Button component={RouterLink} to="/productos" sx={{ alignSelf: 'flex-start' }}>← Volver al catálogo</Button>
      {cargando ? (
        <Box role="status" aria-label="Cargando producto" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" action={<Button color="inherit" onClick={() => setReintento((value) => value + 1)}>Reintentar</Button>}>No pudimos cargar el producto. Revisá tu conexión e intentá de nuevo.</Alert>
      ) : !producto ? (
        <Stack spacing={1}>
          <Typography component="h1" variant="h2">Producto no encontrado</Typography>
          <Typography color="text.secondary">El producto que buscás no existe en el catálogo.</Typography>
        </Stack>
      ) : (
        <Box component="article" sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 3, md: 5 } }}>
          <Box sx={{ aspectRatio: '1', bgcolor: 'primary.light', borderRadius: 1, overflow: 'hidden', alignSelf: 'start', display: 'grid', placeItems: 'center' }}>
            {imagen && !imagenFallida ? (
              <Box component="img" src={imagen.ubicacion} alt={producto.nombre || 'Imagen del producto'} onError={() => setImagenFallida(true)} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Stack alignItems="center" spacing={1} sx={{ p: 2, color: 'primary.main' }}>
                <PawIcon aria-hidden="true" sx={{ fontSize: 72 }} />
                <Typography>Imagen no disponible</Typography>
              </Stack>
            )}
          </Box>
          <Stack spacing={2.5} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <Box component="header">
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Detalle de producto</Typography>
              <Typography component="h1" variant="h2">{producto.nombre || 'Producto sin nombre'}</Typography>
            </Box>
            <Typography color="text.secondary">{producto.descripcion || 'Descripción no disponible.'}</Typography>
            <Stack spacing={0.5}>
              {producto.categoria?.nombre && <Typography variant="body2">Categoría: {producto.categoria.nombre}</Typography>}
              {producto.marca?.nombre && <Typography variant="body2">Marca: {producto.marca.nombre}</Typography>}
              {especies && <Typography variant="body2">Para: {especies}</Typography>}
            </Stack>
            <Typography variant="h4" component="p" color="primary.main">{precioValido ? pesos.format(producto.precio) : 'Precio no disponible'}</Typography>
            <Stack spacing={1} alignItems="flex-start">
              <Chip label={!stockValido ? 'Disponibilidad sin confirmar' : stock === 0 ? 'Sin stock' : disponible ? 'Disponible' : 'No disponible'} color={disponible ? 'success' : 'default'} variant="outlined" />
              <Typography variant="body2" color="text.secondary">{stockValido ? `Stock disponible: ${stock} ${stock === 1 ? 'unidad' : 'unidades'}` : 'Stock no informado.'}</Typography>
            </Stack>
            <Divider />
            <SelectorCantidad cantidad={cantidad} stock={stock} disabled={!disponible || !precioValido || agregando} onChange={(value) => { setCantidad(value); setMensaje(null); }} />
            <Typography aria-live="polite">Subtotal: {precioValido ? pesos.format(producto.precio * (disponible ? cantidad : 0)) : 'No disponible'}</Typography>
            <Button variant="contained" size="large" disabled={!disponible || !precioValido || !cantidadValida || agregando} onClick={agregarAlCarrito} aria-busy={agregando}>
              {agregando ? 'Agregando…' : 'Agregar al carrito'}
            </Button>
            {typeof onAgregarAlCarrito !== 'function' && <Typography variant="body2" color="text.secondary">La función de carrito estará disponible próximamente.</Typography>}
            {mensaje && <Alert severity={mensaje.severity}>{mensaje.texto}</Alert>}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
