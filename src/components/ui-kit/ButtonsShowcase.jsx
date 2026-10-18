import { Button, Stack } from '@mui/material';
import { PawIcon } from '../common/Icons';
import ShowcaseSection from './ShowcaseSection';

export default function ButtonsShowcase() {
  return (
    <ShowcaseSection title="Botones" description="Usá las variantes de Material UI según la importancia de cada acción.">
      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1.5}>
        <Button variant="contained">Principal</Button>
        <Button variant="contained" color="secondary">Secundario</Button>
        <Button variant="outlined">Alternativo</Button>
        <Button variant="contained" disabled>Deshabilitado</Button>
        <Button variant="outlined" color="error">Eliminar</Button>
        <Button variant="outlined" startIcon={<PawIcon />}>Con ícono</Button>
      </Stack>
    </ShowcaseSection>
  );
}
