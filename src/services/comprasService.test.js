import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkout, getCompraPorId, getCompras, reiniciarComprasSimuladas } from './comprasService.js';

const leer = async (archivo) => JSON.parse(await readFile(new URL(`../../public/data/${archivo}`, import.meta.url), 'utf8'));
const comprasIniciales = await leer('compras.json');
const productos = await leer('productos.json');
const carritoInicial = await leer('carrito.json');
const producto = (id) => productos.find((actual) => actual.id === id);
const centavos = (importe) => Math.round(importe * 100);

function congelar(valor) {
  Object.values(valor).forEach((hijo) => {
    if (hijo && typeof hijo === 'object') congelar(hijo);
  });
  return Object.freeze(valor);
}

congelar(comprasIniciales);
congelar(productos);
congelar(carritoInicial);

// Responde a las dos lecturas locales que usa el servicio y registra las solicitudes.
function simularFetch(t, { historial = comprasIniciales, catalogo = productos } = {}) {
  const solicitudes = [];
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    solicitudes.push({ url, opciones });
    if (url === '/data/compras.json') return { ok: true, json: async () => structuredClone(historial) };
    if (url === '/data/productos.json') return { ok: true, json: async () => structuredClone(catalogo) };
    throw new Error(`Solicitud inesperada: ${url}`);
  });
  return solicitudes;
}

function carritoCon(items) {
  return { ...structuredClone(carritoInicial), items };
}

function rechazaCon(nombre, patron) {
  return (error) => error.name === nombre && patron.test(error.message);
}

beforeEach(() => reiniciarComprasSimuladas());

test('el mock respeta CompraResponse: importes, IDs y productos coherentes con el catálogo', () => {
  const lineas = comprasIniciales.flatMap((compra) => compra.lineas);
  assert.ok(comprasIniciales.length >= 8, 'El mock debe permitir explorar el historial.');
  assert.equal(new Set(comprasIniciales.map(({ id }) => id)).size, comprasIniciales.length);
  assert.equal(new Set(lineas.map(({ id }) => id)).size, lineas.length);
  for (const compra of comprasIniciales) {
    assert.deepEqual(Object.keys(compra), ['id', 'usuarioId', 'realizadaEn', 'total', 'lineas']);
    assert.equal(centavos(compra.total), compra.lineas.reduce((total, linea) => total + centavos(linea.subtotal), 0), `Total de la compra ${compra.id}`);
    for (const linea of compra.lineas) {
      assert.deepEqual(Object.keys(linea), ['id', 'productoId', 'productoNombre', 'precioUnitario', 'cantidad', 'subtotal']);
      assert.equal(centavos(linea.precioUnitario) * linea.cantidad, centavos(linea.subtotal), `Subtotal de la línea ${linea.id}`);
      assert.equal(linea.productoNombre, producto(linea.productoId)?.nombre, `Producto de la línea ${linea.id}`);
      assert.ok(Date.parse(compra.realizadaEn) > Date.parse(producto(linea.productoId).publicadoEn), `La compra ${compra.id} es anterior a la publicación del producto.`);
    }
  }
  // IDs autoincrementales: una compra posterior tiene un ID mayor.
  const porId = [...comprasIniciales].sort((primera, segunda) => primera.id - segunda.id);
  porId.slice(1).forEach((compra, indice) => assert.ok(Date.parse(compra.realizadaEn) > Date.parse(porId[indice].realizadaEn)));
});

test('getCompras devuelve el mock de la más reciente a la más antigua y pasa AbortSignal', async (t) => {
  const solicitudes = simularFetch(t);
  const controller = new AbortController();
  const compras = await getCompras({ signal: controller.signal });
  assert.deepEqual(compras.map(({ id }) => id), [8, 7, 6, 5, 4, 3, 2, 1]);
  assert.equal(solicitudes[0].url, '/data/compras.json');
  assert.equal(solicitudes[0].opciones.signal, controller.signal);
});

test('getCompras filtra por usuarioId como el endpoint y rechaza IDs inválidos', async (t) => {
  const historial = [...comprasIniciales, { ...structuredClone(comprasIniciales[0]), id: 9, usuarioId: 2, lineas: [{ ...comprasIniciales[0].lineas[0], id: 99 }], total: 45800 }];
  simularFetch(t, { historial });
  assert.equal((await getCompras()).length, 9);
  assert.deepEqual((await getCompras({ usuarioId: 2 })).map(({ id }) => id), [9]);
  assert.equal((await getCompras({ usuarioId: 1 })).length, 8);
  assert.deepEqual(await getCompras({ usuarioId: 3 }), []);
  for (const usuarioId of [0, -1, 1.5, '1', NaN]) {
    await assert.rejects(getCompras({ usuarioId }), TypeError);
  }
});

test('getCompraPorId acepta el ID como texto de la ruta', async (t) => {
  simularFetch(t);
  assert.deepEqual(await getCompraPorId('3'), comprasIniciales.find(({ id }) => id === 3));
  assert.equal((await getCompraPorId(8)).total, 53880);
});

test('getCompraPorId trata IDs inválidos como compra inexistente sin consultar el historial', async (t) => {
  const solicitudes = simularFetch(t);
  for (const id of ['abc', '0', '-1', '1.5', '1e3', ' 1', '', '01', undefined, '99999999999999999999']) {
    await assert.rejects(getCompraPorId(id), rechazaCon('CompraNoEncontradaError', /No encontramos esa compra/), `ID ${id}`);
  }
  assert.equal(solicitudes.length, 0);
  await assert.rejects(getCompraPorId('999'), rechazaCon('CompraNoEncontradaError', /No encontramos esa compra/));
});

test('rechaza HTTP de error antes de leer JSON y propaga la cancelación', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ({ ok: false, json: () => assert.fail('No debe leer JSON') }));
  await assert.rejects(getCompras(), /No se pudo cargar el historial de compras/);
  mock.mock.restore();
  const cancelacion = new DOMException('Cancelado', 'AbortError');
  t.mock.method(globalThis, 'fetch', async () => { throw cancelacion; });
  await assert.rejects(getCompraPorId('1'), (error) => error === cancelacion);
});

test('rechaza historiales con DTOs incompletos, importes inconsistentes o compras duplicadas', async (t) => {
  const [primera, segunda] = comprasIniciales;
  const invalidos = [
    {},
    [null],
    [{ ...primera, lineas: undefined }],
    [{ ...primera, realizadaEn: 'ayer' }],
    [{ ...primera, total: primera.total + 1 }],
    [{ ...primera, lineas: [{ ...primera.lineas[0], subtotal: 1 }, primera.lineas[1]] }],
    [{ ...primera, lineas: [{ ...primera.lineas[0], productoNombre: ' ' }, primera.lineas[1]] }],
    [primera, { ...segunda, id: primera.id }],
  ];
  for (const historial of invalidos) {
    const mock = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => historial }));
    await assert.rejects(getCompras(), TypeError);
    mock.mock.restore();
  }
});

test('checkout crea la compra con el precio vigente, la suma al historial y no modifica el carrito', async (t) => {
  simularFetch(t);
  const carrito = carritoCon([
    ...carritoInicial.items.slice(0, 2),
    // Precio desactualizado en el carrito: el backend usa el del producto.
    { ...carritoInicial.items[2], precioUnitario: 1000, subtotal: 3000 },
  ]);
  congelar(carrito);
  const compra = await checkout(carrito);
  assert.deepEqual(Object.keys(compra), ['id', 'usuarioId', 'realizadaEn', 'total', 'lineas']);
  assert.equal(compra.id, 9);
  assert.equal(compra.usuarioId, carritoInicial.usuarioId);
  assert.match(compra.realizadaEn, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  assert.ok(Math.abs(Date.parse(compra.realizadaEn) - Date.now()) < 5000);
  assert.deepEqual(compra.lineas, [
    { id: 18, productoId: 101, productoNombre: 'Alimento premium para perro adulto', precioUnitario: 24500, cantidad: 2, subtotal: 49000 },
    { id: 19, productoId: 104, productoNombre: 'Rascador compacto para gato', precioUnitario: 15900, cantidad: 1, subtotal: 15900 },
    { id: 20, productoId: 108, productoNombre: 'Pelota liviana para gato', precioUnitario: 3400, cantidad: 3, subtotal: 10200 },
  ]);
  assert.equal(compra.total, 75100);

  const historial = await getCompras({ usuarioId: carrito.usuarioId });
  assert.equal(historial.length, 9);
  assert.deepEqual(historial[0], compra);
  assert.deepEqual(await getCompraPorId(String(compra.id)), compra);

  compra.lineas.length = 0;
  assert.equal((await getCompraPorId('9')).lineas.length, 3, 'El historial no debe compartir referencias con el resultado.');

  reiniciarComprasSimuladas();
  assert.equal((await getCompras()).length, 8);
});

test('checkout repite las validaciones del backend y no registra compras parciales', async (t) => {
  const catalogo = productos.map((actual) => (actual.id === 104 ? { ...actual, stock: 0 } : actual));
  simularFetch(t, { catalogo });
  const [item101, item104] = carritoInicial.items;
  const casos = [
    [carritoCon([]), 'CarritoVacioError', /al menos un producto/],
    [carritoCon([item101, { ...item104, productoId: 999 }]), 'RecursoNoEncontradoError', /No existe el producto con id: 999/],
    [carritoCon([item101, { ...item104, productoId: 107, productoNombre: 'Snack dental para perro' }]), 'ProductoNoDisponibleError', /Snack dental para perro no está disponible/],
    [carritoCon([{ ...item101, cantidad: 19 }]), 'StockInsuficienteError', /Alimento premium para perro adulto\. Disponible: 18/],
    [carritoCon([item101, item104]), 'StockInsuficienteError', /Rascador compacto para gato\. Disponible: 0/],
    [carritoCon([{ ...item101, cantidad: 0 }]), 'DatosInvalidosError', /mayor a 0/],
  ];
  for (const [carrito, nombre, patron] of casos) {
    await assert.rejects(checkout(carrito), rechazaCon(nombre, patron), nombre);
  }
  for (const invalido of [null, {}, { ...carritoInicial, usuarioId: 0 }, carritoCon([null])]) {
    await assert.rejects(checkout(invalido), TypeError);
  }
  assert.equal((await getCompras()).length, 8);
});

test('checkout no permite confirmar dos veces el mismo carrito, ni siquiera en simultáneo', async (t) => {
  simularFetch(t);
  const carrito = carritoCon(structuredClone(carritoInicial.items));
  const resultados = await Promise.allSettled([checkout(carrito), checkout(carrito)]);
  assert.deepEqual(resultados.map(({ status }) => status).sort(), ['fulfilled', 'rejected']);
  assert.equal(resultados.find(({ status }) => status === 'rejected').reason.name, 'CarritoVacioError');
  await assert.rejects(checkout(carrito), rechazaCon('CarritoVacioError', /al menos un producto/));

  // Un carrito nuevo, como el que publica el Context al volver a agregar productos, sí se puede comprar.
  const [primera, segunda] = await Promise.all([checkout(carritoCon([carritoInicial.items[0]])), checkout(carritoCon([carritoInicial.items[1]]))]);
  assert.deepEqual([primera.id, segunda.id].sort(), [10, 11]);
  assert.equal(new Set([...primera.lineas, ...segunda.lineas].map(({ id }) => id)).size, 2);
  assert.equal((await getCompras()).length, 11);
});
