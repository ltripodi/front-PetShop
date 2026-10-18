import { Box, Stack, Typography } from '@mui/material';
import ItemCarrito from '../carrito/ItemCarrito';
import ResumenCarrito from '../carrito/ResumenCarrito';

// Valores locales de demostración con la forma de ItemCarritoResponse y CarritoResponse.
const itemConImagen = { id: 1, productoId: 101, productoNombre: 'Alimento premium para perro adulto', precioUnitario: 24500, cantidad: 2, subtotal: 49000 };
const itemSinImagen = { id: 2, productoId: 108, productoNombre: 'Pelota liviana para gato', precioUnitario: 3400, cantidad: 3, subtotal: 10200 };
const carrito = { id: 1, usuarioId: 1, items: [itemConImagen, itemSinImagen], total: 59200, actualizadoEn: '2026-10-18T19:05:28' };
const imagenDemo = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=300&q=80';

export default function CarritoShowcase() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h3" variant="h6">Carrito</Typography>
        <Typography variant="body2" color="text.secondary">
          ItemCarrito y ResumenCarrito, de src/components/carrito/. El segundo ítem no tiene imagen y muestra el ícono de reemplazo.
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Stack component="ul" spacing={2} aria-label="Ejemplo de ítems del carrito" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          <ItemCarrito item={itemConImagen} imagen={imagenDemo} />
          <ItemCarrito item={itemSinImagen} />
        </Stack>
        <ResumenCarrito carrito={carrito} />
      </Box>
    </Stack>
  );
}
