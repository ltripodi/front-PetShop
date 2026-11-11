import { useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import SelectorCantidad from '../products/SelectorCantidad';

// Sin item representa las acciones del carrito completo. Las operaciones son
// asíncronas y el backend devuelve el carrito actualizado como fuente de verdad.
export default function CarritoActions({ item, producto, cargandoCatalogo = false, modificarCantidad, eliminarProducto, vaciarCarrito }) {
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function ejecutar(operacion) {
    if (procesando) return;
    setProcesando(true);
    try {
      await operacion();
      setError(null);
    } catch (errorOperacion) {
      setError(errorOperacion instanceof Error ? errorOperacion.message : 'No se pudo completar la operación. Intentá nuevamente.');
    } finally {
      setProcesando(false);
    }
  }

  const stockDisponible = Number.isSafeInteger(producto?.stock) && producto.stock > 0;
  const puedeEditar = !cargandoCatalogo && producto?.disponible === true && stockDisponible;

  return (
    <Stack spacing={1.5} role="group" aria-label={item ? `Acciones para ${item.productoNombre}` : 'Acciones del carrito'}>
      {item ? (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
            <SelectorCantidad
              cantidad={item.cantidad}
              stock={producto?.stock}
              disabled={!puedeEditar || procesando}
              onChange={(cantidad) => ejecutar(() => modificarCantidad({ itemId: item.id, cantidad }))}
            />
            <Button
              color="error"
              variant="outlined"
              aria-label={`Eliminar ${item.productoNombre}`}
              onClick={() => ejecutar(() => eliminarProducto(item.id))}
              disabled={procesando}
              sx={{ minHeight: 44 }}
            >
              Eliminar producto
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {cargandoCatalogo ? 'Consultando stock…'
              : !producto ? 'No se pudo confirmar el stock de este producto. Podés eliminarlo.'
                : !puedeEditar ? 'El producto no está disponible para modificar cantidades. Podés eliminarlo.'
                  : `Stock disponible: ${producto.stock} ${producto.stock === 1 ? 'unidad' : 'unidades'}.`}
          </Typography>
        </>
      ) : (
        <Button color="error" variant="outlined" fullWidth onClick={() => ejecutar(vaciarCarrito)} disabled={procesando} sx={{ minHeight: 44 }}>
          Vaciar carrito
        </Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
