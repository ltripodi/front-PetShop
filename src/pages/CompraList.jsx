import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CompraCard from '../components/compras/CompraCard';
import CompraFiltros from '../components/compras/CompraFiltros';
import { getCompras } from '../services/comprasService';

// El frontend todavía no implementa el ingreso: el historial corresponde al usuario
// de los mocks locales, el mismo de carrito.json (GET /api/compras?usuarioId=1).
const USUARIO_ID = 1;

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const FILTROS_INICIALES = { busqueda: '', mes: '', orden: 'recientes' };

const porFecha = (primera, segunda) => Date.parse(primera.realizadaEn) - Date.parse(segunda.realizadaEn) || primera.id - segunda.id;

const ORDENES = {
  recientes: { etiqueta: 'Más recientes', comparar: (primera, segunda) => porFecha(segunda, primera) },
  antiguas: { etiqueta: 'Más antiguas', comparar: porFecha },
  'mayor-total': { etiqueta: 'Mayor total', comparar: (primera, segunda) => segunda.total - primera.total || porFecha(segunda, primera) },
  'menor-total': { etiqueta: 'Menor total', comparar: (primera, segunda) => primera.total - segunda.total || porFecha(segunda, primera) },
};

// "#3" o "3" buscan el número exacto de compra; cualquier texto busca en los productos.
function coincideBusqueda(compra, busqueda) {
  if (!busqueda) return true;
  const numero = busqueda.replace(/^#/, '');
  if (/^\d+$/.test(numero) && compra.id === Number(numero)) return true;
  return compra.lineas.some(({ productoNombre }) => productoNombre.toLocaleLowerCase('es').includes(busqueda));
}

export default function CompraList() {
  const [estado, setEstado] = useState({ compras: [], cargando: true, error: null });
  const [intento, setIntento] = useState(0);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      try {
        const compras = await getCompras({ usuarioId: USUARIO_ID, signal: controller.signal });
        if (!controller.signal.aborted) setEstado({ compras, cargando: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setEstado({ compras: [], cargando: false, error });
      }
    });
    return () => controller.abort();
  }, [intento]);

  const busqueda = filtros.busqueda.trim().toLocaleLowerCase('es');
  const comprasFiltradas = estado.compras
    .filter((compra) => coincideBusqueda(compra, busqueda) && (!filtros.mes || compra.realizadaEn.startsWith(filtros.mes)))
    .sort(ORDENES[filtros.orden].comparar);
  const totalFiltrado = comprasFiltradas.reduce((total, compra) => total + Math.round(compra.total * 100), 0) / 100;

  function actualizarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }));
  }

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
        <>
          <CompraFiltros
            compras={estado.compras}
            filtros={filtros}
            ordenes={ORDENES}
            filtrosIniciales={FILTROS_INICIALES}
            onChange={actualizarFiltro}
            onClear={() => setFiltros(FILTROS_INICIALES)}
          />
          <Box component="section" aria-label="Compras">
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'baseline' }} justifyContent="space-between" spacing={0.5} sx={{ mb: 2.5 }}>
              <Typography component="h2" variant="h5">Historial</Typography>
              <Typography variant="body2" color="text.secondary" role="status">
                {comprasFiltradas.length} de {estado.compras.length} compras · Total {pesos.format(totalFiltrado)}
              </Typography>
            </Stack>
            {comprasFiltradas.length > 0 ? (
              <Stack component="ul" spacing={2} aria-label="Historial de compras" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {comprasFiltradas.map((compra) => <Box component="li" key={compra.id}><CompraCard compra={compra} /></Box>)}
              </Stack>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography component="h3" variant="h6">No encontramos compras</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>Probá con otro número, producto o mes.</Typography>
                <Button onClick={() => setFiltros(FILTROS_INICIALES)} sx={{ mt: 1 }}>Limpiar filtros</Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
