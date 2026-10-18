import { useId } from 'react';
import { Button, Card, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// carrito tiene la forma de CarritoResponse. El total es el que calcula el backend; no se recalcula acá.
// acciones es opcional y se muestra al final del resumen (por ejemplo, vaciar el carrito).
export default function ResumenCarrito({ carrito, acciones }) {
  const tituloId = useId();
  const unidades = carrito.items.reduce((suma, item) => suma + (Number.isSafeInteger(item?.cantidad) ? item.cantidad : 0), 0);
  const totalValido = typeof carrito.total === 'number' && Number.isFinite(carrito.total);

  return (
    <Card
      component="aside"
      aria-labelledby={tituloId}
      variant="outlined"
      sx={{ borderRadius: 1, borderColor: 'divider', p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 104 } }}
    >
      <Stack spacing={2}>
        <Typography id={tituloId} component="h2" variant="h5">Resumen</Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Productos</Typography>
            <Typography>{carrito.items.length}</Typography>
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
            {totalValido ? pesos.format(carrito.total) : 'No disponible'}
          </Typography>
        </Stack>
        <Button component={RouterLink} to="/checkout" variant="contained" size="large" fullWidth>Finalizar compra</Button>
        <Button component={RouterLink} to="/productos" fullWidth>Seguir comprando</Button>
        {acciones}
      </Stack>
    </Card>
  );
}
