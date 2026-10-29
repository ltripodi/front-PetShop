import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as carritoService from '../services/carritoService.js';

const initialState = {
  carrito: null,
  cargando: true,
  error: null,
  cargaSolicitada: false,
};

// Conserva la carga local actual para no cambiar el contrato ni los datos del TPO.
export const cargarCarrito = createAsyncThunk(
  'carrito/cargarCarrito',
  (_, { signal }) => carritoService.getCarrito({ signal }),
  {
    // React StrictMode ejecuta los efectos dos veces en desarrollo. Esta condición
    // evita una segunda carga y tampoco pisa un carrito ya editado.
    condition: (_, { getState }) => {
      const { carrito, cargando, cargaSolicitada } = getState().carrito;
      return !carrito && (!cargaSolicitada || !cargando);
    },
  },
);

function actualizarCarrito(state, operacion) {
  if (!state.carrito) {
    throw new Error('El carrito todavía no está disponible.');
  }
  state.carrito = operacion(state.carrito);
  state.error = null;
}

const carritoSlice = createSlice({
  name: 'carrito',
  initialState,
  reducers: {
    agregarProducto(state, action) {
      const { producto, cantidad } = action.payload;
      actualizarCarrito(state, (carrito) => carritoService.agregarProducto(carrito, producto, cantidad));
    },
    modificarCantidad(state, action) {
      const { itemId, producto, cantidad } = action.payload;
      actualizarCarrito(state, (carrito) => carritoService.modificarCantidad(carrito, itemId, producto, cantidad));
    },
    eliminarProducto(state, action) {
      actualizarCarrito(state, (carrito) => carritoService.eliminarProducto(carrito, action.payload));
    },
    vaciarCarrito(state) {
      actualizarCarrito(state, (carrito) => carritoService.vaciarCarrito(carrito));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cargarCarrito.pending, (state) => {
        state.cargando = true;
        state.error = null;
        state.cargaSolicitada = true;
      })
      .addCase(cargarCarrito.fulfilled, (state, action) => {
        state.carrito = action.payload;
        state.cargando = false;
        state.error = null;
      })
      .addCase(cargarCarrito.rejected, (state, action) => {
        state.cargando = false;
        state.error = action.error;
      });
  },
});

export const { agregarProducto, modificarCantidad, eliminarProducto, vaciarCarrito } = carritoSlice.actions;

export const selectEstadoCarrito = (state) => state.carrito;
export const selectCarrito = (state) => selectEstadoCarrito(state).carrito;
export const selectCargandoCarrito = (state) => selectEstadoCarrito(state).cargando;
export const selectErrorCarrito = (state) => selectEstadoCarrito(state).error;

export default carritoSlice.reducer;
