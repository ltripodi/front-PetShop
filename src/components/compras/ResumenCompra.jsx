import { useId } from 'react';
import { Card, Divider, Stack, Typography } from '@mui/material';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// items acepta ítems del carrito (ItemCarritoResponse) o líneas de compra (DetalleCompraResponse):
// ambos informan la cantidad. children se muestra al final (por ejemplo, los botones del paso).
export default function ResumenCompra({ items, total, titulo = 'Resumen', nota, children }) {
  const tituloId = useId();
  const unidades = items.reduce((suma, item) => suma + (Number.isSafeInteger(item?.cantidad) ? item.cantidad : 0), 0);
  const totalValido = typeof total === 'number' && Number.isFinite(total);

  return (
    <Card
      component="aside"
      aria-labelledby={tituloId}
      variant="outlined"
      sx={{ borderRadius: 1, borderColor: 'divider', p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 104 } }}
    >
      <Stack spacing={2}>
        <Typography id={tituloId} component="h2" variant="h5">{titulo}</Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Productos</Typography>
            <Typography>{items.length}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Unidades</Typography>
            <Typography>{unidades}</Typography>
          </Stack>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
          <Typography variant="h6" component="p">Total</Typography>
          <Typography variant="h5" component="p" color="primary.main" sx={{ whiteSpace: 'nowrap' }}>
            {totalValido ? pesos.format(total) : 'No disponible'}
          </Typography>
        </Stack>
        {nota && <Typography variant="body2" color="text.secondary">{nota}</Typography>}
        {children}
      </Stack>
    </Card>
  );
}
