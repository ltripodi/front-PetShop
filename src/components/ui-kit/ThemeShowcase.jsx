import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ShowcaseSection from './ShowcaseSection';

export default function ThemeShowcase() {
  const theme = useTheme();
  const colors = [
    ['Primary', theme.palette.primary.main],
    ['Secondary', theme.palette.secondary.main],
    ['Background', theme.palette.background.default],
    ['Text primary', theme.palette.text.primary],
    ['Text secondary', theme.palette.text.secondary],
    ['Error', theme.palette.error.main],
    ['Warning', theme.palette.warning.main],
    ['Success', theme.palette.success.main],
  ];

  return (
    <>
      <ShowcaseSection title="Paleta de colores" description="Los colores se toman directamente del theme compartido.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
          {colors.map(([name, value]) => (
            <Box key={name}>
              <Box sx={{ height: 72, borderRadius: 2, bgcolor: value, border: 1, borderColor: 'divider' }} />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">{value}</Typography>
            </Box>
          ))}
        </Box>
      </ShowcaseSection>
      <ShowcaseSection title="Tipografía" description="Variantes de Material UI configuradas para la interfaz.">
        <Stack spacing={2}>
          <Typography variant="h1" component="p">Título h1</Typography>
          <Typography variant="h2" component="p">Título h2</Typography>
          <Typography variant="h3" component="p">Título h3</Typography>
          <Typography variant="subtitle1">Subtítulo para acompañar una sección.</Typography>
          <Typography variant="body1">Texto de lectura para describir el contenido de una pantalla.</Typography>
          <Typography variant="caption" color="text.secondary">Texto breve o información secundaria.</Typography>
        </Stack>
      </ShowcaseSection>
    </>
  );
}
