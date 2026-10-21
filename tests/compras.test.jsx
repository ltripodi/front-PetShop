// Pruebas del historial y detalle de compras en un DOM real, servidas por Vite sin dependencias de testing.
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import App from '../src/App';
import { CarritoProvider } from '../src/context/CarritoContext';
import CompraDetalle from '../src/pages/CompraDetalle';
import CompraList from '../src/pages/CompraList';
import { checkout, reiniciarComprasSimuladas } from '../src/services/comprasService';
import {
  comprobar, contenedor, control, ejecutarPruebas, elegir, escribir, esperar, fallaHasta, iguales, leerDatos, pulsar, simularFetch as simularDatos, titulo,
} from './utilidades';

const [compras, productos, carrito] = await Promise.all([leerDatos('compras.json'), leerDatos('productos.json'), leerDatos('carrito.json')]);
const producto = (id) => productos.find((actual) => actual.id === id);
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const pruebas = [];
let root;
let navegar;

// Responde con copias de los JSON reales. Cada URL puede reemplazarse por datos o por una función.
function simularFetch(respuestas = {}) {
  simularDatos({ '/data/compras.json': compras, '/data/productos.json': productos, '/data/carrito.json': carrito, ...respuestas });
}

function CapturarNavegacion() {
  const navigate = useNavigate();
  useLayoutEffect(() => { navegar = navigate; }, [navigate]);
  return null;
}

async function montar(ruta, { aplicacion = false } = {}) {
  if (aplicacion) window.history.replaceState(null, '', ruta);
  root = createRoot(contenedor);
  await act(async () => {
    root.render(
      <StrictMode>
        {aplicacion ? <CarritoProvider><App /></CarritoProvider> : (
          <MemoryRouter initialEntries={[ruta]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CapturarNavegacion />
            <Routes>
              <Route path="/compras" element={<CompraList />} />
              <Route path="/compras/:id" element={<CompraDetalle />} />
              <Route path="/productos/:id" element={<h1>Detalle del producto</h1>} />
            </Routes>
          </MemoryRouter>
        )}
      </StrictMode>,
    );
  });
}

async function desmontar() {
  if (root) await act(async () => { root.unmount(); });
  root = null;
}

const tarjetas = () => [...contenedor.querySelectorAll('[aria-label="Historial de compras"] h2')].map((actual) => actual.textContent);
const contador = () => contenedor.querySelector('[aria-label="Compras"] [role="status"]')?.textContent;
const lineas = () => [...contenedor.querySelectorAll('[aria-label="Productos de la compra"] li')];

function prueba(nombre, ejecutar) { pruebas.push({ nombre, ejecutar }); }

const todas = ['Compra #8', 'Compra #7', 'Compra #6', 'Compra #5', 'Compra #4', 'Compra #3', 'Compra #2', 'Compra #1'];
const totalDe = (lista) => pesos.format(lista.reduce((total, compra) => total + Math.round(compra.total * 100), 0) / 100);

prueba('Historial: sólo compras del usuario, de la más reciente a la más antigua, con resumen y productos', async () => {
  const deOtroUsuario = { ...structuredClone(compras[0]), id: 50, usuarioId: 2 };
  simularFetch({ '/data/compras.json': [...compras, deOtroUsuario] });
  await montar('/compras');
  await esperar(() => tarjetas().length > 0, 'No se cargó el historial.');
  iguales(tarjetas(), todas, 'Orden o contenido del historial.');
  comprobar(contador() === `8 de 8 compras · Total ${totalDe(compras)}`, `Contador incorrecto: ${contador()}`);
  const tarjeta2 = control('Ver detalle de la compra 2').closest('article');
  comprobar(tarjeta2.textContent.includes('4 productos · 5 unidades'), 'Faltan productos y unidades de la compra 2.');
  comprobar(tarjeta2.textContent.includes('Alimento balanceado para gato, Correa de paseo ajustable y 2 productos más'), 'Falta el resumen de productos.');
  comprobar(tarjeta2.querySelector('time').getAttribute('datetime') === '2026-09-24T09:45:00', 'Falta la fecha de la compra.');
  comprobar(tarjeta2.querySelector('time').textContent.includes('09:45'), 'La hora debe usar formato de 24 horas.');
  comprobar(control('Ver detalle de la compra 2').getAttribute('href') === '/compras/2', 'El enlace al detalle es incorrecto.');
});

prueba('Consulta: busca por producto o número de compra y combina con el mes', async () => {
  simularFetch();
  await montar('/compras');
  await esperar(() => tarjetas().length === 8, 'No se cargó el historial.');
  await escribir('Buscar compras', '  RASCADOR ');
  iguales(tarjetas(), ['Compra #8', 'Compra #7'], 'Búsqueda por producto.');
  comprobar(contador().startsWith('2 de 8 compras'), `Contador incorrecto: ${contador()}`);
  await escribir('Buscar compras', '#3');
  iguales(tarjetas(), ['Compra #3'], 'Búsqueda por número con #.');
  await escribir('Buscar compras', '3');
  iguales(tarjetas(), ['Compra #3'], 'Búsqueda por número sin #.');
  await escribir('Buscar compras', '');
  await elegir('Mes', 'Septiembre de 2026');
  iguales(tarjetas(), ['Compra #3', 'Compra #2', 'Compra #1'], 'Filtro por mes.');
  comprobar(contador() === `3 de 8 compras · Total ${totalDe(compras.filter(({ id }) => id <= 3))}`, `Total filtrado incorrecto: ${contador()}`);
  await escribir('Buscar compras', 'pelota');
  iguales(tarjetas(), ['Compra #2'], 'Búsqueda combinada con mes.');
});

prueba('Consulta: ordena por fecha o total y Limpiar filtros restablece la vista inicial', async () => {
  simularFetch();
  await montar('/compras');
  await esperar(() => tarjetas().length === 8, 'No se cargó el historial.');
  const consulta = contenedor.querySelector('[aria-label="Consulta de compras"]');
  comprobar(control('Limpiar filtros', consulta).disabled, 'Limpiar filtros debe empezar deshabilitado.');
  await elegir('Ordenar por', 'Mayor total');
  iguales(tarjetas(), ['Compra #8', 'Compra #1', 'Compra #2', 'Compra #6', 'Compra #3', 'Compra #5', 'Compra #4', 'Compra #7'], 'Orden por mayor total.');
  await elegir('Ordenar por', 'Menor total');
  iguales(tarjetas(), ['Compra #7', 'Compra #4', 'Compra #5', 'Compra #3', 'Compra #6', 'Compra #2', 'Compra #1', 'Compra #8'], 'Orden por menor total.');
  await elegir('Ordenar por', 'Más antiguas');
  iguales(tarjetas(), [...todas].reverse(), 'Orden por más antiguas.');
  await elegir('Mes', 'Octubre de 2026');
  await pulsar('Limpiar filtros', consulta);
  iguales(tarjetas(), todas, 'Limpiar filtros no restableció el orden y el mes.');
  comprobar(control('Limpiar filtros', consulta).disabled, 'Limpiar filtros debe quedar deshabilitado.');
});

prueba('Consulta sin resultados: mensaje y botón para limpiar', async () => {
  simularFetch();
  await montar('/compras');
  await esperar(() => tarjetas().length === 8, 'No se cargó el historial.');
  await escribir('Buscar compras', 'collar');
  comprobar(tarjetas().length === 0 && contenedor.textContent.includes('No encontramos compras'), 'Falta el estado sin resultados.');
  comprobar(contador().startsWith('0 de 8 compras'), `Contador incorrecto: ${contador()}`);
  await pulsar('Limpiar filtros', contenedor.querySelector('[aria-label="Compras"]'));
  iguales(tarjetas(), todas, 'No se restableció el historial.');
});

prueba('Historial vacío y error de carga con Reintentar', async () => {
  simularFetch({ '/data/compras.json': [] });
  await montar('/compras');
  await esperar(() => contenedor.textContent.includes('Todavía no tenés compras'), 'Falta el estado vacío.');
  comprobar(!contenedor.querySelector('[aria-label="Consulta de compras"]'), 'Sin compras no deben mostrarse filtros.');
  comprobar(control('Explorar productos').getAttribute('href') === '/productos', 'El estado vacío debe llevar al catálogo.');
  await desmontar();

  let fallar = true;
  simularFetch({ '/data/compras.json': fallaHasta(() => fallar, compras) });
  await montar('/compras');
  await esperar(() => contenedor.textContent.includes('No pudimos cargar las compras'), 'Falta el error de carga.');
  fallar = false;
  await pulsar('Reintentar');
  await esperar(() => tarjetas().length === 8, 'Reintentar no recuperó el historial.');
});

prueba('Detalle: líneas con enlace e imagen del producto, precio actual distinto y resumen', async () => {
  simularFetch();
  await montar('/compras/1');
  await esperar(() => titulo() === 'Compra #1', 'No se cargó el detalle.');
  const [perro, snack] = lineas();
  comprobar(lineas().length === 2, 'La compra 1 tiene dos líneas.');
  comprobar(control(producto(101).nombre).getAttribute('href') === '/productos/101', 'Falta el enlace al producto.');
  comprobar(perro.textContent.includes(`2 × ${pesos.format(22900)}`) && perro.textContent.includes(pesos.format(45800)), 'Precio o subtotal de la línea incorrectos.');
  await esperar(() => perro.querySelector('img'), 'No se mostró la imagen del catálogo.');
  comprobar(perro.querySelector('img').getAttribute('src') === producto(101).imagenes[0].ubicacion, 'Imagen incorrecta.');
  comprobar(perro.textContent.includes(`Precio actual: ${pesos.format(24500)}`), 'Debe informar el precio actual cuando cambió.');
  comprobar(!snack.textContent.includes('Precio actual'), 'No debe informar el precio actual si no cambió.');
  const resumen = contenedor.querySelector('aside');
  comprobar(resumen.textContent.includes('Unidades3') && resumen.textContent.includes(pesos.format(52050)), 'Resumen incorrecto.');
  comprobar(contenedor.querySelector('time').getAttribute('datetime') === '2026-09-21T20:10:00' && contenedor.querySelector('time').textContent.includes('20:10'), 'Fecha incorrecta.');
  await pulsar(producto(101).nombre);
  comprobar(titulo() === 'Detalle del producto', 'El enlace no navegó al producto.');
});

prueba('Detalle: IDs inválidos o inexistentes muestran "Compra no encontrada" sin Reintentar', async () => {
  for (const ruta of ['/compras/abc', '/compras/999', '/compras/0', '/compras/1.5']) {
    simularFetch();
    await montar(ruta);
    await esperar(() => titulo() === 'Compra no encontrada', `No informó la compra inexistente: ${ruta}`);
    comprobar(![...contenedor.querySelectorAll('button')].some((boton) => boton.textContent === 'Reintentar'), `No debe ofrecer Reintentar: ${ruta}`);
    comprobar(control('← Mis compras').getAttribute('href') === '/compras', 'Falta volver al historial.');
    await desmontar();
  }
});

prueba('Detalle: error de conexión con Reintentar; sin catálogo se muestra igual', async () => {
  let fallar = true;
  simularFetch({ '/data/compras.json': fallaHasta(() => fallar, compras), '/data/productos.json': fallaHasta(() => true, productos) });
  await montar('/compras/2');
  await esperar(() => contenedor.textContent.includes('No pudimos cargar el detalle de la compra'), 'Falta el error de carga.');
  fallar = false;
  await pulsar('Reintentar');
  await esperar(() => titulo() === 'Compra #2', 'Reintentar no recuperó el detalle.');
  comprobar(lineas().length === 4 && contenedor.querySelectorAll('[aria-label="Productos de la compra"] img').length === 0, 'Sin catálogo deben mostrarse las líneas con imagen genérica.');
});

prueba('Detalle: al pasar a otra compra no muestra datos de la anterior mientras carga', async () => {
  simularFetch();
  await montar('/compras/1');
  await esperar(() => titulo() === 'Compra #1', 'No se cargó el detalle.');
  let liberar;
  simularFetch({ '/data/compras.json': () => new Promise((resolver) => { liberar = () => resolver({ ok: true, json: async () => structuredClone(compras) }); }) });
  await act(async () => { navegar('/compras/2'); });
  await esperar(() => liberar, 'No se consultó la nueva compra.');
  comprobar(!contenedor.textContent.includes('Compra #1') && contenedor.querySelector('[aria-label="Cargando detalle de compra"]'), 'Siguió mostrando la compra anterior.');
  await act(async () => { liberar(); });
  await esperar(() => titulo() === 'Compra #2', 'No se cargó la nueva compra.');
});

prueba('Integración con la App: menú Compras → detalle → producto de Sol → volver al historial', async () => {
  simularFetch();
  await montar('/', { aplicacion: true });
  await pulsar('Compras', contenedor.querySelector('[aria-label="Navegación principal"]'));
  await esperar(() => tarjetas().length === 8, 'El menú no llevó al historial.');
  comprobar(control('Compras', contenedor.querySelector('[aria-label="Navegación principal"]')).classList.contains('active'), 'El menú debe marcar Compras.');
  await pulsar('Ver detalle de la compra 8');
  await esperar(() => titulo() === 'Compra #8', 'No navegó al detalle.');
  comprobar(window.location.pathname === '/compras/8', 'La URL del detalle es incorrecta.');
  await pulsar(producto(104).nombre);
  await esperar(() => titulo() === producto(104).nombre, 'No se abrió el detalle del producto.');
  comprobar(window.location.pathname === '/productos/104' && contenedor.textContent.includes('Agregar al carrito'), 'No se integró con el detalle de producto.');
  await act(async () => { window.history.back(); });
  await esperar(() => titulo() === 'Compra #8', 'Volver atrás no regresó al detalle.');
  await pulsar('← Mis compras');
  await esperar(() => tarjetas().length === 8 && window.location.pathname === '/compras', 'No volvió al historial.');
});

prueba('Integración con el checkout simulado: la compra nueva aparece primera y tiene detalle', async () => {
  simularFetch();
  const compra = await checkout(structuredClone(carrito));
  await montar('/compras');
  await esperar(() => tarjetas().length === 9, 'La compra nueva no aparece en el historial.');
  comprobar(tarjetas()[0] === `Compra #${compra.id}`, 'La compra nueva debe ser la primera.');
  comprobar(contador() === `9 de 9 compras · Total ${totalDe([...compras, compra])}`, `Contador incorrecto: ${contador()}`);
  await pulsar(`Ver detalle de la compra ${compra.id}`);
  await esperar(() => titulo() === `Compra #${compra.id}`, 'No se abrió el detalle de la compra nueva.');
  comprobar(lineas().length === carrito.items.length && contenedor.querySelector('aside').textContent.includes(pesos.format(compra.total)), 'Detalle de la compra nueva incorrecto.');
});

await ejecutarPruebas(pruebas, {
  nombre: 'Compras',
  limpiar: async () => {
    await desmontar();
    reiniciarComprasSimuladas();
  },
});
