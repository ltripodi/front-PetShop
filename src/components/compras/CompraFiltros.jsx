import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

const mesLargo = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

function capitalizar(texto) {
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);
}

function FiltroSelect({ id, label, value, children, onChange }) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select labelId={`${id}-label`} id={id} value={value} label={label} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Select>
    </FormControl>
  );
}

// filtros.mes usa el formato "AAAA-MM": los primeros siete caracteres de realizadaEn (LocalDateTime).
// ordenes llega desde la pantalla, que es quien sabe comparar las compras.
export default function CompraFiltros({ compras, filtros, ordenes, filtrosIniciales, onChange, onClear }) {
  const meses = [...new Set(compras.map(({ realizadaEn }) => realizadaEn.slice(0, 7)))]
    .sort()
    .reverse()
    .map((valor) => {
      const [anio, mes] = valor.split('-').map(Number);
      return { valor, etiqueta: capitalizar(mesLargo.format(new Date(anio, mes - 1, 1))) };
    });
  const hayCambios = Object.keys(filtrosIniciales).some((clave) => filtros[clave] !== filtrosIniciales[clave]);

  return (
    <Box component="section" aria-label="Consulta de compras" sx={{ py: 2.5, borderBlock: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: '2fr repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          type="search"
          label="Buscar compras"
          placeholder="Número de compra o producto"
          value={filtros.busqueda}
          onChange={(event) => onChange('busqueda', event.target.value)}
          sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }}
        />
        <FiltroSelect id="compras-mes" label="Mes" value={filtros.mes} onChange={(value) => onChange('mes', value)}>
          <MenuItem value="">Todos</MenuItem>
          {meses.map(({ valor, etiqueta }) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
        </FiltroSelect>
        <FiltroSelect id="compras-orden" label="Ordenar por" value={filtros.orden} onChange={(value) => onChange('orden', value)}>
          {Object.entries(ordenes).map(([valor, { etiqueta }]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
        </FiltroSelect>
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button onClick={onClear} disabled={!hayCambios} size="small">
          Limpiar filtros
        </Button>
      </Stack>
    </Box>
  );
}
