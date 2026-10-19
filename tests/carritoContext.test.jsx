// Pruebas de integración en un DOM real, servidas por Vite sin dependencias de testing.
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { CarritoProvider } from '../src/context/CarritoContext';
import useCarrito from '../src/hooks/useCarrito';
import Carrito from '../src/pages/Carrito';
import App from '../src/App';
import CarritoActions from '../src/components/carrito/CarritoActions';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const fetchOriginal = globalThis.fetch;
const inicial = await (await fetchOriginal('/data/carrito.json')).json();
const productos = await (await fetchOriginal('/data/productos.json')).json();
const producto = (id) => productos.find((actual) => actual.id === id);
const contenedor = document.getElementById('pruebas');
const resultados = document.getElementById('resultados');
const urlPruebas = window.location.href;
const pruebas = [];
let root;
let primero;
let segundo;
let navegar;
let solicitudes;
let consultasCatalogo;
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

function simularFetch(resolver = async () => ({ ok: true, json: async () => structuredClone(inicial) }), catalogo = null) {
  solicitudes = [];
  consultasCatalogo = [];
  globalThis.fetch = async (url, opciones) => {
    if (url === '/data/carrito.json') {
      solicitudes.push(opciones);
      return resolver(opciones);
    }
    if (url === '/data/productos.json') {
      consultasCatalogo.push(opciones);
      if (!catalogo) throw new Error('Catálogo inaccesible');
      if (typeof catalogo === 'function') return catalogo(opciones);
      return { ok: true, json: async () => structuredClone(catalogo) };
    }
    throw new Error(`Solicitud inesperada: ${url}`);
  };
}

function ObservarAplicacion() {
  const contexto = useCarrito();
  useLayoutEffect(() => { primero = contexto; }, [contexto]);
  return null;
}

async function montar({ pantalla = false, aplicacion = false, ruta = '/carrito' } = {}) {
  primero = undefined;
  segundo = undefined;
  lecturas = [];
  if (aplicacion) window.history.replaceState(null, '', ruta);
  root = createRoot(contenedor);
  await act(async () => {
    root.render(
      <StrictMode>
        <CarritoProvider>
          {aplicacion ? <><ObservarAplicacion /><App /></> : <MemoryRouter initialEntries={['/carrito']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Consumidor />
            <Consumidor segundoConsumidor />
            {pantalla && <Routes>
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/otra" element={<p>Otra pantalla de prueba</p>} />
            </Routes>}
          </MemoryRouter>}
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

// Etapa 3: interacciones con los controles reales y con el router de App.
const catalogoSinImagenes = productos.map((actual) => ({ ...actual, imagenes: [] }));

function boton(nombre, origen = contenedor) {
  const encontrado = [...origen.querySelectorAll('button')].find((actual) => (
    (actual.getAttribute('aria-label') ?? actual.textContent.trim()) === nombre
  ));
  comprobar(encontrado, `No se encontró el botón: ${nombre}`);
  return encontrado;
}

async function pulsar(nombre, origen = contenedor) {
  const actual = boton(nombre, origen);
  comprobar(!actual.disabled, `El botón está deshabilitado: ${nombre}`);
  await act(async () => { actual.click(); });
}

function grupoProducto(productoId) {
  const nombre = `Acciones para ${producto(productoId).nombre}`;
  const grupo = [...contenedor.querySelectorAll('[role="group"]')].find((actual) => actual.getAttribute('aria-label') === nombre);
  comprobar(grupo, `Falta el grupo de acciones del producto ${productoId}`);
  return grupo;
}

prueba('Etapa 3: App conecta el botón de Sol, acumula unidades y conserva el estado al navegar', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ aplicacion: true, ruta: '/productos/101' });
  await pulsar('Agregar al carrito');
  comprobar(contenedor.textContent.includes('Producto agregado al carrito.'), 'No confirmó el agregado.');
  comprobar(primero.carrito.items[0].cantidad === 3 && primero.carrito.total === 99600, 'No acumuló la cantidad.');
  const editado = primero.carrito;
  const enlace = contenedor.querySelector('a[href="/carrito"]');
  comprobar(enlace, 'Falta el enlace al carrito.');
  await act(async () => { enlace.click(); });
  comprobar(contenedor.textContent.includes('Tu carrito') && contenedor.textContent.includes('Cantidad: 3'), 'No mostró el carrito editado.');
  comprobar(primero.carrito === editado && solicitudes.length === 1, 'Perdió el estado al navegar.');
});

prueba('Etapa 3: agregar desde el detalle un producto nuevo crea un solo ítem', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ aplicacion: true, ruta: '/productos/102' });
  await pulsar('Agregar al carrito');
  const agregado = primero.carrito.items.find((item) => item.productoId === 102);
  comprobar(agregado?.cantidad === 1 && primero.carrito.items.length === 4, 'No creó el ítem esperado.');
  comprobar(primero.carrito.total === 94090, 'Total incorrecto.');
});

prueba('Etapa 3: dos clics durante el mismo agregado no duplican la operación', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ aplicacion: true, ruta: '/productos/101' });
  const agregar = boton('Agregar al carrito');
  await act(async () => { agregar.click(); agregar.click(); });
  comprobar(primero.carrito.items[0].cantidad === 3 && primero.carrito.total === 99600, 'Se duplicó la operación en curso.');
});

prueba('Etapa 3: el detalle rechaza stock acumulado insuficiente sin confirmar éxito ni mutar estado', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ aplicacion: true, ruta: '/productos/101' });
  for (let cantidad = 1; cantidad < 17; cantidad += 1) await pulsar('Aumentar cantidad');
  const anterior = primero.carrito;
  await pulsar('Agregar al carrito');
  comprobar(primero.carrito === anterior && primero.carrito.total === 75100, 'Cambió el carrito rechazado.');
  comprobar(contenedor.textContent.includes('No se pudo completar la operación.'), 'No mostró el error existente de Sol.');
  comprobar(!contenedor.textContent.includes('Producto agregado al carrito.'), 'Confirmó un agregado rechazado.');
});

prueba('Etapa 3: el selector modifica por item.id, actualiza importes y consulta el catálogo una sola vez', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ pantalla: true });
  comprobar(consultasCatalogo.length === 1, 'Duplicó consultas de catálogo para imágenes y stock.');
  await pulsar('Aumentar cantidad', grupoProducto(104));
  comprobar(primero.carrito.items[1].id === 2 && primero.carrito.items[1].cantidad === 2, 'Confundió item.id con productoId.');
  comprobar(primero.carrito.items[1].subtotal === 31800 && primero.carrito.total === 91000, 'No recalculó importes.');
  await pulsar('Disminuir cantidad', grupoProducto(104));
  comprobar(primero.carrito.total === 75100 && boton('Disminuir cantidad', grupoProducto(104)).disabled, 'Permite llegar a cero.');
});

prueba('Etapa 3: eliminar un ítem y vaciar desde los controles actualiza la pantalla', async () => {
  simularFetch(undefined, catalogoSinImagenes);
  await montar({ pantalla: true });
  await pulsar(`Eliminar ${producto(108).nombre}`);
  comprobar(primero.carrito.total === 64900 && primero.carrito.items.length === 2, 'Eliminó un ítem incorrecto.');
  comprobar(!contenedor.textContent.includes(producto(108).nombre), 'El ítem eliminado sigue visible.');
  await pulsar('Vaciar carrito');
  comprobar(primero.carrito.total === 0 && primero.carrito.items.length === 0, 'No vació el carrito.');
  comprobar(contenedor.textContent.includes('Tu carrito está vacío'), 'No muestra el estado vacío.');
});

prueba('Etapa 3: fallo del catálogo bloquea cantidades y mantiene eliminar y vaciar disponibles', async () => {
  simularFetch();
  await montar({ pantalla: true });
  comprobar(contenedor.textContent.includes('No pudimos cargar el catálogo.'), 'No informa el error del catálogo.');
  comprobar(boton('Aumentar cantidad', grupoProducto(101)).disabled, 'Permite editar sin validar stock.');
  comprobar(boton('Disminuir cantidad', grupoProducto(101)).disabled, 'Permite disminuir sin validar stock.');
  await pulsar(`Eliminar ${producto(108).nombre}`);
  comprobar(primero.carrito.total === 64900, 'Eliminar depende del catálogo.');
  await pulsar('Vaciar carrito');
  comprobar(contenedor.textContent.includes('Tu carrito está vacío'), 'Vaciar depende del catálogo.');
});

prueba('Etapa 3: producto ausente o no disponible bloquea cantidades sin impedir eliminar', async () => {
  const catalogo = catalogoSinImagenes.filter((actual) => actual.id !== 104).map((actual) => (
    actual.id === 101 ? { ...actual, disponible: false } : actual
  ));
  simularFetch(undefined, catalogo);
  await montar({ pantalla: true });
  comprobar(boton('Aumentar cantidad', grupoProducto(101)).disabled, 'Permite editar un producto no disponible.');
  comprobar(boton('Aumentar cantidad', grupoProducto(104)).disabled, 'Permite editar un producto ausente.');
  await pulsar(`Eliminar ${producto(104).nombre}`);
  comprobar(primero.carrito.items.length === 2 && primero.carrito.total === 59200, 'No pudo eliminar el producto ausente.');
});

prueba('Etapa 3: durante la carga del catálogo sólo se bloquea la edición de cantidades', async () => {
  let resolver;
  simularFetch(undefined, () => new Promise((resolve) => { resolver = resolve; }));
  await montar({ pantalla: true });
  comprobar(contenedor.textContent.includes('Consultando stock…'), 'No informa la carga del stock.');
  comprobar(boton('Aumentar cantidad', grupoProducto(101)).disabled, 'Edita sin haber cargado el catálogo.');
  await pulsar(`Eliminar ${producto(108).nombre}`);
  comprobar(primero.carrito.total === 64900 && !boton('Vaciar carrito').disabled, 'Bloqueó operaciones independientes del catálogo.');
  await act(async () => { resolver({ ok: true, json: async () => structuredClone(catalogoSinImagenes) }); });
  comprobar(!boton('Aumentar cantidad', grupoProducto(101)).disabled, 'No habilitó cantidades al cargar el catálogo.');
  comprobar(primero.carrito.total === 64900, 'La carga del catálogo sobrescribió el carrito.');
});

prueba('Etapa 3: el selector respeta el límite de stock y los cambios consecutivos', async () => {
  const catalogo = catalogoSinImagenes.map((actual) => actual.id === 101 ? { ...actual, stock: 3 } : actual);
  simularFetch(undefined, catalogo);
  await montar({ pantalla: true });
  await pulsar('Aumentar cantidad', grupoProducto(101));
  comprobar(primero.carrito.items[0].cantidad === 3 && boton('Aumentar cantidad', grupoProducto(101)).disabled, 'Permite superar el stock.');
  await pulsar('Disminuir cantidad', grupoProducto(101));
  await pulsar('Aumentar cantidad', grupoProducto(101));
  comprobar(primero.carrito.total === 99600, 'Perdió actualizaciones consecutivas.');
});

prueba('Etapa 3: errores de modificar, eliminar y vaciar se capturan en los controles', async () => {
  const fallar = (mensaje) => () => { throw new Error(mensaje); };
  root = createRoot(contenedor);
  await act(async () => {
    root.render(<CarritoActions item={inicial.items[0]} producto={producto(101)} modificarCantidad={fallar('Stock insuficiente simulado.')} eliminarProducto={fallar('No se pudo eliminar.')} />);
  });
  await pulsar('Aumentar cantidad');
  comprobar(contenedor.textContent.includes('Stock insuficiente simulado.'), 'No capturó error al modificar.');
  comprobar(contenedor.querySelector('output').textContent === '2', 'Cambió la cantidad tras fallar.');
  await pulsar(`Eliminar ${producto(101).nombre}`);
  comprobar(contenedor.textContent.includes('No se pudo eliminar.'), 'No capturó error al eliminar.');
  await act(async () => { root.render(<CarritoActions vaciarCarrito={fallar('No se pudo vaciar.')} />); });
  await pulsar('Vaciar carrito');
  comprobar(contenedor.textContent.includes('No se pudo vaciar.'), 'No capturó error al vaciar.');
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
    window.history.replaceState(null, '', urlPruebas);
  }
  resultados.textContent = `${aprobadas}/${pruebas.length} aprobadas\n\n${salida.join('\n')}`;
}
document.title = `${aprobadas}/${pruebas.length} — CarritoContext`;
