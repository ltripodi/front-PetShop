import { useEffect, useState } from 'react';
import { NavLink, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CloseIcon, MenuIcon, PawIcon } from '../common/Icons';

const navigationItems = [
  { label: 'Inicio', to: '/', end: true },
  { label: 'Productos', to: '/productos' },
  { label: 'Carrito', to: '/carrito' },
  { label: 'Compras', to: '/compras' },
  { label: 'Gestión', to: '/gestion-productos' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 68, md: 80 }, gap: 2 }}>
          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            alignItems="center"
            spacing={1.25}
            aria-label="PetShop, ir al inicio"
            sx={{ color: 'text.primary', textDecoration: 'none', flexGrow: 1, minWidth: 0 }}
          >
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'primary.main', display: 'grid', placeItems: 'center', color: 'primary.contrastText' }}>
              <PawIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.04em' }}>
              petshop<span style={{ color: theme.palette.primary.main }}>.</span>
            </Typography>
          </Stack>

          <Box component="nav" aria-label="Navegación principal" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {navigationItems.map(({ label, to, end }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end={end}
                color="inherit"
                sx={{ px: 2, color: 'text.secondary', '&.active': { color: 'primary.dark', bgcolor: 'primary.light' } }}
              >
                {label}
              </Button>
            ))}
          </Box>

          <IconButton
            aria-label="Abrir menú de navegación"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? 'mobile-navigation' : undefined}
            onClick={() => setMenuOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={menuOpen && !isDesktop} onClose={() => setMenuOpen(false)}>
        <Box id="mobile-navigation" component="nav" aria-label="Navegación móvil" sx={{ width: 'min(300px, 85vw)', p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 2 }}>
            <Typography variant="h6">Menú</Typography>
            <IconButton aria-label="Cerrar menú de navegación" onClick={() => setMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <List disablePadding>
            {navigationItems.map(({ label, to, end }) => (
              <ListItemButton
                key={to}
                component={NavLink}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5, '&.active': { color: 'primary.dark', bgcolor: 'primary.light' } }}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
