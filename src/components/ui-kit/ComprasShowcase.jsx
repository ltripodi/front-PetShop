import { Stack, Typography } from '@mui/material';
import CompraCard from '../compras/CompraCard';

// Forma local de demostración alineada con CompraResponse y DetalleCompraResponse.
const compra = {
  id: 1,
  usuarioId: 1,
  realizadaEn: '2026-10-12T14:32:00',
  total: 42500,
  lineas: [
    { id: 1, productoId: 101, productoNombre: 'Alimento premium para perro adulto', precioUnitario: 24500, cantidad: 1, subtotal: 24500 },
    { id: 2, productoId: 108, productoNombre: 'Pelota liviana para gato', precioUnitario: 3400, cantidad: 2, subtotal: 6800 },
    { id: 3, productoId: 105, productoNombre: 'Correa de paseo ajustable', precioUnitario: 11200, cantidad: 1, subtotal: 11200 },
  ],
};

export default function ComprasShowcase() {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">CompraCard, de src/components/compras/. La tarjeta usa el DTO de compra y enlaza a su detalle.</Typography>
      <CompraCard compra={compra} />
    </Stack>
  );
}
