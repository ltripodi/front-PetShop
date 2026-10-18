import { useState } from 'react';
import { Box, Card, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../common/Icons';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

function formatearMonto(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? pesos.format(valor) : 'No disponible';
}

// item tiene la forma de ItemCarritoResponse. La imagen no es parte de ese DTO: la pantalla la busca en el catálogo.
// acciones es opcional y se muestra debajo del ítem (por ejemplo, los controles de Fede).
export default function ItemCarrito({ item, imagen, acciones }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  const nombre = item.productoNombre || 'Producto sin nombre';
  const cantidadValida = Number.isSafeInteger(item.cantidad) && item.cantidad > 0;

  return (
    <Card component="li" variant="outlined" sx={{ borderRadius: 1, borderColor: 'divider', p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '72px minmax(0, 1fr)', sm: '96px minmax(0, 1fr) auto' }, gap: { xs: 2, sm: 2.5 }, alignItems: 'center' }}>
        <Box sx={{ aspectRatio: '1', bgcolor: 'primary.light', borderRadius: 1, overflow: 'hidden', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
          {imagen && !imagenFallida ? (
            <Box component="img" src={imagen} alt="" onError={() => setImagenFallida(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <PawIcon aria-hidden="true" sx={{ fontSize: 36, opacity: 0.7 }} />
          )}
        </Box>

        <Stack spacing={0.5} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          {item.productoId != null ? (
            <Link component={RouterLink} to={`/productos/${item.productoId}`} variant="subtitle1" underline="hover" color="text.primary" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
              {nombre}
            </Link>
          ) : (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.35 }}>{nombre}</Typography>
          )}
          <Typography variant="body2" color="text.secondary">{formatearMonto(item.precioUnitario)} c/u</Typography>
          <Typography variant="body2">Cantidad: {cantidadValida ? item.cantidad : 'No disponible'}</Typography>
        </Stack>

        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          justifyContent="space-between"
          alignItems={{ xs: 'baseline', sm: 'flex-end' }}
          sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, pt: { xs: 1.5, sm: 0 }, borderTopWidth: { xs: 1, sm: 0 }, borderTopStyle: 'solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">Subtotal</Typography>
          <Typography variant="h6" component="p" sx={{ whiteSpace: 'nowrap' }}>{formatearMonto(item.subtotal)}</Typography>
        </Stack>
      </Box>
      {acciones && <Box sx={{ mt: 2 }}>{acciones}</Box>}
    </Card>
  );
}
