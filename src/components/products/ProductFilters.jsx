import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value="">Todas</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>{option.nombre}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function ProductFilters({ products, filters, onChange, onClear }) {
  const categories = [...new Map(products.map(({ categoria }) => categoria).filter(Boolean).map((item) => [item.id, item])).values()]
    .sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'));
  const brands = [...new Map(products.map(({ marca }) => marca).filter(Boolean).map((item) => [item.id, item])).values()]
    .sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'));
  const creators = [...new Map(products.map(({ creador }) => creador).filter(Boolean).map((item) => [item.id, item])).values()]
    .sort((first, second) => first.nombreUsuario.localeCompare(second.nombreUsuario, 'es'));
  const species = [...new Map(products.flatMap(({ especies = [] }) => especies).map((item) => [item.id, item])).values()]
    .sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'));
  const hasFilters = Boolean(filters.nombre || filters.categoriaId || filters.marcaId || filters.especieId || filters.creadorId || filters.soloDisponibles);

  return (
    <Box component="section" aria-label="Filtros del catálogo" sx={{ py: 2.5, borderBlock: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: '2fr repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          type="search"
          label="Buscar productos"
          placeholder="Nombre del producto"
          value={filters.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
        <FilterSelect id="product-category" label="Categoría" value={filters.categoriaId} options={categories} onChange={(value) => onChange('categoriaId', value)} />
        <FilterSelect id="product-brand" label="Marca" value={filters.marcaId} options={brands} onChange={(value) => onChange('marcaId', value)} />
        <FilterSelect id="product-species" label="Especie" value={filters.especieId} options={species} onChange={(value) => onChange('especieId', value)} />
        <FilterSelect id="product-creator" label="Publicado por" value={filters.creadorId} options={creators} onChange={(value) => onChange('creadorId', value)} />
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mt: 1 }}>
        <FormControlLabel
          control={(
            <Checkbox
              checked={filters.soloDisponibles}
              onChange={(event) => onChange('soloDisponibles', event.target.checked)}
              size="small"
            />
          )}
          label="Solo disponibles"
        />
        <Button onClick={onClear} disabled={!hasFilters} size="small">
          Limpiar filtros
        </Button>
      </Stack>
    </Box>
  );
}