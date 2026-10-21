// Pruebas del checkout sobre la App real, con CarritoProvider y datos simulados. Servidas por Vite sin dependencias de testing.
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { CarritoProvider } from '../src/context/CarritoContext';
import useCarrito from '../src/hooks/useCarrito';
import { checkout, getCompras, reiniciarComprasSimuladas } from '../src/services/comprasService';
import {
  comprobar, contenedor, control, ejecutarPruebas, esperar, existeControl, fallaHasta, leerDatos, pulsar, simularFetch as simularDatos, titulo,
} from './utilidades';

const [compras, productos, carrito] = await Promise.all([leerDatos('compras.json'), leerDatos('productos.json'), leerDatos('carrito.json')]);
const producto = (id) => productos.find((actual) => actual.id === id);
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const pruebas = [];
let root;
let contextoCarrito;

function simularFetch(respuestas = {}) {
  simularDatos({ '/data/compras.json': compras, '/data/productos.json': productos, '/data/carrito.json': carrito, ...respuestas });
}

function respuesta(datos) {
  return { ok: true, json: async () => structuredClone(datos) };
}

function catalogoCon(cambios) {
  return productos.filter((actual) => cambios[actual.id] !== null).map((actual) => ({ ...actual, ...cambios[actual.id] }));
}

function ObservarCarrito() {
  const contexto = useCarrito();
  useLayoutEffect(() => { contextoCarrito = contexto; }, [contexto]);
  return null;
}

async function montar(ruta) {
  window.history.replaceState(null, '', ruta);
  root = createRoot(contenedor);
  await act(async () => {
    root.render(
      <StrictMode>
        <CarritoProvider>
          <ObservarCarrito />
          <App />
        </CarritoProvider>
      </StrictMode>,
    );
  });
}

const items = () => [...contenedor.querySelectorAll('[aria-label="Productos a comprar"] > li')];
const item = (id) => items().find((actual) => actual.textContent.includes(producto(id).nombre));
const resumen = () => contenedor.querySelector('aside')?.textContent ?? '';
const confirmar = () => control('Confirmar compra');
const navegacion = () => contenedor.querySelector('[aria-label="Navegación principal"]');

async function abrirCheckoutVerificado() {
  await montar('/checkout');
  await esperar(() => items().length > 0 && existeControl('Confirmar compra') && !confirmar().disabled, 'El checkout no quedó listo para confirmar.');
}

function prueba(nombre, ejecutar) { pruebas.push({ nombre, ejecutar }); }

prueba('Revisión: ítems del carrito, resumen y confirmación habilitada recién al verificar el stock', async () => {
  let liberar;
  simularFetch({ '/data/productos.json': () => new Promise((resolver) => { liberar = () => resolver(respuesta(productos)); }) });
  await montar('/checkout');
  await esperar(() => items().length === 3 && liberar, 'No se mostraron los ítems del carrito.');
  comprobar(titulo() === 'Revisá tu compra', 'Título incorrecto.');
  comprobar(confirmar().disabled && resumen().includes('Verificando stock y precios'), 'No debe confirmar antes de verificar el stock.');
  await act(async () => { liberar(); });
  await esperar(() => !confirmar().disabled, 'No se habilitó la confirmación.');
  comprobar(resumen().includes('Tu compra') && resumen().includes('Productos3') && resumen().includes('Unidades6') && resumen().includes(pesos.format(75100)), `Resumen incorrecto: ${resumen()}`);
  comprobar(item(101).querySelector('img')?.getAttribute('src') === producto(101).imagenes[0].ubicacion, 'Falta la imagen del catálogo.');
  comprobar(control('Modificar carrito').getAttribute('href') === '/carrito' && control('← Volver al carrito').getAttribute('href') === '/carrito', 'Faltan los accesos al carrito.');
});

prueba('Confirmar registra la compra, vacía el carrito y muestra el resultado con acceso al detalle', async () => {
  simularFetch();
  await abrirCheckoutVerificado();
  const entradas = window.history.length;
  await pulsar('Confirmar compra');
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'No se mostró la confirmación.');
  comprobar(window.location.pathname === '/checkout/confirmada/9', `URL incorrecta: ${window.location.pathname}`);
  // El resultado reemplaza al checkout en el historial del navegador: volver atrás no permite confirmar de nuevo.
  comprobar(window.history.length === entradas, 'La confirmación debe reemplazar la entrada del checkout.');
  comprobar(contenedor.textContent.includes('Registramos la compra #9') && contenedor.querySelector('time'), 'Falta el número o la fecha de la compra.');
  comprobar(contenedor.querySelectorAll('[aria-label="Productos de la compra"] li').length === 3, 'La confirmación debe listar las tres líneas.');
  comprobar(resumen().includes('Compra #9') && resumen().includes(pesos.format(75100)), `Resumen incorrecto: ${resumen()}`);
  comprobar(contextoCarrito.carrito.items.length === 0 && contextoCarrito.carrito.total === 0, 'El carrito debe quedar vacío.');
  const historial = await getCompras({ usuarioId: carrito.usuarioId });
  comprobar(historial.length === 9 && historial[0].id === 9 && historial[0].total === 75100, 'La compra no quedó registrada en el historial.');
  await pulsar('Ver detalle de la compra');
  await esperar(() => titulo() === 'Compra #9', 'No se abrió el detalle de la compra.');
  await act(async () => { window.history.back(); });
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'Volver atrás desde el detalle debe mostrar el resultado.');
});

prueba('Doble clic en Confirmar envía una sola confirmación y registra una sola compra', async () => {
  // Cada llamada a checkout() lee el historial una vez: así se cuentan las confirmaciones enviadas.
  let lecturasHistorial = 0;
  simularFetch({ '/data/compras.json': async () => { lecturasHistorial += 1; return respuesta(compras); } });
  await abrirCheckoutVerificado();
  await act(async () => {
    confirmar().click();
    confirmar().click();
  });
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'No se mostró la confirmación.');
  comprobar(lecturasHistorial === 1, `La pantalla envió ${lecturasHistorial} confirmaciones.`);
  comprobar((await getCompras()).length === 9, 'Se registró más de una compra.');
});

prueba('Carrito vacío: estado vacío sin botón de confirmar', async () => {
  simularFetch({ '/data/carrito.json': { ...carrito, items: [], total: 0 } });
  await montar('/checkout');
  await esperar(() => contenedor.textContent.includes('No hay productos para comprar'), 'Falta el estado vacío.');
  comprobar(!existeControl('Confirmar compra'), 'No debe ofrecer confirmar.');
  comprobar(control('Ver productos').getAttribute('href') === '/productos' && control('Ver mis compras').getAttribute('href') === '/compras', 'Faltan los accesos del estado vacío.');
});

prueba('Valida stock, disponibilidad y existencia de cada producto antes de confirmar', async () => {
  simularFetch({ '/data/productos.json': catalogoCon({ 101: { stock: 1 }, 104: { disponible: false }, 108: null }) });
  await montar('/checkout');
  await esperar(() => items().length === 3 && contenedor.textContent.includes('Hay productos que no se pueden comprar'), 'Falta el aviso de productos con problemas.');
  comprobar(item(101).textContent.includes('Stock insuficiente: queda 1 unidad.'), 'Falta el aviso de stock insuficiente.');
  comprobar(item(104).textContent.includes('Este producto no está disponible.'), 'Falta el aviso de producto no disponible.');
  comprobar(items()[2].textContent.includes('Este producto ya no está en el catálogo.'), 'Falta el aviso de producto inexistente.');
  comprobar(confirmar().disabled, 'No debe permitir confirmar.');
  comprobar(control('Ir al carrito').getAttribute('href') === '/carrito', 'Falta el acceso para corregir el carrito.');
  await desmontarYReiniciar();

  simularFetch({ '/data/productos.json': catalogoCon({ 104: { stock: 0 } }) });
  await montar('/checkout');
  await esperar(() => item(104)?.textContent.includes('Este producto no tiene stock.'), 'Falta el aviso de producto sin stock.');
  comprobar(confirmar().disabled, 'No debe permitir confirmar sin stock.');
});

prueba('Precio vigente distinto: avisa y confirma con el total actualizado, como el backend', async () => {
  simularFetch({ '/data/productos.json': catalogoCon({ 101: { precio: 26000 } }) });
  await abrirCheckoutVerificado();
  comprobar(contenedor.textContent.includes('Cambió el precio de algunos productos'), 'Falta el aviso de precios.');
  comprobar(item(101).textContent.includes(`Precio vigente: ${pesos.format(26000)} c/u.`), 'Falta el precio vigente en el ítem.');
  comprobar(resumen().includes(pesos.format(78100)), `El total debe usar el precio vigente: ${resumen()}`);
  await pulsar('Confirmar compra');
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'No se mostró la confirmación.');
  comprobar(resumen().includes(pesos.format(78100)), 'La compra debe registrarse con el precio vigente.');
});

prueba('Si el stock cambia al confirmar: informa el error del backend, no registra y conserva el carrito', async () => {
  let consultas = 0;
  const sinStock = catalogoCon({ 104: { stock: 0 } });
  simularFetch({ '/data/productos.json': async () => { consultas += 1; return respuesta(consultas === 1 ? productos : sinStock); } });
  await abrirCheckoutVerificado();
  await pulsar('Confirmar compra');
  await esperar(() => contenedor.textContent.includes('Stock insuficiente para Rascador compacto para gato. Disponible: 0. No se registró la compra.'), 'Falta el error de stock.');
  comprobar(window.location.pathname === '/checkout' && contextoCarrito.carrito.items.length === 3, 'El carrito debe conservarse.');
  comprobar((await getCompras()).length === 8, 'No debe registrarse la compra.');
  await esperar(() => item(104).textContent.includes('Este producto no tiene stock.') && confirmar().disabled, 'Debe volver a consultar el stock y marcar el producto.');
});

prueba('Error de conexión al confirmar: mensaje, carrito intacto y reintento exitoso', async () => {
  let fallar = true;
  simularFetch({ '/data/compras.json': fallaHasta(() => fallar, compras) });
  await abrirCheckoutVerificado();
  await pulsar('Confirmar compra');
  await esperar(() => contenedor.textContent.includes('No pudimos confirmar la compra'), 'Falta el error de conexión.');
  comprobar(contextoCarrito.carrito.items.length === 3 && !confirmar().disabled, 'Debe conservar el carrito y permitir reintentar.');
  fallar = false;
  await pulsar('Confirmar compra');
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'El reintento no confirmó la compra.');
});

prueba('Sin catálogo no se puede confirmar hasta reintentar la verificación', async () => {
  let fallar = true;
  simularFetch({ '/data/productos.json': fallaHasta(() => fallar, productos) });
  await montar('/checkout');
  await esperar(() => contenedor.textContent.includes('No pudimos verificar el stock'), 'Falta el aviso de catálogo.');
  comprobar(confirmar().disabled, 'No debe confirmar sin verificar.');
  fallar = false;
  await pulsar('Reintentar');
  await esperar(() => !confirmar().disabled && !contenedor.textContent.includes('No pudimos verificar el stock'), 'Reintentar no habilitó la confirmación.');
});

prueba('Error al cargar el carrito: Reintentar usa la recarga del Context', async () => {
  let fallar = true;
  simularFetch({ '/data/carrito.json': fallaHasta(() => fallar, carrito) });
  await montar('/checkout');
  await esperar(() => contenedor.textContent.includes('No pudimos cargar el carrito'), 'Falta el error del carrito.');
  fallar = false;
  await pulsar('Reintentar');
  await esperar(() => items().length === 3, 'Reintentar no cargó el carrito.');
});

prueba('Flujo integrado: detalle de producto → carrito → Finalizar compra → confirmación → carrito vacío → historial', async () => {
  simularFetch();
  await montar('/productos/102');
  await esperar(() => existeControl('Agregar al carrito') && !control('Agregar al carrito').disabled && contextoCarrito?.carrito, 'El detalle del producto no quedó listo.');
  await pulsar('Agregar al carrito');
  await esperar(() => contenedor.textContent.includes('Producto agregado al carrito.'), 'No se agregó el producto.');
  await pulsar('Carrito', navegacion());
  await esperar(() => contenedor.querySelectorAll('[aria-label="Productos en el carrito"] > li').length === 4, 'El carrito no muestra el producto agregado.');
  await pulsar('Finalizar compra');
  await esperar(() => window.location.pathname === '/checkout' && items().length === 4 && !confirmar().disabled, 'Finalizar compra no llevó al checkout.');
  comprobar(resumen().includes(pesos.format(75100 + producto(102).precio)), `Total incorrecto: ${resumen()}`);
  await pulsar('Confirmar compra');
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'No se mostró la confirmación.');
  comprobar(contenedor.querySelectorAll('[aria-label="Productos de la compra"] li').length === 4, 'La compra debe incluir el producto agregado.');
  await pulsar('Carrito', navegacion());
  await esperar(() => contenedor.textContent.includes('Tu carrito está vacío'), 'El carrito debe quedar vacío.');
  await pulsar('Compras', navegacion());
  await esperar(() => contenedor.querySelector('[aria-label="Historial de compras"] h2')?.textContent === 'Compra #9', 'La compra nueva debe encabezar el historial.');
  comprobar(contenedor.textContent.includes('9 de 9 compras'), 'El historial debe contar la compra nueva.');
});

prueba('El resultado sin datos de navegación (recarga o enlace directo) redirige al detalle del historial', async () => {
  simularFetch();
  const compra = await checkout(structuredClone(carrito));
  await montar(`/checkout/confirmada/${compra.id}`);
  await esperar(() => titulo() === `Compra #${compra.id}`, 'No redirigió al detalle de la compra.');
  comprobar(window.location.pathname === `/compras/${compra.id}`, `URL incorrecta: ${window.location.pathname}`);
  await desmontarYReiniciar();

  simularFetch();
  await montar('/checkout/confirmada/77');
  await esperar(() => titulo() === 'Compra no encontrada', 'Una compra inexistente debe informarse.');
});

async function desmontarYReiniciar() {
  if (root) await act(async () => { root.unmount(); });
  root = null;
  contextoCarrito = undefined;
  reiniciarComprasSimuladas();
}

await ejecutarPruebas(pruebas, { nombre: 'Checkout', limpiar: desmontarYReiniciar });
