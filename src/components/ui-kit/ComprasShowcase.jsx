import { Box, Button, Stack, Typography } from '@mui/material';
import CompraCard from '../compras/CompraCard';
import LineaCompra from '../compras/LineaCompra';
import ResumenCompra from '../compras/ResumenCompra';

// Forma local de demostración alineada con CompraResponse y DetalleCompraResponse (compra #6 del mock).
const compra = {
  id: 6,
  usuarioId: 1,
  realizadaEn: '2026-10-12T14:32:00',
  total: 42500,
  lineas: [
    { id: 12, productoId: 101, productoNombre: 'Alimento premium para perro adulto', precioUnitario: 24500, cantidad: 1, subtotal: 24500 },
    { id: 13, productoId: 108, productoNombre: 'Pelota liviana para gato', precioUnitario: 3400, cantidad: 2, subtotal: 6800 },
    { id: 14, productoId: 105, productoNombre: 'Correa de paseo ajustable', precioUnitario: 11200, cantidad: 1, subtotal: 11200 },
  ],
};

// Producto mínimo con forma de ProductoResponse. El precio difiere del de la compra
// sólo para mostrar el aviso de precio actual de LineaCompra.
const productoDemostracion = {
  id: 101,
  nombre: 'Alimento premium para perro adulto',
  precio: 25900,
  imagenes: [{ id: 1001, ubicacion: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=85', posicion: 1, principal: true }],
};

export default function ComprasShowcase() {
  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Box>
          <Typography component="h3" variant="h6">Compras</Typography>
          <Typography variant="body2" color="text.secondary">CompraCard, de src/components/compras/. La tarjeta usa el DTO de compra y enlaza a su detalle.</Typography>
        </Box>
        <CompraCard compra={compra} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            LineaCompra muestra una línea de DetalleCompraResponse. Con el producto del catálogo agrega la imagen y, si cambió, el precio actual.
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {compra.lineas.map((linea) => (
              <LineaCompra key={linea.id} linea={linea} producto={linea.productoId === productoDemostracion.id ? productoDemostracion : undefined} />
            ))}
          </Box>
        </Stack>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">ResumenCompra: productos, unidades y total. Las acciones de cada paso se pasan como children.</Typography>
          <ResumenCompra items={compra.lineas} total={compra.total} nota="Nota opcional debajo del total.">
            <Button variant="contained" fullWidth>Acción principal</Button>
          </ResumenCompra>
        </Stack>
      </Box>
    </Stack>
  );
}
