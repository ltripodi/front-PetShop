import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import ItemCarrito from '../components/carrito/ItemCarrito';
import ResumenCarrito from '../components/carrito/ResumenCarrito';
import { getProductos } from '../services/productosService';

const fechaHora = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Simula GET /api/carrito/{usuarioId}: public/data/carrito.json tiene la forma de CarritoResponse.
async function getCarrito({ signal } = {}) {
  const response = await fetch('/data/carrito.json', { signal });

  if (!response.ok) {
    throw new Error('No se pudo cargar el carrito.');
  }

  const carrito = await response.json();
  if (!carrito || !Array.isArray(carrito.items)) {
    throw new TypeError('El carrito local debe tener una lista de ítems.');
  }

  return carrito;
}

// CarritoResponse no trae imágenes: se toman del catálogo por productoId.
// Si el catálogo falla, el carrito se muestra igual con el ícono de reemplazo.
async function getImagenesPorProducto({ signal }) {
  try {
    const productos = await getProductos({ signal });
    return new Map(productos.map((producto) => {
      const imagen = producto?.imagenes?.find((item) => item?.principal) ?? producto?.imagenes?.[0];
      return [producto?.id, imagen?.ubicacion];
    }));
  } catch {
    return new Map();
  }
}

// Fede puede pasar renderAccionesItem({ item, carrito, actualizarCarrito }) y
// renderAccionesCarrito({ carrito, actualizarCarrito }). Como todas las operaciones del
// backend devuelven el CarritoResponse completo, alcanza con llamar a actualizarCarrito con esa respuesta.
export default function Carrito({ renderAccionesItem, renderAccionesCarrito }) {
  const [carrito, setCarrito] = useState(null);
  const [imagenes, setImagenes] = useState(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(false);

    Promise.all([getCarrito({ signal: controller.signal }), getImagenesPorProducto({ signal: controller.signal })])
      .then(([carritoCargado, imagenesCargadas]) => {
        if (!controller.signal.aborted) {
          setCarrito(carritoCargado);
          setImagenes(imagenesCargadas);
        }
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });

    return () => controller.abort();
  }, [reintento]);

  const items = carrito?.items ?? [];
  const actualizadoEn = carrito?.actualizadoEn ? new Date(carrito.actualizadoEn) : null;
  const fechaValida = actualizadoEn && !Number.isNaN(actualizadoEn.getTime());

  return (
    <Stack spacing={3}>
      <Box component="header">
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Carrito</Typography>
        <Typography component="h1" variant="h2">Tu carrito</Typography>
        {!cargando && !error && items.length > 0 && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Revisá los productos antes de finalizar la compra.
            {fechaValida && ` Última actualización: ${fechaHora.format(actualizadoEn)}.`}
          </Typography>
        )}
      </Box>

      {cargando ? (
        <Box role="status" aria-label="Cargando carrito" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setReintento((valor) => valor + 1)}>Reintentar</Button>}>
          No pudimos cargar el carrito. Revisá tu conexión e intentá de nuevo.
        </Alert>
      ) : items.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', py: { xs: 6, md: 8 }, px: 3, textAlign: 'center' }}>
          <PawIcon aria-hidden="true" color="primary" sx={{ fontSize: 64, opacity: 0.7 }} />
          <Typography component="h2" variant="h5" sx={{ mt: 2 }}>Tu carrito está vacío</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Cuando agregues productos del catálogo, los vas a ver acá.</Typography>
          <Button component={RouterLink} to="/productos" variant="contained" sx={{ mt: 3 }}>Ver productos</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
          <Stack component="ul" spacing={2} aria-label="Productos en el carrito" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {items.map((item) => (
              <ItemCarrito
                key={item.id}
                item={item}
                imagen={imagenes.get(item.productoId)}
                acciones={renderAccionesItem?.({ item, carrito, actualizarCarrito: setCarrito })}
              />
            ))}
          </Stack>
          <ResumenCarrito carrito={carrito} acciones={renderAccionesCarrito?.({ carrito, actualizarCarrito: setCarrito })} />
        </Box>
      )}
    </Stack>
  );
}
