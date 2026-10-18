import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import ShowcaseSection from './ShowcaseSection';

export default function FeedbackShowcase() {
  return (
    <ShowcaseSection title="Feedback" description="Mensajes y estados para comunicar lo que sucede en una pantalla.">
      <Stack spacing={2}>
        <Alert severity="success">La acción se completó correctamente.</Alert>
        <Alert severity="warning">Revisá esta información antes de continuar.</Alert>
        <Alert severity="error">No se pudo completar la acción.</Alert>
        <Stack direction="row" alignItems="center" spacing={2}>
          <CircularProgress size={24} aria-label="Cargando" />
          <Typography color="text.secondary">Cargando contenido</Typography>
        </Stack>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Todavía no hay contenido</Typography>
          <Typography variant="body2" color="text.secondary">Este es un ejemplo de estado vacío.</Typography>
        </Box>
      </Stack>
    </ShowcaseSection>
  );
}
