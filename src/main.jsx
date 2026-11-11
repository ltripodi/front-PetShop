import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import App from './App';
import CarritoBootstrap from './components/carrito/CarritoBootstrap';
import store from './store/store';
import theme from './theme/theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <CarritoBootstrap>
          <App />
        </CarritoBootstrap>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
