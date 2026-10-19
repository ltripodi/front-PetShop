import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import theme from './theme/theme';
import { CarritoProvider } from './context/CarritoContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CarritoProvider>
        <App />
      </CarritoProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
