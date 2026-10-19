import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import ItemCarrito from '../components/carrito/ItemCarrito';
import ResumenCarrito from '../components/carrito/ResumenCarrito';
import { getProductos } from '../services/productosService';
import useCarrito from '../hooks/useCarrito';

const fechaHora = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

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

// Los puntos de extensión reciben el carrito y las operaciones validadas del Context.
// No se expone un setter que permita omitir las reglas del servicio.
export default function Carrito({ renderAccionesItem, renderAccionesCarrito }) {
  const { carrito, cargando, error, reintentarCarga, ...operaciones } = useCarrito();
  const [imagenes, setImagenes] = useState(new Map());

  useEffect(() => {
    const controller = new AbortController();
    getImagenesPorProducto({ signal: controller.signal })
      .then((imagenesCargadas) => {
        if (!controller.signal.aborted) {
          setImagenes(imagenesCargadas);
        }
      });

    return () => controller.abort();
  }, []);

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
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={reintentarCarga}>Reintentar</Button>}>
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
                acciones={renderAccionesItem?.({ item, carrito, ...operaciones })}
              />
            ))}
          </Stack>
          <ResumenCarrito carrito={carrito} acciones={renderAccionesCarrito?.({ carrito, ...operaciones })} />
        </Box>
      )}
    </Stack>
  );
}
