import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CompraCard from '../components/compras/CompraCard';
import { getCompras } from '../services/comprasService';

export default function CompraList() {
  const [estado, setEstado] = useState({ compras: [], cargando: true, error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const compras = await getCompras({ signal: controller.signal });
        if (!controller.signal.aborted) setEstado({ compras, cargando: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setEstado({ compras: [], cargando: false, error });
      }
    });
    return () => controller.abort();
  }, [intento]);

  return (
    <Stack spacing={3}>
      <Box component="header">
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Tu cuenta</Typography>
        <Typography component="h1" variant="h2">Mis compras</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Consultá tus compras y revisá el detalle de cada pedido.</Typography>
      </Box>
      {estado.cargando ? (
        <Box role="status" aria-label="Cargando compras" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : estado.error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => { setEstado((actual) => ({ ...actual, cargando: true })); setIntento((actual) => actual + 1); }}>Reintentar</Button>}>
          No pudimos cargar las compras. Revisá tu conexión e intentá de nuevo.
        </Alert>
      ) : estado.compras.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', py: { xs: 6, md: 8 }, px: 3, textAlign: 'center' }}>
          <Typography component="h2" variant="h5">Todavía no tenés compras</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Cuando completes una compra, vas a encontrarla acá.</Typography>
          <Button component={RouterLink} to="/productos" variant="contained" sx={{ mt: 3 }}>Explorar productos</Button>
        </Box>
      ) : (
        <Stack component="ul" spacing={2} aria-label="Historial de compras" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {estado.compras.map((compra) => <CompraCard key={compra.id} compra={compra} />)}
        </Stack>
      )}
    </Stack>
  );
}
