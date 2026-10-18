import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import { getProductos } from '../services/productosService';

const EMPTY_FILTERS = {
  nombre: '',
  categoriaId: '',
  marcaId: '',
  especieId: '',
  soloDisponibles: false,
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    getProductos({ signal: controller.signal })
      .then(setProducts)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const normalizedName = filters.nombre.trim().toLocaleLowerCase('es');
  const filteredProducts = products.filter((product) => {
    const matchesName = !normalizedName || product.nombre.toLocaleLowerCase('es').includes(normalizedName);
    const matchesCategory = !filters.categoriaId || String(product.categoria?.id) === filters.categoriaId;
    const matchesBrand = !filters.marcaId || String(product.marca?.id) === filters.marcaId;
    const matchesSpecies = !filters.especieId || product.especies?.some(({ id }) => String(id) === filters.especieId);
    const matchesAvailability = !filters.soloDisponibles || product.disponible;

    return matchesName && matchesCategory && matchesBrand && matchesSpecies && matchesAvailability;
  });

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <Stack spacing={3}>
      <Box component="header">
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
          Catálogo
        </Typography>
        <Typography component="h1" variant="h2">Todo para ellos</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
          Encontrá alimentos, juegos y accesorios para compartir cada día.
        </Typography>
      </Box>

      <ProductFilters
        products={products}
        filters={filters}
        onChange={updateFilter}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <Box component="section" aria-label="Productos">
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'baseline' }} justifyContent="space-between" spacing={0.5} sx={{ mb: 2.5 }}>
          <Typography component="h2" variant="h5">Productos para descubrir</Typography>
          {!loading && !error && (
            <Typography variant="body2" color="text.secondary" role="status">
              {filteredProducts.length} de {products.length} productos
            </Typography>
          )}
        </Stack>

        {loading && (
          <Box role="status" aria-label="Cargando productos" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => setReloadKey((key) => key + 1)}>Reintentar</Button>}
          >
            No pudimos cargar los productos. Revisá tu conexión e intentá de nuevo.
          </Alert>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 2.5 } }}>
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </Box>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography component="h3" variant="h6">No encontramos productos</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Probá cambiar la búsqueda o quitar algún filtro.
            </Typography>
            <Button onClick={() => setFilters(EMPTY_FILTERS)} sx={{ mt: 1 }}>Limpiar filtros</Button>
          </Box>
        )}
      </Box>
    </Stack>
  );
}