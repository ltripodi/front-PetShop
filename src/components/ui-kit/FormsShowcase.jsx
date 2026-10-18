import { useState } from 'react';
import {
  Box, Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel,
  MenuItem, Radio, RadioGroup, Select, Stack, Switch, TextField,
} from '@mui/material';
import ShowcaseSection from './ShowcaseSection';

export default function FormsShowcase() {
  const [option, setOption] = useState('uno');

  return (
    <ShowcaseSection title="Formularios" description="Ejemplos visuales de controles; no están conectados a datos ni acciones del negocio.">
      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          <TextField label="Campo de texto" placeholder="Escribí aquí" helperText="Ejemplo de ayuda para un campo" />
          <FormControl fullWidth>
            <InputLabel id="ui-kit-select-label">Selección</InputLabel>
            <Select labelId="ui-kit-select-label" label="Selección" value={option} onChange={(event) => setOption(event.target.value)}>
              <MenuItem value="uno">Opción uno</MenuItem>
              <MenuItem value="dos">Opción dos</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 5 }}>
          <FormControlLabel control={<Checkbox />} label="Casilla de verificación" />
          <FormControlLabel control={<Switch />} label="Interruptor" />
        </Stack>
        <FormControl>
          <FormLabel>Opciones de ejemplo</FormLabel>
          <RadioGroup row defaultValue="una" name="ui-kit-radio">
            <FormControlLabel value="una" control={<Radio />} label="Una" />
            <FormControlLabel value="otra" control={<Radio />} label="Otra" />
          </RadioGroup>
        </FormControl>
      </Stack>
    </ShowcaseSection>
  );
}
