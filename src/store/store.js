import { configureStore } from '@reduxjs/toolkit';
import carritoReducer from './carritoSlice.js';

export function crearStore() {
  return configureStore({
    reducer: {
      carrito: carritoReducer,
    },
  });
}

const store = crearStore();

export default store;
