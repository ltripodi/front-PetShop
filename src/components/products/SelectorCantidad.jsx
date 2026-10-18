import { useId } from 'react';
import { Button, Stack, Typography } from '@mui/material';

export default function SelectorCantidad({ cantidad, stock, onChange, disabled = false }) {
  const labelId = useId();
  const limite = Number.isSafeInteger(stock) && stock > 0 ? stock : 0;
  const bloqueado = disabled || limite === 0;

  return (
    <Stack spacing={1}>
      <Typography id={labelId} variant="subtitle2">Cantidad</Typography>
      <Stack direction="row" alignItems="center" spacing={2} role="group" aria-labelledby={labelId}>
        <Button variant="outlined" aria-label="Disminuir cantidad" disabled={bloqueado || cantidad <= 1} onClick={() => onChange(Math.max(1, cantidad - 1))} sx={{ minWidth: 44, minHeight: 44, px: 1 }}>−</Button>
        <Typography component="output" aria-label="Cantidad seleccionada" aria-live="polite" sx={{ minWidth: 24, textAlign: 'center' }}>{cantidad}</Typography>
        <Button variant="outlined" aria-label="Aumentar cantidad" disabled={bloqueado || cantidad >= limite} onClick={() => onChange(Math.min(limite, cantidad + 1))} sx={{ minWidth: 44, minHeight: 44, px: 1 }}>+</Button>
      </Stack>
    </Stack>
  );
}
