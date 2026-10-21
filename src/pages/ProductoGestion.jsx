import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import AjusteStockDialog from '../components/gestion/AjusteStockDialog';
import ConfirmarEliminarDialog from '../components/gestion/ConfirmarEliminarDialog';
import {
  USUARIO_ACTUAL_ID,
  actualizarStock,
  eliminarProducto,
  getProductosPropios,
} from '../services/gestionProductosService';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

function FilaProducto({ producto, onAjustarStock, onEliminar }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  const imagen = producto.imagenes?.find(({ principal }) => principal) ?? producto.imagenes?.[0];
  const detalle = [producto.categoria?.nombre, producto.marca?.nombre, producto.especies?.map(({ nombre }) => nombre).join(' · ')].filter(Boolean).join(' · ');

  return (
    <Card component="li" variant="outlined" sx={{ listStyle: 'none', borderRadius: 1, borderColor: 'divider', p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1, bgcolor: 'primary.light', overflow: 'hidden', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
            {imagen && !imagenFallida ? (
              <Box
                component="img"
                src={imagen.ubicacion}
                alt=""
                onError={() => setImagenFallida(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PawIcon sx={{ fontSize: 36, opacity: 0.7 }} />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}>{producto.nombre}</Typography>
            <Typography variant="body2" color="text.secondary">{detalle}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
              <Typography sx={{ fontWeight: 700 }}>{pesos.format(producto.precio)}</Typography>
              <Chip
                size="small"
                label={`Stock: ${producto.stock}`}
                color={producto.stock === 0 ? 'warning' : 'default'}
                variant={producto.stock === 0 ? 'filled' : 'outlined'}
              />
              <Chip
                size="small"
                label={producto.disponible ? 'Disponible' : 'No disponible'}
                color={producto.disponible ? 'success' : 'default'}
                variant={producto.disponible ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button component={RouterLink} to={`/gestion-productos/${producto.id}/editar`} variant="outlined" size="small" aria-label={`Editar ${producto.nombre}`}>
            Editar
          </Button>
          <Button onClick={() => onAjustarStock(producto)} variant="outlined" size="small" aria-label={`Ajustar stock de ${producto.nombre}`}>
            Ajustar stock
          </Button>
          <Button
            onClick={() => onEliminar(producto)}
            variant="outlined"
            color="error"
            size="small"
            disabled={!producto.disponible}
            aria-label={`Eliminar ${producto.nombre}`}
          >
            Eliminar
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function ProductoGestion() {
  const location = useLocation();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState(location.state?.mensaje ?? null);
  const [dialogo, setDialogo] = useState(null);

  // El formulario avisa el resultado por el estado de la navegación; se limpia para que no reaparezca al recargar.
  useEffect(() => {
    if (location.state?.mensaje) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(false);
    getProductosPropios({ signal: controller.signal })
      .then(setProductos)
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [reintento]);

  const termino = busqueda.trim().toLocaleLowerCase('es');
  const visibles = productos.filter(({ nombre }) => !termino || nombre.toLocaleLowerCase('es').includes(termino));

  function reemplazar(actualizado) {
    setProductos((actuales) => actuales.map((producto) => (producto.id === actualizado.id ? actualizado : producto)));
  }

  async function confirmarStock(pedido) {
    const actualizado = await actualizarStock(dialogo.producto.id, pedido, USUARIO_ACTUAL_ID);
    reemplazar(actualizado);
    setMensaje({ severity: 'success', texto: `Stock de «${actualizado.nombre}» actualizado: ${actualizado.stock} unidades.` });
    setDialogo(null);
  }

  async function confirmarEliminacion() {
    const { producto } = dialogo;
    await eliminarProducto(producto.id, USUARIO_ACTUAL_ID);
    reemplazar({ ...producto, disponible: false });
    setMensaje({ severity: 'success', texto: `Producto «${producto.nombre}» eliminado. Ya no está disponible en el catálogo.` });
    setDialogo(null);
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2}>
        <Box component="header">
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Mis publicaciones</Typography>
          <Typography component="h1" variant="h2">Gestión de productos</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
            Publicá productos, editá sus datos, ajustá el stock o quitalos del catálogo.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/gestion-productos/nuevo" variant="contained">Nuevo producto</Button>
      </Stack>

      {mensaje && (
        <Alert severity={mensaje.severity} onClose={() => setMensaje(null)} role="status">{mensaje.texto}</Alert>
      )}

      <Box component="section" aria-label="Productos publicados">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2.5 }}>
          <TextField
            size="small"
            type="search"
            label="Buscar en mis productos"
            placeholder="Nombre del producto"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
          {!cargando && !error && (
            <Typography variant="body2" color="text.secondary" role="status">
              {visibles.length} de {productos.length} productos
            </Typography>
          )}
        </Stack>

        {cargando && (
          <Box role="status" aria-label="Cargando productos" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => setReintento((clave) => clave + 1)}>Reintentar</Button>}
          >
            No pudimos cargar tus productos. Revisá tu conexión e intentá de nuevo.
          </Alert>
        )}

        {!cargando && !error && visibles.length > 0 && (
          <Stack component="ul" spacing={2} sx={{ p: 0, m: 0 }} aria-label="Lista de productos">
            {visibles.map((producto) => (
              <FilaProducto
                key={producto.id}
                producto={producto}
                onAjustarStock={(elegido) => setDialogo({ tipo: 'stock', producto: elegido })}
                onEliminar={(elegido) => setDialogo({ tipo: 'eliminar', producto: elegido })}
              />
            ))}
          </Stack>
        )}

        {!cargando && !error && visibles.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography component="h2" variant="h6">
              {productos.length === 0 ? 'Todavía no publicaste productos' : 'No encontramos productos'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {productos.length === 0 ? 'Creá tu primer producto para verlo acá.' : 'Probá con otro nombre.'}
            </Typography>
            {productos.length === 0
              ? <Button component={RouterLink} to="/gestion-productos/nuevo" sx={{ mt: 1 }}>Nuevo producto</Button>
              : <Button onClick={() => setBusqueda('')} sx={{ mt: 1 }}>Limpiar búsqueda</Button>}
          </Box>
        )}
      </Box>

      {dialogo?.tipo === 'stock' && (
        <AjusteStockDialog producto={dialogo.producto} onClose={() => setDialogo(null)} onConfirmar={confirmarStock} />
      )}
      {dialogo?.tipo === 'eliminar' && (
        <ConfirmarEliminarDialog producto={dialogo.producto} onClose={() => setDialogo(null)} onConfirmar={confirmarEliminacion} />
      )}
    </Stack>
  );
}
