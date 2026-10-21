import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, TextField, Typography,
} from '@mui/material';

// Se monta sólo mientras está abierto: cada apertura empieza con el formulario limpio.
// onConfirmar({ stock } | { ajuste }) devuelve una promesa; si rechaza, el error se muestra acá.
export default function AjusteStockDialog({ producto, onClose, onConfirmar }) {
  const [modo, setModo] = useState('ajuste');
  const [valor, setValor] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const numero = Number(valor);
  const esEntero = valor.trim() !== '' && Number.isSafeInteger(numero);
  const resultado = esEntero ? (modo === 'stock' ? numero : producto.stock + numero) : null;
  const negativo = resultado !== null && resultado < 0;
  const puedeConfirmar = esEntero && !negativo && !enviando;

  let ayuda = modo === 'stock' ? 'Cantidad total de unidades disponibles.' : 'Usá un número negativo para descontar unidades.';
  if (valor.trim() !== '' && !esEntero) ayuda = 'Ingresá un número entero.';
  if (negativo) ayuda = 'El stock no puede quedar negativo.';

  async function confirmar(evento) {
    evento.preventDefault();
    if (!puedeConfirmar) return;
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar(modo === 'stock' ? { stock: numero } : { ajuste: numero });
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="ajuste-stock-titulo">
      <form onSubmit={confirmar} noValidate>
        <DialogTitle id="ajuste-stock-titulo">Ajustar stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <DialogContentText>
              {producto.nombre}. Stock actual: <strong>{producto.stock}</strong>
            </DialogContentText>
            <FormControl>
              <FormLabel id="ajuste-stock-modo">Tipo de cambio</FormLabel>
              <RadioGroup row aria-labelledby="ajuste-stock-modo" value={modo} onChange={(evento) => { setModo(evento.target.value); setError(null); }}>
                <FormControlLabel value="ajuste" control={<Radio />} label="Sumar o restar" />
                <FormControlLabel value="stock" control={<Radio />} label="Establecer total" />
              </RadioGroup>
            </FormControl>
            <TextField
              label={modo === 'stock' ? 'Nuevo stock' : 'Unidades a sumar o restar'}
              type="number"
              value={valor}
              onChange={(evento) => { setValor(evento.target.value); setError(null); }}
              error={(valor.trim() !== '' && !esEntero) || negativo}
              helperText={ayuda}
              slotProps={{ htmlInput: { step: 1, inputMode: 'numeric' } }}
              autoFocus
              fullWidth
            />
            {resultado !== null && !negativo && (
              <Typography role="status" color="text.secondary">
                Stock resultante: <strong>{resultado}</strong>
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={enviando} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!puedeConfirmar}>
            {enviando ? 'Guardando…' : 'Guardar stock'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
