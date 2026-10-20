import { useState } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../common/Icons';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// linea tiene la forma de DetalleCompraResponse y conserva el precio del momento de la compra.
// producto es opcional (ProductoResponse del catálogo): aporta la imagen y el precio actual.
export default function LineaCompra({ linea, producto }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes.filter((imagen) => imagen?.ubicacion) : [];
  const imagen = imagenes.find((item) => item.principal) ?? imagenes[0];
  const precioActual = typeof producto?.precio === 'number' && Number.isFinite(producto.precio) ? producto.precio : null;
  const cambioPrecio = precioActual !== null && Math.round(precioActual * 100) !== Math.round(linea.precioUnitario * 100);

  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '56px minmax(0, 1fr)', sm: '64px minmax(0, 1fr) auto' },
        gap: 2,
        alignItems: 'center',
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
        '&:first-of-type': { pt: 0 },
        '&:last-of-type': { pb: 0, borderBottom: 0 },
      }}
    >
      <Box sx={{ aspectRatio: '1', bgcolor: 'primary.light', borderRadius: 1, overflow: 'hidden', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
        {imagen && !imagenFallida ? (
          <Box component="img" src={imagen.ubicacion} alt="" onError={() => setImagenFallida(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <PawIcon aria-hidden="true" sx={{ fontSize: 28, opacity: 0.7 }} />
        )}
      </Box>
      <Stack spacing={0.25} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <Link component={RouterLink} to={`/productos/${linea.productoId}`} underline="hover" color="text.primary" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
          {linea.productoNombre}
        </Link>
        <Typography variant="body2" color="text.secondary">{linea.cantidad} × {pesos.format(linea.precioUnitario)}</Typography>
        {cambioPrecio && <Typography variant="caption" color="text.secondary">Precio actual: {pesos.format(precioActual)}</Typography>}
      </Stack>
      <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap', gridColumn: { xs: 2, sm: 'auto' }, justifySelf: { sm: 'end' } }}>
        {pesos.format(linea.subtotal)}
      </Typography>
    </Box>
  );
}
