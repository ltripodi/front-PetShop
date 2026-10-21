import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';

// Se monta sólo mientras está abierto. onConfirmar() devuelve una promesa; si rechaza, el error se muestra acá.
export default function ConfirmarEliminarDialog({ producto, onClose, onConfirmar }) {
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="eliminar-titulo">
      <DialogTitle id="eliminar-titulo">Eliminar producto</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            ¿Querés eliminar <strong>{producto.nombre}</strong>? Va a dejar de estar disponible en el catálogo.
            Se conserva en el sistema para no perder el historial de carritos y compras que lo incluyen.
          </DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={enviando} color="inherit">Cancelar</Button>
        <Button onClick={confirmar} color="error" variant="contained" disabled={enviando}>
          {enviando ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```[cite: 4]

