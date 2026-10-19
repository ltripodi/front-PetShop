import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import ItemCarrito from '../components/carrito/ItemCarrito';
import ResumenCarrito from '../components/carrito/ResumenCarrito';
import CarritoActions from '../components/carrito/CarritoActions';
import { getProductos } from '../services/productosService';
import useCarrito from '../hooks/useCarrito';

const fechaHora = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function renderAccionesPredeterminadas(props) {
  return <CarritoActions {...props} />;
}

// Los puntos de extensión reciben el carrito y las operaciones validadas del Context.
// No se expone un setter que permita omitir las reglas del servicio.
export default function Carrito({ renderAccionesItem = renderAccionesPredeterminadas, renderAccionesCarrito = renderAccionesPredeterminadas }) {
  const { carrito, cargando, error, reintentarCarga, ...operaciones } = useCarrito();
  // Una sola consulta por montaje para imágenes y datos de validación de stock.
  const [catalogo, setCatalogo] = useState({ productos: new Map(), cargando: true, error: null });

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
        if (!controller.signal.aborted) {
          setCatalogo({ productos: new Map(), cargando: false, error: errorCatalogo });
        }
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

      {!cargando && !error && items.length > 0 && catalogo.error && (
        <Alert severity="warning">
          No pudimos cargar el catálogo. La edición de cantidades no está disponible. Podés eliminar productos o vaciar el carrito.
        </Alert>
      )}

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
            {items.map((item) => {
              const producto = catalogo.productos.get(item.productoId);
              const imagen = producto?.imagenes?.find((actual) => actual?.principal) ?? producto?.imagenes?.[0];
              return (
                <ItemCarrito
                  key={item.id}
                  item={item}
                  imagen={imagen?.ubicacion}
                  acciones={renderAccionesItem?.({ item, carrito, producto, cargandoCatalogo: catalogo.cargando, ...operaciones })}
                />
              );
            })}
          </Stack>
          <ResumenCarrito carrito={carrito} acciones={renderAccionesCarrito?.({ carrito, ...operaciones })} />
        </Box>
      )}
    </Stack>
  );
}
