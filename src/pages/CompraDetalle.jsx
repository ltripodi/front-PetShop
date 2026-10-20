import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getCompraPorId } from '../services/comprasService';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CompraDetalle() {
  const { id } = useParams();
  const [estado, setEstado] = useState({ compra: null, cargando: true, error: null });

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
  }, [id]);

  if (estado.cargando) return <Box role="status" aria-label="Cargando detalle de compra" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (estado.error) {
    const noEncontrada = estado.error.name === 'CompraNoEncontradaError';
    return <Stack spacing={2} alignItems="flex-start"><Alert severity={noEncontrada ? 'info' : 'error'}>{noEncontrada ? 'No encontramos esa compra.' : 'No pudimos cargar el detalle de la compra. Revisá tu conexión e intentá de nuevo.'}</Alert><Button component={RouterLink} to="/compras" variant="outlined">Volver a mis compras</Button></Stack>;
  }

  const { compra } = estado;
  const fechaCompra = new Date(compra.realizadaEn);
  return (
    <Stack spacing={3}>
      <Box component="header">
        <Button component={RouterLink} to="/compras" variant="text" sx={{ px: 0, mb: 1 }}>← Mis compras</Button>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Detalle de compra</Typography>
        <Typography component="h1" variant="h2">Compra #{compra.id}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{Number.isNaN(fechaCompra.getTime()) ? 'Fecha no disponible' : fecha.format(fechaCompra)}</Typography>
      </Box>
      <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography component="h2" variant="h5" sx={{ mb: 2 }}>Productos</Typography>
        {compra.lineas.length === 0 ? <Typography color="text.secondary">Esta compra no tiene productos.</Typography> : (
          <Stack component="ul" divider={<Box component="li" sx={{ listStyle: 'none', borderBottom: 1, borderColor: 'divider' }} />} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {compra.lineas.map((linea) => (
              <Stack component="li" key={linea.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5} sx={{ py: 2, '&:first-of-type': { pt: 0 }, '&:last-of-type': { pb: 0 } }}>
                <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 700 }}>{linea.productoNombre}</Typography><Typography variant="body2" color="text.secondary">{linea.cantidad} × {pesos.format(linea.precioUnitario)}</Typography></Box>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pesos.format(linea.subtotal)}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Total</Typography><Typography variant="h6">{pesos.format(compra.total)}</Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
