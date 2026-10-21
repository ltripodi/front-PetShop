// Recorridos de punta a punta sobre la App real: integran catálogo, detalle de producto, carrito,
// checkout e historial con los datos simulados. Servidas por Vite sin dependencias de testing.
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { CarritoProvider } from '../src/context/CarritoContext';
import useCarrito from '../src/hooks/useCarrito';
import { getCompras, reiniciarComprasSimuladas } from '../src/services/comprasService';
import {
  comprobar, contenedor, control, ejecutarPruebas, escribir, esperar, existeControl, iguales, leerDatos, pulsar, simularFetch as simularDatos, titulo,
} from './utilidades';

const [compras, productos, carrito] = await Promise.all([leerDatos('compras.json'), leerDatos('productos.json'), leerDatos('carrito.json')]);
const producto = (id) => productos.find((actual) => actual.id === id);
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const pruebas = [];
let root;
let contextoCarrito;

function simularFetch() {
  simularDatos({ '/data/compras.json': compras, '/data/productos.json': productos, '/data/carrito.json': carrito });
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

async function desmontar() {
  if (root) await act(async () => { root.unmount(); });
  root = null;
  contextoCarrito = undefined;
  reiniciarComprasSimuladas();
}

const navegacion = () => contenedor.querySelector('[aria-label="Navegación principal"]');
const tarjetasCatalogo = () => contenedor.querySelectorAll('[aria-label="Productos"] a[aria-label^="Ver detalle de"]').length;
const grupo = (nombre) => [...contenedor.querySelectorAll('[role="group"]')].find((actual) => actual.getAttribute('aria-label') === `Acciones para ${nombre}`);
const itemsCarrito = () => contenedor.querySelectorAll('[aria-label="Productos en el carrito"] > li').length;
const itemsCheckout = () => contenedor.querySelectorAll('[aria-label="Productos a comprar"] > li').length;
const tarjetas = () => [...contenedor.querySelectorAll('[aria-label="Historial de compras"] h2')].map((actual) => actual.textContent);
const resumen = () => contenedor.querySelector('aside')?.textContent ?? '';

async function agregarDesdeDetalle(id, cantidad = 1) {
  await esperar(() => titulo() === producto(id).nombre && existeControl('Agregar al carrito') && !control('Agregar al carrito').disabled && contextoCarrito?.carrito, `El detalle del producto ${id} no quedó listo.`);
  for (let unidades = 1; unidades < cantidad; unidades += 1) await pulsar('Aumentar cantidad');
  await pulsar('Agregar al carrito');
  await esperar(() => contenedor.textContent.includes('Producto agregado al carrito.'), `No se agregó el producto ${id}.`);
}

async function confirmarDesdeCheckout() {
  await esperar(() => window.location.pathname === '/checkout' && itemsCheckout() > 0 && !control('Confirmar compra').disabled, 'El checkout no quedó listo.');
  await pulsar('Confirmar compra');
  await esperar(() => titulo() === '¡Gracias por tu compra!', 'No se mostró la confirmación.');
}

function prueba(nombre, ejecutar) { pruebas.push({ nombre, ejecutar }); }

prueba('Recorrido completo: inicio → catálogo con búsqueda → detalle → carrito con cambios → checkout → historial → detalle → producto', async () => {
  simularFetch();
  await montar('/');
  await pulsar('Explorar productos →');
  await esperar(() => tarjetasCatalogo() === productos.length, 'No se cargó el catálogo.');

  // Catálogo (Barza) → detalle (Sol) → agregar dos unidades (Fede).
  await escribir('Buscar productos', 'cama');
  await esperar(() => tarjetasCatalogo() === 1, 'La búsqueda del catálogo no filtró.');
  await pulsar(`Ver detalle de ${producto(106).nombre}`);
  await agregarDesdeDetalle(106, 2);

  // Carrito (Bauti) con las operaciones de Fede: bajar una cantidad y eliminar un producto.
  await pulsar('Carrito', navegacion());
  await esperar(() => itemsCarrito() === 4 && grupo(producto(108).nombre) && !control('Disminuir cantidad', grupo(producto(108).nombre)).disabled, 'El carrito no quedó listo para editar.');
  await pulsar('Disminuir cantidad', grupo(producto(108).nombre));
  await pulsar(`Eliminar ${producto(104).nombre}`);
  const total = 2 * producto(101).precio + 2 * producto(108).precio + 2 * producto(106).precio;
  await esperar(() => itemsCarrito() === 3 && contextoCarrito.carrito.total === total, 'El carrito no refleja los cambios.');

  // Checkout (punto 6) con el carrito modificado.
  await pulsar('Finalizar compra');
  await esperar(() => itemsCheckout() === 3 && resumen().includes(pesos.format(total)), 'El checkout no refleja el carrito modificado.');
  await confirmarDesdeCheckout();
  comprobar(resumen().includes('Compra #9') && resumen().includes(pesos.format(total)) && resumen().includes('Unidades6'), `Resultado incorrecto: ${resumen()}`);

  // Historial (punto 7): la compra nueva encabeza la lista y se puede consultar.
  await pulsar('Ver mis compras');
  await esperar(() => tarjetas().length === compras.length + 1, 'El historial no incluye la compra nueva.');
  comprobar(tarjetas()[0] === 'Compra #9', 'La compra nueva debe ser la primera.');
  await escribir('Buscar compras', 'cama');
  iguales(tarjetas(), ['Compra #9', 'Compra #5'], 'La búsqueda del historial debe encontrar la compra nueva.');
  await pulsar('Ver detalle de la compra 9');
  await esperar(() => titulo() === 'Compra #9', 'No se abrió el detalle de la compra nueva.');
  comprobar(contenedor.querySelectorAll('[aria-label="Productos de la compra"] li').length === 3, 'El detalle debe tener tres líneas.');
  await pulsar(producto(106).nombre);
  await esperar(() => titulo() === producto(106).nombre, 'El enlace no abrió el detalle del producto.');

  await pulsar('Carrito', navegacion());
  await esperar(() => contenedor.textContent.includes('Tu carrito está vacío'), 'El carrito debe quedar vacío después de comprar.');
});

prueba('Dos compras en la misma sesión: IDs consecutivos, carrito vacío entre ambas y ambas en el historial', async () => {
  simularFetch();
  await montar('/carrito');
  await esperar(() => itemsCarrito() === carrito.items.length, 'No se cargó el carrito.');
  await pulsar('Finalizar compra');
  await confirmarDesdeCheckout();

  await pulsar('Seguir comprando');
  await esperar(() => window.location.pathname === '/productos', 'No volvió al catálogo.');
  await pulsar(`Ver detalle de ${producto(103).nombre}`);
  await agregarDesdeDetalle(103);
  await pulsar('Carrito', navegacion());
  await esperar(() => itemsCarrito() === 1, 'El carrito debe tener sólo el producto nuevo.');
  await pulsar('Finalizar compra');
  await confirmarDesdeCheckout();
  comprobar(resumen().includes('Compra #10') && resumen().includes(pesos.format(producto(103).precio)), `Segunda compra incorrecta: ${resumen()}`);

  const historial = await getCompras({ usuarioId: carrito.usuarioId });
  iguales(historial.slice(0, 2).map(({ id }) => id), [10, 9], 'Las dos compras nuevas deben encabezar el historial.');
  const lineas = historial.flatMap(({ lineas: actuales }) => actuales.map(({ id }) => id));
  comprobar(new Set(lineas).size === lineas.length, 'Los IDs de las líneas deben ser únicos.');

  await act(async () => { window.history.pushState(null, '', '/checkout'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await esperar(() => contenedor.textContent.includes('No hay productos para comprar'), 'El checkout debe quedar vacío después de comprar.');
});

prueba('Todas las rutas cargan por URL directa con su título', async () => {
  const rutas = [
    ['/', 'Todo para su mundo, en un solo lugar.'],
    ['/productos', 'Todo para ellos'],
    ['/productos/101', producto(101).nombre],
    ['/carrito', 'Tu carrito'],
    ['/checkout', 'Revisá tu compra'],
    ['/compras', 'Mis compras'],
    ['/compras/1', 'Compra #1'],
    ['/gestion-productos', 'Gestión de productos'],
    ['/ui-kit', 'UI Kit'],
    ['/una-ruta-inexistente', 'Página no encontrada'],
  ];
  for (const [ruta, esperado] of rutas) {
    simularFetch();
    await montar(ruta);
    await esperar(() => titulo() === esperado, `La ruta ${ruta} no mostró "${esperado}" (mostró "${titulo()}").`);
    comprobar(contenedor.querySelectorAll('h1').length === 1, `La ruta ${ruta} debe tener un único h1.`);
    await desmontar();
  }
});

await ejecutarPruebas(pruebas, { nombre: 'Flujo de compra', limpiar: desmontar });
