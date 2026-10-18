import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../components/common/Icons';

const highlights = [
  { title: 'Cuidado', text: 'Para acompañar su bienestar todos los días.' },
  { title: 'Juego', text: 'Para compartir momentos llenos de energía.' },
  { title: 'Compañía', text: 'Para celebrar ese vínculo que los hace únicos.' },
];

function HeroIllustration() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        minHeight: { xs: 245, md: 470 },
        bgcolor: 'primary.light',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: { xs: 180, sm: 220, md: 270 }, aspectRatio: '1', borderRadius: '50%', bgcolor: 'primary.main', display: 'grid', placeItems: 'center' }}>
        <PawIcon sx={{ fontSize: { xs: 96, sm: 120, md: 145 }, color: 'primary.contrastText', transform: 'rotate(-13deg)' }} />
      </Box>
      <Box sx={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', bgcolor: 'secondary.light', top: '12%', left: '12%' }} />
      <Box sx={{ position: 'absolute', width: 38, height: 38, borderRadius: '50%', bgcolor: 'background.paper', bottom: '15%', right: '12%' }} />
      <Typography sx={{ position: 'absolute', bottom: 20, left: 24, px: 1.5, py: 0.5, borderRadius: 99, bgcolor: 'background.paper', color: 'primary.dark', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Con amor, para ellos
      </Typography>
    </Box>
  );
}

export default function Home() {
  return (
    <Stack spacing={{ xs: 6, md: 9 }}>
      <Box
        component="section"
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, bgcolor: 'background.paper', borderRadius: { xs: 3, md: 4 }, overflow: 'hidden', border: 1, borderColor: 'divider' }}
      >
        <Stack alignItems="flex-start" justifyContent="center" spacing={3} sx={{ p: { xs: 3, sm: 5, md: 6, lg: 7 } }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.13em' }}>
            Para quienes son parte de la familia
          </Typography>
          <Typography component="h1" variant="h1">
            Todo para su mundo, <Box component="span" sx={{ color: 'primary.main' }}>en un solo lugar.</Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 430, fontSize: { xs: '1rem', md: '1.1rem' } }}>
            Un espacio pensado para acompañarte en el cuidado y la alegría de tus mascotas.
          </Typography>
          <Button component={RouterLink} to="/productos" variant="contained" size="large">
            Explorar productos <Box component="span" aria-hidden="true" sx={{ ml: 1.5 }}>→</Box>
          </Button>
        </Stack>
        <HeroIllustration />
      </Box>

      <Box component="section" aria-labelledby="home-highlights">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.13em' }}>En cada etapa</Typography>
            <Typography id="home-highlights" component="h2" variant="h2">Pensado para ellos.</Typography>
          </Box>
          <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
            Lo importante está en los pequeños momentos que comparten.
          </Typography>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, borderTop: 1, borderColor: 'divider' }}>
          {highlights.map((item, index) => (
            <Box key={item.title} sx={{ pt: 3, pb: { xs: 2, sm: 0 }, pr: { sm: 3 } }}>
              <Typography color="primary.main" variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>0{index + 1}</Typography>
              <Typography component="h3" variant="h6" sx={{ mt: 1 }}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
