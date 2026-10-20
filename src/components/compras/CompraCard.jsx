import { Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CompraCard({ compra }) {
  const fechaCompra = new Date(compra.realizadaEn);
  return (
    <Card component="article" variant="outlined" sx={{ borderColor: 'divider', borderRadius: 1 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Stack spacing={0.5}>
            <Typography variant="h6" component="h2">Compra #{compra.id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {Number.isNaN(fechaCompra.getTime()) ? 'Fecha no disponible' : fecha.format(fechaCompra)}
            </Typography>
          </Stack>
          <Typography variant="h6" component="p" sx={{ whiteSpace: 'nowrap' }}>{pesos.format(compra.total)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {compra.lineas.length} {compra.lineas.length === 1 ? 'producto' : 'productos'}
          {compra.lineas.length > 0 && ` · ${compra.lineas.reduce((total, linea) => total + linea.cantidad, 0)} unidades`}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button component={RouterLink} to={`/compras/${compra.id}`} variant="outlined" size="small" aria-label={`Ver detalle de la compra ${compra.id}`}>
          Ver detalle
        </Button>
      </CardActions>
    </Card>
  );
}
