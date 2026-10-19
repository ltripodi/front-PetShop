import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as carritoService from '../services/carritoService';

export const CarritoContext = createContext(undefined);

export function CarritoProvider({ children }) {
  const [estado, setEstado] = useState({ carrito: null, cargando: true, error: null });
  const estadoActual = useRef(estado);
  const montado = useRef(false);
  const cargaActual = useRef(null);

  // Las referencias se actualizan fuera del render y de funciones actualizadoras.
  // Así, dos operaciones en el mismo evento usan siempre el último carrito.
  const publicar = useCallback((nuevoEstado) => {
    estadoActual.current = nuevoEstado;
    setEstado(nuevoEstado);
  }, []);

  const cargarCarrito = useCallback(async () => {
    if (!montado.current) throw new Error('El proveedor del carrito no está montado.');
    // Reintentar sólo la inicialización: nunca reemplazar un carrito ya editado.
    if (estadoActual.current.carrito || cargaActual.current) return;
    const controller = new AbortController();
    cargaActual.current = controller;
    publicar({ carrito: null, cargando: true, error: null });
    try {
      const carrito = await carritoService.getCarrito({ signal: controller.signal });
      if (montado.current && !controller.signal.aborted) {
        publicar({ carrito, cargando: false, error: null });
      }
    } catch (error) {
      if (montado.current && !controller.signal.aborted) {
        publicar({ carrito: null, cargando: false, error });
      }
    } finally {
      if (cargaActual.current === controller) cargaActual.current = null;
    }
  }, [publicar]);

  useEffect(() => {
    montado.current = true;
    let vigente = true;
    // StrictMode limpia el primer efecto antes de esta microtarea: una sola carga útil.
    queueMicrotask(() => { if (vigente) void cargarCarrito(); });
    return () => {
      vigente = false;
      montado.current = false;
      cargaActual.current?.abort();
      cargaActual.current = null;
    };
  }, [cargarCarrito]);

  const ejecutar = useCallback((operacion, ...argumentos) => {
    if (!montado.current) throw new Error('El proveedor del carrito no está montado.');
    const actual = estadoActual.current;
    if (actual.cargando || !actual.carrito) {
      throw new Error('El carrito todavía no está disponible.');
    }
    // Si el servicio rechaza, no se publica ningún cambio ni resultado de éxito.
    const carrito = operacion(actual.carrito, ...argumentos);
    if (carrito !== actual.carrito) publicar({ carrito, cargando: false, error: null });
    return { exito: true, carrito };
  }, [publicar]);

  const operaciones = useMemo(() => ({
    agregarProducto: ({ producto, cantidad }) => ({
      ...ejecutar(carritoService.agregarProducto, producto, cantidad), agregado: true,
    }),
    modificarCantidad: ({ itemId, producto, cantidad }) => ejecutar(carritoService.modificarCantidad, itemId, producto, cantidad),
    eliminarProducto: (itemId) => ejecutar(carritoService.eliminarProducto, itemId),
    vaciarCarrito: () => ejecutar(carritoService.vaciarCarrito),
  }), [ejecutar]);

  const valor = useMemo(() => ({ ...estado, ...operaciones, reintentarCarga: cargarCarrito }), [estado, operaciones, cargarCarrito]);
  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
