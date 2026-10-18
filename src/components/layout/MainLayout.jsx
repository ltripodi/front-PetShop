import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, sm: 5, md: 7 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
