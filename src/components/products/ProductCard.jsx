import { useState } from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PawIcon } from '../common/Icons';

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.imagenes?.find(({ principal }) => principal) ?? product.imagenes?.[0];
  const species = product.especies?.map(({ nombre }) => nombre).join(' · ');

  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 1, borderColor: 'divider', transition: 'border-color 160ms ease, transform 160ms ease', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' } }}>
      <CardActionArea
        component={RouterLink}
        to={`/productos/${product.id}`}
        aria-label={`Ver detalle de ${product.nombre}`}
        sx={{ height: '100%', display: 'flex', alignItems: 'stretch', flexDirection: 'column' }}
      >
        <Box sx={{ width: '100%', aspectRatio: '4 / 3', bgcolor: 'primary.light', overflow: 'hidden' }}>
          {image && !imageFailed ? (
            <CardMedia
              component="img"
              image={image.ubicacion}
              alt={product.nombre}
              onError={() => setImageFailed(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
              <PawIcon sx={{ fontSize: 72, opacity: 0.7 }} />
            </Box>
          )}
        </Box>
        <CardContent sx={{ width: '100%', flex: 1, p: 2.25, '&:last-child': { pb: 2.25 } }}>
          <Stack spacing={1.25} sx={{ height: '100%' }}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {[product.categoria?.nombre, species].filter(Boolean).join(' · ')}
            </Typography>
            <Typography component="h2" variant="h6" sx={{ minHeight: '3.2em', lineHeight: 1.35 }}>
              {product.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, minHeight: '3.3em' }}>
              {product.descripcion}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 1.25, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" color="text.primary">{priceFormatter.format(product.precio)}</Typography>
              <Typography variant="caption" color={product.disponible ? 'success.main' : 'text.secondary'}>
                {product.disponible ? `Disponible · ${product.stock} en stock` : 'No disponible'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}