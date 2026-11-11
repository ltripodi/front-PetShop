import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { USUARIO_ACTUAL_ID } from '../services/apiConfig.js';
import * as carritoService from '../services/carritoService.js';

const initialState = {
  carrito: null,
  cargando: true,
  operando: false,
  error: null,
  errorOperacion: null,
  cargaSolicitada: false,
};

const mensajeError = (error) => error?.message ?? 'No se pudo completar la operación sobre el carrito.';

export const cargarCarrito = createAsyncThunk(
  'carrito/cargarCarrito',
  (_, { signal }) => carritoService.getCarrito(USUARIO_ACTUAL_ID, { signal }),
  {
    // React StrictMode ejecuta los efectos dos veces en desarrollo. Esta condición
    // evita una segunda carga y tampoco pisa un carrito ya editado.
    condition: (_, { getState }) => {
      const { carrito, cargando, cargaSolicitada } = getState().carrito;
      return !carrito && (!cargaSolicitada || !cargando);
    },
  },
);

// Cada thunk recibe y publica el CarritoResponse del backend: Redux no calcula
// precios, totales ni stock, que son responsabilidad de CarritoService.
export const addToCart = createAsyncThunk(
  'carrito/addToCart',
  ({ productoId, cantidad }, { signal }) => carritoService.addToCart(USUARIO_ACTUAL_ID, productoId, cantidad, { signal }),
);

export const updateCartItem = createAsyncThunk(
  'carrito/updateCartItem',
  ({ itemId, cantidad }, { signal }) => carritoService.updateCartItem(USUARIO_ACTUAL_ID, itemId, cantidad, { signal }),
);

export const removeFromCart = createAsyncThunk(
  'carrito/removeFromCart',
  (itemId, { signal }) => carritoService.removeFromCart(USUARIO_ACTUAL_ID, itemId, { signal }),
);

export const clearCart = createAsyncThunk(
  'carrito/clearCart',
  (_, { signal }) => carritoService.clearCart(USUARIO_ACTUAL_ID, { signal }),
);

function operacionPendiente(state) {
  state.operando = true;
  state.errorOperacion = null;
}

function operacionExitosa(state, action) {
  state.carrito = action.payload;
  state.operando = false;
  state.errorOperacion = null;
}

function operacionFallida(state, action) {
  state.operando = false;
  state.errorOperacion = { message: mensajeError(action.error) };
}

const carritoSlice = createSlice({
  name: 'carrito',
  initialState,
  reducers: {},
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
        state.error = { message: mensajeError(action.error) };
      })
      .addCase(addToCart.pending, operacionPendiente)
      .addCase(addToCart.fulfilled, operacionExitosa)
      .addCase(addToCart.rejected, operacionFallida)
      .addCase(updateCartItem.pending, operacionPendiente)
      .addCase(updateCartItem.fulfilled, operacionExitosa)
      .addCase(updateCartItem.rejected, operacionFallida)
      .addCase(removeFromCart.pending, operacionPendiente)
      .addCase(removeFromCart.fulfilled, operacionExitosa)
      .addCase(removeFromCart.rejected, operacionFallida)
      .addCase(clearCart.pending, operacionPendiente)
      .addCase(clearCart.fulfilled, operacionExitosa)
      .addCase(clearCart.rejected, operacionFallida);
  },
});

export const selectEstadoCarrito = (state) => state.carrito;
export const selectCarrito = (state) => selectEstadoCarrito(state).carrito;
export const selectCargandoCarrito = (state) => selectEstadoCarrito(state).cargando;
export const selectOperandoCarrito = (state) => selectEstadoCarrito(state).operando;
export const selectErrorCarrito = (state) => selectEstadoCarrito(state).error;
export const selectErrorOperacionCarrito = (state) => selectEstadoCarrito(state).errorOperacion;

export default carritoSlice.reducer;
