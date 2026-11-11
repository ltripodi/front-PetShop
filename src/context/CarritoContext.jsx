import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { Provider, useDispatch, useSelector, useStore } from 'react-redux';
import CarritoBootstrap from '../components/carrito/CarritoBootstrap';
import {
  agregarProducto as agregarProductoAction,
  cargarCarrito,
  eliminarProducto as eliminarProductoAction,
  modificarCantidad as modificarCantidadAction,
  selectCargandoCarrito,
  selectCarrito,
  selectErrorCarrito,
  vaciarCarrito as vaciarCarritoAction,
} from '../store/carritoSlice';
import { crearStore } from '../store/store';

// Se conserva esta API para los consumidores existentes. El estado real vive
// ahora en Redux; este Context sólo adapta la interfaz anterior.
export const CarritoContext = createContext(undefined);

function CarritoContextBridge({ children }) {
  const dispatch = useDispatch();
  const store = useStore();
  const carrito = useSelector(selectCarrito);
  const cargando = useSelector(selectCargandoCarrito);
  const errorRedux = useSelector(selectErrorCarrito);
  const montado = useRef(false);
  const error = useMemo(() => (
    errorRedux ? new Error(errorRedux.message ?? 'No se pudo cargar el carrito.') : null
  ), [errorRedux]);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const ejecutar = useCallback((accion) => {
    if (!montado.current) {
      throw new Error('El proveedor del carrito no está montado.');
    }
    if (cargando || !carrito) {
      throw new Error('El carrito todavía no está disponible.');
    }
    dispatch(accion);
    return { exito: true, carrito: store.getState().carrito.carrito };
  }, [carrito, cargando, dispatch, store]);

  const reintentarCarga = useCallback(() => {
    if (!montado.current) {
      return Promise.reject(new Error('El proveedor del carrito no está montado.'));
    }
    return dispatch(cargarCarrito());
  }, [dispatch]);

  const valor = useMemo(() => ({
    carrito,
    cargando,
    error,
    reintentarCarga,
    agregarProducto: ({ producto, cantidad }) => ({
      ...ejecutar(agregarProductoAction({ producto, cantidad })),
      agregado: true,
    }),
    modificarCantidad: ({ itemId, producto, cantidad }) => ejecutar(modificarCantidadAction({ itemId, producto, cantidad })),
    eliminarProducto: (itemId) => ejecutar(eliminarProductoAction(itemId)),
    vaciarCarrito: () => ejecutar(vaciarCarritoAction()),
  }), [carrito, cargando, ejecutar, error, reintentarCarga]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function CarritoProvider({ children }) {
  // Cada montaje obtiene su propio store para que esta capa de compatibilidad
  // mantenga el mismo aislamiento que tenía el proveedor anterior.
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = crearStore();

  return (
    <Provider store={storeRef.current}>
      <CarritoBootstrap>
        <CarritoContextBridge>{children}</CarritoContextBridge>
      </CarritoBootstrap>
    </Provider>
  );
}
