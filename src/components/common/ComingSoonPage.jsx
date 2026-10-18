import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function ComingSoonPage({ title, description = 'Esta sección está en preparación.' }) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, maxWidth: 600 }}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.12em' }}>
        PetShop
      </Typography>
      <Stack spacing={2} alignItems="flex-start">
        <Typography component="h1" variant="h2">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
        <Button component={RouterLink} to="/" variant="outlined">Volver al inicio</Button>
      </Stack>
    </Box>
  );
}
