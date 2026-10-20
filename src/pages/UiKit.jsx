import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ThemeShowcase from '../components/ui-kit/ThemeShowcase';
import ButtonsShowcase from '../components/ui-kit/ButtonsShowcase';
import FormsShowcase from '../components/ui-kit/FormsShowcase';
import FeedbackShowcase from '../components/ui-kit/FeedbackShowcase';
import ShowcaseSection from '../components/ui-kit/ShowcaseSection';
import CarritoShowcase from '../components/ui-kit/CarritoShowcase';
import ComprasShowcase from '../components/ui-kit/ComprasShowcase';

export default function UiKit() {
  return (
    <Stack spacing={3}>
      <Stack spacing={1} sx={{ mb: 2, maxWidth: 760 }}>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.13em' }}>Para el equipo</Typography>
        <Typography component="h1" variant="h2">UI Kit</Typography>
        <Typography color="text.secondary">Una referencia compartida de estilos y componentes para construir las pantallas de PetShop con una misma identidad.</Typography>
      </Stack>
      <ThemeShowcase />
      <ButtonsShowcase />
      <FormsShowcase />
      <FeedbackShowcase />
      <ShowcaseSection title="Navegación" description="La barra superior es la misma que usa toda la aplicación. En pantallas pequeñas se convierte en un menú desplegable.">
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
          <Button component={RouterLink} to="/" variant="text">Ir al inicio</Button>
          <Button component={RouterLink} to="/productos" variant="text">Ir a productos</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">Las pantallas pendientes usan un mismo mensaje temporal hasta que se integren los componentes del equipo.</Typography>
      </ShowcaseSection>
      <ShowcaseSection title="Componentes del equipo" description="Este espacio está preparado para sumar componentes reutilizables a medida que se incorporen al proyecto.">
        <CarritoShowcase />
        <ComprasShowcase />
      </ShowcaseSection>
    </Stack>
  );
}
