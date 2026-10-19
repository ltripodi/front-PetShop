import { useContext } from 'react';
import { CarritoContext } from '../context/CarritoContext';

export default function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (contexto === undefined) {
    throw new Error('useCarrito debe utilizarse dentro de CarritoProvider.');
  }
  return contexto;
}
