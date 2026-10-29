import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cargarCarrito } from '../../store/carritoSlice';

// Inicializa el estado global una sola vez al abrir la aplicación.
export default function CarritoBootstrap({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let vigente = true;
    let carga;

    // En StrictMode el primer efecto se limpia antes de esta microtarea.
    // Así se inicia una única carga útil y se puede abortar al desmontar.
    queueMicrotask(() => {
      if (vigente) carga = dispatch(cargarCarrito());
    });

    return () => {
      vigente = false;
      carga?.abort();
    };
  }, [dispatch]);

  return children;
}
