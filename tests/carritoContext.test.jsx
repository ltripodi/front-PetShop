// Pruebas de integración en un DOM real, servidas por Vite sin dependencias de testing.
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { CarritoProvider } from '../src/context/CarritoContext';
import useCarrito from '../src/hooks/useCarrito';
import Carrito from '../src/pages/Carrito';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const fetchOriginal = globalThis.fetch;
const inicial = await (await fetchOriginal('/data/carrito.json')).json();
const productos = await (await fetchOriginal('/data/productos.json')).json();
const producto = (id) => productos.find((actual) => actual.id === id);
const contenedor = document.getElementById('pruebas');
const resultados = document.getElementById('resultados');
const pruebas = [];
let root;
let primero;
let segundo;
let navegar;
let solicitudes;
let lecturas;

function comprobar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function rechaza(operacion, patron) {
  try { operacion(); } catch (error) {
    comprobar(patron.test(error.message), `Error inesperado: ${error.message}`);
    return;
  }
  throw new Error('La operación debía rechazar.');
}

function Consumidor({ segundoConsumidor = false }) {
  const contexto = useCarrito();
  const navigate = useNavigate();
  useLayoutEffect(() => {
    if (segundoConsumidor) segundo = contexto;
    else {
      primero = contexto;
      navegar = navigate;
      lecturas.push(contexto);
    }
  }, [contexto, navigate, segundoConsumidor]);
  return null;
}

function simularFetch(resolver = async () => ({ ok: true, json: async () => structuredClone(inicial) })) {
  solicitudes = [];
  globalThis.fetch = async (url, opciones) => {
    if (url === '/data/carrito.json') {
      solicitudes.push(opciones);
      return resolver(opciones);
    }
    if (url === '/data/productos.json') throw new Error('Catálogo inaccesible');
    throw new Error(`Solicitud inesperada: ${url}`);
  };
}

async function montar({ pantalla = false } = {}) {
  primero = undefined;
  segundo = undefined;
  lecturas = [];
  root = createRoot(contenedor);
  await act(async () => {
    root.render(
      <StrictMode>
        <CarritoProvider>
          <MemoryRouter initialEntries={['/carrito']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Consumidor />
            <Consumidor segundoConsumidor />
            {pantalla && <Routes>
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/otra" element={<p>Otra pantalla de prueba</p>} />
            </Routes>}
          </MemoryRouter>
        </CarritoProvider>
      </StrictMode>,
    );
  });
}

function prueba(nombre, ejecutar) { pruebas.push({ nombre, ejecutar }); }

prueba('Carga inicial única bajo StrictMode y dos consumidores comparten estado', async () => {
  simularFetch();
  await montar();
  comprobar(solicitudes.length === 1, 'StrictMode duplicó la carga efectiva.');
  comprobar(lecturas.some((estado) => estado.cargando && estado.carrito === null), 'Falta estado de carga.');
  comprobar(primero === segundo, 'Los consumidores no comparten el mismo valor.');
  comprobar(primero.carrito.total === 75100 && !primero.cargando && primero.error === null, 'Carga inicial incorrecta.');
  comprobar(solicitudes[0].signal instanceof AbortSignal, 'Falta AbortSignal.');
});

prueba('Agregar devuelve agregado: true y dos llamadas consecutivas no pierden cambios', async () => {
  simularFetch();
  await montar();
  let resultado;
  await act(async () => {
    const agregar = primero.agregarProducto;
    agregar({ producto: producto(101), cantidad: 1 });
    resultado = agregar({ producto: producto(101), cantidad: 1 });
  });
  comprobar(resultado.agregado === true && resultado.exito === true, 'Contrato de éxito incorrecto.');
  comprobar(primero === segundo && primero.carrito === resultado.carrito, 'Estado compartido desactualizado.');
  comprobar(primero.carrito.items[0].cantidad === 4 && primero.carrito.total === 124100, 'Se perdió una operación.');
  comprobar(primero.carrito.items.length === 3, 'Producto duplicado.');
});

prueba('Modificar cantidades y eliminar usan las reglas y resultados del servicio', async () => {
  simularFetch();
  await montar();
  await act(async () => {
    const modificado = primero.modificarCantidad({ itemId: 2, producto: producto(104), cantidad: 2 });
    comprobar(modificado.exito && modificado.carrito.total === 91000, 'Modificación incorrecta.');
    const eliminado = primero.eliminarProducto(3);
    comprobar(eliminado.exito && eliminado.carrito.total === 80800, 'Eliminación incorrecta.');
  });
  comprobar(primero.carrito.total === 80800 && segundo.carrito === primero.carrito, 'No se propagaron cambios.');
});

prueba('Operaciones rechazadas conservan referencia, total y fecha', async () => {
  simularFetch();
  await montar();
  const anterior = primero.carrito;
  await act(async () => {
    rechaza(() => primero.agregarProducto({ producto: producto(101), cantidad: 17 }), /Stock insuficiente/);
    rechaza(() => primero.agregarProducto({ producto: producto(107), cantidad: 1 }), /no está disponible/);
    rechaza(() => primero.modificarCantidad({ itemId: 2, producto: producto(104), cantidad: 0 }), /cantidad/);
    rechaza(() => primero.eliminarProducto(108), /no existe/);
  });
  comprobar(primero.carrito === anterior && segundo.carrito === anterior, 'Se modificó un carrito rechazado.');
});

prueba('Carrito muestra productos y puede vaciarse aunque falle el catálogo', async () => {
  simularFetch();
  await montar({ pantalla: true });
  comprobar(contenedor.textContent.includes('Alimento premium para perro adulto'), 'No muestra los productos.');
  comprobar(contenedor.textContent.includes('Resumen'), 'No muestra el resumen.');
  await act(async () => { primero.eliminarProducto(3); });
  comprobar(primero.carrito.total === 64900, 'Eliminar depende del catálogo.');
  await act(async () => { primero.vaciarCarrito(); });
  comprobar(primero.carrito.total === 0 && primero.carrito.items.length === 0, 'Vaciado incorrecto.');
  comprobar(contenedor.textContent.includes('Tu carrito está vacío'), 'No representa el carrito vacío.');
});

prueba('Estado editado persiste al desmontar y remontar Carrito por navegación', async () => {
  simularFetch();
  await montar({ pantalla: true });
  await act(async () => { primero.vaciarCarrito(); });
  const editado = primero.carrito;
  await act(async () => { navegar('/otra'); });
  comprobar(contenedor.textContent.includes('Otra pantalla de prueba'), 'La navegación no cambió la pantalla.');
  await act(async () => { navegar('/carrito'); });
  comprobar(contenedor.textContent.includes('Tu carrito está vacío'), 'Se perdió el estado al navegar.');
  comprobar(primero.carrito === editado && solicitudes.length === 1, 'Se volvió a cargar el carrito.');
  await act(async () => { await primero.reintentarCarga(); });
  comprobar(primero.carrito === editado && solicitudes.length === 1, 'Reintentar sobrescribió el estado editado.');
});

prueba('Error de inicialización se muestra y Reintentar recupera el carrito', async () => {
  let intentos = 0;
  simularFetch(async () => ({ ok: ++intentos > 1, json: async () => structuredClone(inicial) }));
  await montar({ pantalla: true });
  comprobar(primero.error instanceof Error && !primero.cargando, 'Error de carga no expuesto.');
  comprobar(contenedor.textContent.includes('No pudimos cargar el carrito'), 'Falta mensaje de error.');
  rechaza(() => primero.vaciarCarrito(), /todavía no está disponible/);
  const reintentar = [...contenedor.querySelectorAll('button')].find((boton) => boton.textContent === 'Reintentar');
  comprobar(reintentar, 'Falta botón Reintentar.');
  await act(async () => { reintentar.click(); });
  comprobar(primero.error === null && primero.carrito.total === 75100, 'Reintento fallido.');
  comprobar(contenedor.textContent.includes('Resumen'), 'La pantalla no se recuperó.');
});

prueba('Carga pendiente bloquea operaciones y no duplica reintentos', async () => {
  let resolver;
  simularFetch(() => new Promise((resolve) => { resolver = resolve; }));
  await montar({ pantalla: true });
  comprobar(contenedor.querySelector('[aria-label="Cargando carrito"]'), 'Falta indicador de carga.');
  rechaza(() => primero.agregarProducto({ producto: producto(101), cantidad: 1 }), /todavía no está disponible/);
  await act(async () => { await primero.reintentarCarga(); });
  comprobar(solicitudes.length === 1, 'Reintento concurrente duplicado.');
  await act(async () => { resolver({ ok: true, json: async () => structuredClone(inicial) }); });
  comprobar(primero.carrito.total === 75100, 'La carga pendiente no se completó.');
});

prueba('Desmontaje aborta fetch e ignora respuestas tardías incluso si fetch no respeta la señal', async () => {
  let resolver;
  simularFetch(() => new Promise((resolve) => { resolver = resolve; }));
  await montar();
  const operacionesAnteriores = primero;
  const cantidadLecturas = lecturas.length;
  await act(async () => { root.unmount(); });
  root = null;
  comprobar(solicitudes[0].signal.aborted, 'No se canceló la carga.');
  await act(async () => { resolver({ ok: true, json: async () => structuredClone(inicial) }); });
  comprobar(lecturas.length === cantidadLecturas, 'Se publicó después de desmontar.');
  rechaza(() => operacionesAnteriores.vaciarCarrito(), /no está montado/);
  await operacionesAnteriores.reintentarCarga().then(
    () => { throw new Error('No debe cargar después de desmontar.'); },
    (error) => comprobar(/no está montado/.test(error.message), 'Error de desmontaje inesperado.'),
  );
});

prueba('Rechazo tardío después de desmontar tampoco publica errores', async () => {
  let rechazar;
  simularFetch(() => new Promise((resolve, reject) => { rechazar = reject; }));
  await montar();
  const cantidadLecturas = lecturas.length;
  await act(async () => { root.unmount(); });
  root = null;
  await act(async () => { rechazar(new Error('Error tardío')); });
  comprobar(lecturas.length === cantidadLecturas && solicitudes[0].signal.aborted, 'Se publicó un error tardío.');
});

prueba('Hook fuera del proveedor informa un error claro', () => {
  rechaza(() => renderToString(<Consumidor />), /useCarrito debe utilizarse dentro de CarritoProvider/);
});

let aprobadas = 0;
const salida = [];
for (const { nombre, ejecutar } of pruebas) {
  try {
    await ejecutar();
    aprobadas += 1;
    salida.push(`OK: ${nombre}`);
  } catch (error) {
    salida.push(`ERROR: ${nombre}\n${error.stack}`);
  } finally {
    if (root) await act(async () => { root.unmount(); });
    root = null;
    globalThis.fetch = fetchOriginal;
  }
  resultados.textContent = `${aprobadas}/${pruebas.length} aprobadas\n\n${salida.join('\n')}`;
}
document.title = `${aprobadas}/${pruebas.length} — CarritoContext`;
