import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Navigate, Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';
import LineaCompra from '../components/compras/LineaCompra';
import ResumenCompra from '../components/compras/ResumenCompra';
import { getProductos } from '../services/productosService';

const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Resultado del checkout. La compra (CompraResponse) llega en el estado de la navegación;
// si se entra por URL o se recarga, el detalle del historial se encarga de consultarla.
export default function CompraConfirmada() {
  const { id } = useParams();
  const compra = useLocation().state?.compra;

  if (!compra || String(compra.id) !== id) return <Navigate to={`/compras/${id}`} replace />;
  return <Confirmacion compra={compra} />;
}

function Confirmacion({ compra }) {
  // El catálogo sólo aporta imágenes: si falla, las líneas usan una imagen genérica.
  const [catalogo, setCatalogo] = useState(new Map());

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const productos = await getProductos({ signal: controller.signal });
        if (!controller.signal.aborted) setCatalogo(new Map(productos.filter((producto) => producto?.id != null).map((producto) => [producto.id, producto])));
      } catch {
        // Sin catálogo se muestran los datos de la compra.
      }
    });
    return () => controller.abort();
  }, []);

  const fechaCompra = new Date(compra.realizadaEn);

  return (
    <Stack spacing={3}>
      <Box component="header" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto minmax(0, 1fr)' }, gap: { xs: 2, sm: 3 }, alignItems: 'center' }}>
        <Box aria-hidden="true" sx={{ width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 }, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center' }}>
          <PawIcon sx={{ fontSize: { xs: 34, md: 42 } }} />
        </Box>
        <Box>
          <Typography variant="overline" color="primary.main" component="p" sx={{ fontWeight: 700 }}>Compra confirmada</Typography>
          <Typography component="h1" variant="h2">¡Gracias por tu compra!</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }} role="status">
            Registramos la compra #{compra.id}
            {!Number.isNaN(fechaCompra.getTime()) && <> el <Box component="time" dateTime={compra.realizadaEn}>{fecha.format(fechaCompra)}</Box></>}
            . Tu carrito quedó vacío.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
        <Paper component="section" aria-label="Productos de la compra" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1, borderColor: 'divider' }}>
          <Typography component="h2" variant="h5" sx={{ mb: 2 }}>Productos</Typography>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {compra.lineas.map((linea) => <LineaCompra key={linea.id} linea={linea} producto={catalogo.get(linea.productoId)} />)}
          </Box>
        </Paper>

        <ResumenCompra items={compra.lineas} total={compra.total} titulo={`Compra #${compra.id}`} nota="Podés consultarla cuando quieras desde Mis compras.">
          <Button component={RouterLink} to={`/compras/${compra.id}`} variant="contained" fullWidth>Ver detalle de la compra</Button>
          <Button component={RouterLink} to="/compras" variant="outlined" fullWidth>Ver mis compras</Button>
          <Button component={RouterLink} to="/productos" fullWidth>Seguir comprando</Button>
        </ResumenCompra>
      </Box>
    </Stack>
  );
}
