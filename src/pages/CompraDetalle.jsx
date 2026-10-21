import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import LineaCompra from '../components/compras/LineaCompra';
import ResumenCompra from '../components/compras/ResumenCompra';
import { getCompraPorId } from '../services/comprasService';
import { getProductos } from '../services/productosService';

const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export default function CompraDetalle() {
  const { id } = useParams();
  // La key reinicia el estado al pasar de una compra a otra.
  return <Detalle key={id} id={id} />;
}

function Detalle({ id }) {
  const [estado, setEstado] = useState({ compra: null, cargando: true, error: null });
  const [intento, setIntento] = useState(0);
  // El catálogo sólo aporta imágenes y precios actuales: si falla, el detalle se muestra igual.
  const [catalogo, setCatalogo] = useState(new Map());

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const compra = await getCompraPorId(id, { signal: controller.signal });
        if (!controller.signal.aborted) setEstado({ compra, cargando: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setEstado({ compra: null, cargando: false, error });
      }
    });
    return () => controller.abort();
  }, [id, intento]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const productos = await getProductos({ signal: controller.signal });
        if (!controller.signal.aborted) setCatalogo(new Map(productos.filter((producto) => producto?.id != null).map((producto) => [producto.id, producto])));
      } catch {
        // Sin catálogo se usan los datos de la compra y una imagen genérica.
      }
    });
    return () => controller.abort();
  }, []);

  const volver = <Button component={RouterLink} to="/compras" sx={{ alignSelf: 'flex-start' }}>← Mis compras</Button>;

  if (estado.cargando) {
    return (
      <Stack spacing={3}>
        {volver}
        <Box role="status" aria-label="Cargando detalle de compra" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      </Stack>
    );
  }

  if (estado.error?.name === 'CompraNoEncontradaError') {
    return (
      <Stack spacing={3}>
        {volver}
        <Stack spacing={1}>
          <Typography component="h1" variant="h2">Compra no encontrada</Typography>
          <Typography color="text.secondary">La compra que buscás no existe en tu historial.</Typography>
        </Stack>
      </Stack>
    );
  }

  if (estado.error) {
    return (
      <Stack spacing={3}>
        {volver}
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => { setEstado({ compra: null, cargando: true, error: null }); setIntento((actual) => actual + 1); }}>Reintentar</Button>}>
          No pudimos cargar el detalle de la compra. Revisá tu conexión e intentá de nuevo.
        </Alert>
      </Stack>
    );
  }

  const { compra } = estado;
  const fechaCompra = new Date(compra.realizadaEn);

  return (
    <Stack spacing={3}>
      <Box component="header">
        {volver}
        <Typography variant="overline" color="primary.main" component="p" sx={{ fontWeight: 700, mt: 1 }}>Detalle de compra</Typography>
        <Typography component="h1" variant="h2">Compra #{compra.id}</Typography>
        <Typography color="text.secondary" component="time" dateTime={compra.realizadaEn} sx={{ display: 'block', mt: 1 }}>
          {Number.isNaN(fechaCompra.getTime()) ? 'Fecha no disponible' : fecha.format(fechaCompra)}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
        <Paper component="section" aria-label="Productos de la compra" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1, borderColor: 'divider' }}>
          <Typography component="h2" variant="h5" sx={{ mb: 2 }}>Productos</Typography>
          {compra.lineas.length === 0 ? <Typography color="text.secondary">Esta compra no tiene productos.</Typography> : (
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {compra.lineas.map((linea) => <LineaCompra key={linea.id} linea={linea} producto={catalogo.get(linea.productoId)} />)}
            </Box>
          )}
        </Paper>

        <ResumenCompra items={compra.lineas} total={compra.total} nota="Los precios son los registrados al momento de la compra.">
          <Button component={RouterLink} to="/productos" variant="contained" fullWidth>Seguir comprando</Button>
        </ResumenCompra>
      </Box>
    </Stack>
  );
}
