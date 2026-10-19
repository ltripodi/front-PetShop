import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getCarrito, agregarProducto, modificarCantidad, eliminarProducto, vaciarCarrito } from './carritoService.js';

const carritoInicial = JSON.parse(await readFile(new URL('../../public/data/carrito.json', import.meta.url), 'utf8'));
const productos = JSON.parse(await readFile(new URL('../../public/data/productos.json', import.meta.url), 'utf8'));
const producto = (id) => productos.find((actual) => actual.id === id);

function congelar(valor) {
  Object.values(valor).forEach((hijo) => {
    if (hijo && typeof hijo === 'object') congelar(hijo);
  });
  return Object.freeze(valor);
}

congelar(carritoInicial);
congelar(productos);

test('A: agregar una unidad del 101 suma cantidades y conserva el ID', () => {
  const resultado = agregarProducto(carritoInicial, producto(101), 1);
  assert.deepEqual(resultado.items[0], { ...carritoInicial.items[0], cantidad: 3, subtotal: 73500 });
  assert.equal(resultado.total, 99600);
});

test('B: agregar 17 unidades del 101 supera el stock acumulado y no modifica el carrito', () => {
  assert.throws(() => agregarProducto(carritoInicial, producto(101), 17), /Stock insuficiente/);
  assert.equal(carritoInicial.total, 75100);
  assert.equal(carritoInicial.items[0].cantidad, 2);
});

test('C: modificar el ítem 2 (producto 104) establece dos unidades absolutas', () => {
  const resultado = modificarCantidad(carritoInicial, 2, producto(104), 2);
  assert.equal(resultado.items[1].cantidad, 2);
  assert.equal(resultado.items[1].subtotal, 31800);
  assert.equal(resultado.total, 91000);
});

test('D: eliminar el ítem 3 (producto 108) mantiene los demás', () => {
  const resultado = eliminarProducto(carritoInicial, 3);
  assert.equal(resultado.total, 64900);
  assert.deepEqual(resultado.items, carritoInicial.items.slice(0, 2));
});

test('E: vaciar conserva la estructura, IDs del carrito y usuario', () => {
  const resultado = vaciarCarrito(carritoInicial);
  assert.deepEqual(resultado.items, []);
  assert.equal(resultado.total, 0);
  assert.equal(resultado.id, carritoInicial.id);
  assert.equal(resultado.usuarioId, carritoInicial.usuarioId);
  assert.deepEqual(Object.keys(resultado), Object.keys(carritoInicial));
});

test('F: el producto 107 no está disponible', () => {
  assert.throws(() => agregarProducto(carritoInicial, producto(107), 1), /no está disponible/);
  assert.throws(() => modificarCantidad(carritoInicial, 1, { ...producto(101), disponible: false }, 1), /no está disponible/);
});

test('G: marca null no impide agregar un producto válido', () => {
  const resultado = agregarProducto(vaciarCarrito(carritoInicial), producto(108), 1);
  assert.equal(resultado.items[0].productoId, 108);
  assert.equal(resultado.total, 3400);
});

test('H: agregar y modificar rechazan cantidades inválidas', () => {
  for (const cantidad of [0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '2', null, undefined]) {
    assert.throws(() => agregarProducto(carritoInicial, producto(101), cantidad), /cantidad/);
    assert.throws(() => modificarCantidad(carritoInicial, 1, producto(101), cantidad), /cantidad/);
  }
});

test('I: todas las operaciones funcionan con entradas congeladas sin mutarlas', () => {
  const copiaCarrito = structuredClone(carritoInicial);
  const copiaProductos = structuredClone(productos);
  for (const resultado of [
    agregarProducto(carritoInicial, producto(102), 1),
    modificarCantidad(carritoInicial, 1, producto(101), 1),
    eliminarProducto(carritoInicial, 1),
    vaciarCarrito(carritoInicial),
  ]) {
    assert.notEqual(resultado, carritoInicial);
    assert.notEqual(resultado.items, carritoInicial.items);
    assert.notEqual(resultado.actualizadoEn, carritoInicial.actualizadoEn);
    assert.ok(Number.isFinite(Date.parse(resultado.actualizadoEn)));
  }
  assert.deepEqual(carritoInicial, copiaCarrito);
  assert.deepEqual(productos, copiaProductos);
});

test('J: agregar repetidamente evita duplicados y conserva IDs existentes', () => {
  const primero = agregarProducto(carritoInicial, producto(101), 1);
  const segundo = agregarProducto(primero, producto(101), 1);
  assert.equal(segundo.items.length, 3);
  assert.equal(segundo.items[0].cantidad, 4);
  assert.deepEqual(segundo.items.map((item) => item.id), [1, 2, 3]);
});

test('nuevos ítems tienen IDs numéricos locales únicos y sólo campos del DTO', () => {
  const primero = agregarProducto(carritoInicial, producto(102), 1);
  const segundo = agregarProducto(primero, producto(103), 1);
  assert.equal(new Set(segundo.items.map((item) => item.id)).size, 5);
  assert.ok(segundo.items.every((item) => Number.isSafeInteger(item.id)));
  assert.deepEqual(Object.keys(segundo.items[3]), Object.keys(carritoInicial.items[0]));
});

test('K: centavos exactos en subtotales, acumulaciones, modificación y eliminación', () => {
  const conDiez = { ...producto(101), precio: 0.1 };
  const conVeinte = { ...producto(102), precio: 0.2 };
  const primero = agregarProducto(vaciarCarrito(carritoInicial), conDiez, 3);
  const segundo = agregarProducto(primero, conVeinte, 1);
  assert.equal(primero.items[0].subtotal, 0.3);
  assert.equal(segundo.total, 0.5);
  const tercero = modificarCantidad(segundo, primero.items[0].id, conDiez, 1);
  assert.equal(tercero.total, 0.3);
  assert.equal(eliminarProducto(tercero, segundo.items[1].id).total, 0.1);
  assert.equal(agregarProducto(tercero, conDiez, 1).total, 0.4);
});

test('precios con más de dos decimales se redondean al ingresar y cero es válido', () => {
  for (const [precio, esperado] of [[1.005, 1.01], [12.345, 12.35], [0, 0]]) {
    const resultado = agregarProducto(vaciarCarrito(carritoInicial), { ...producto(101), precio }, 2);
    assert.equal(resultado.items[0].precioUnitario, esperado);
    assert.equal(resultado.total, esperado * 2);
  }
});

test('regresión: 10.075 se redondea a 10.08 antes de multiplicar y acumular', () => {
  const actual = { ...producto(101), precio: 10.075 };
  const primero = agregarProducto(vaciarCarrito(carritoInicial), actual, 3);
  assert.equal(primero.items[0].precioUnitario, 10.08);
  assert.equal(primero.items[0].subtotal, 30.24);
  const segundo = agregarProducto(primero, actual, 1);
  assert.equal(segundo.total, 40.32);
  assert.equal(modificarCantidad(segundo, segundo.items[0].id, actual, 2).total, 20.16);
});

test('conserva precios con uno y dos decimales', () => {
  const vacio = vaciarCarrito(carritoInicial);
  for (const precio of [0, 0.1, 0.2, 0.29, 1.1, 1.01, 10.07, 10.08, 1234.56]) {
    const resultado = agregarProducto(vacio, { ...producto(101), precio }, 1);
    assert.equal(resultado.items[0].precioUnitario, precio);
    assert.equal(resultado.total, precio);
  }
});

test('redondea decimales adicionales y números expresados en notación científica', () => {
  const vacio = vaciarCarrito(carritoInicial);
  for (const [precio, esperado] of [
    [1.005, 1.01], [2.675, 2.68], [1.255, 1.26], [12.345, 12.35],
    [1.23456789, 1.23], [1.999, 2], [1000.005, 1000.01],
    [0.005, 0.01], [1e-7, 0], [Number.MIN_VALUE, 0],
  ]) {
    const resultado = agregarProducto(vacio, { ...producto(101), precio }, 1);
    assert.equal(resultado.total, esperado, `Precio: ${precio}`);
  }
});

test('distingue importes inmediatamente por debajo, en y por encima de la mitad del centavo', () => {
  const vacio = vaciarCarrito(carritoInicial);
  for (const [precio, esperado] of [
    [10.074999999999998, 10.07], [10.075, 10.08], [10.075000000000001, 10.08],
    [1.0049999999999997, 1], [1.005, 1.01], [1.0050000000000001, 1.01],
    [0.004999999999999999, 0], [0.005, 0.01], [0.005000000000000001, 0.01],
    [0.9949999999999999, 0.99], [0.995, 1], [0.9950000000000001, 1],
  ]) {
    assert.equal(agregarProducto(vacio, { ...producto(101), precio }, 1).total, esperado, `Precio: ${precio}`);
  }
});

test('contrasta todas las milésimas entre 0 y 20 con un resultado esperado calculado en enteros', () => {
  const vacio = vaciarCarrito(carritoInicial);
  for (let milesimas = 0; milesimas <= 20000; milesimas += 1) {
    const precio = Number(`${Math.floor(milesimas / 1000)}.${String(milesimas % 1000).padStart(3, '0')}`);
    const esperado = Math.floor((milesimas + 5) / 10) / 100;
    assert.equal(agregarProducto(vacio, { ...producto(101), precio }, 1).total, esperado, `Precio: ${precio}`);
  }
});

test('conserva precios y subtotales de todos los productos de los mocks actuales', () => {
  const vacio = vaciarCarrito(carritoInicial);
  for (const actual of productos.filter((item) => item.disponible)) {
    const resultado = agregarProducto(vacio, actual, 1);
    assert.equal(resultado.items[0].precioUnitario, actual.precio);
    assert.equal(resultado.items[0].subtotal, actual.precio);
    assert.equal(resultado.total, actual.precio);
  }
  // Se recalcula con una modificación real sin alterar las cantidades iniciales.
  const aumentado = agregarProducto(carritoInicial, producto(101), 1);
  const restaurado = modificarCantidad(aumentado, 1, producto(101), 2);
  assert.deepEqual(restaurado.items, carritoInicial.items);
  assert.equal(restaurado.total, 75100);
});

test('ítems existentes conservan el precio aunque cambie el catálogo', () => {
  const actualizado = { ...producto(101), precio: 1 };
  assert.equal(agregarProducto(carritoInicial, actualizado, 1).items[0].precioUnitario, 24500);
  assert.equal(modificarCantidad(carritoInicial, 1, actualizado, 1).items[0].subtotal, 24500);
});

test('rechaza productos ausentes, sin nombre o con identificador inválido', () => {
  for (const actual of [null, undefined, {}, { ...producto(101), nombre: '' }, ...[0, -1, 1.5, '101', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map((id) => ({ ...producto(101), id }))]) {
    assert.throws(() => agregarProducto(carritoInicial, actual, 1), TypeError);
  }
});

test('rechaza precios inválidos tanto al agregar como al modificar', () => {
  for (const precio of [-1, NaN, Infinity, -Infinity, '10', null, undefined]) {
    const actual = { ...producto(101), precio };
    assert.throws(() => agregarProducto(carritoInicial, actual, 1), /precio/);
    assert.throws(() => modificarCantidad(carritoInicial, 1, actual, 1), /precio/);
  }
});

test('valida stock, acumulación y disponibilidad estricta', () => {
  for (const stock of [-1, 1.5, NaN, Infinity, '18', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => agregarProducto(carritoInicial, { ...producto(101), stock }, 1), /stock/);
    assert.throws(() => modificarCantidad(carritoInicial, 1, { ...producto(101), stock }, 1), /stock/);
  }
  assert.throws(() => agregarProducto(carritoInicial, { ...producto(101), stock: 0 }, 1), /Stock insuficiente/);
  assert.throws(() => modificarCantidad(carritoInicial, 1, producto(101), 19), /Stock insuficiente/);
  assert.throws(() => agregarProducto(carritoInicial, { ...producto(101), disponible: 'true' }, 1), /disponible/);
  const resultado = agregarProducto(carritoInicial, producto(101), 16);
  assert.equal(resultado.items[0].cantidad, 18);
  const enorme = { ...producto(101), stock: Number.MAX_SAFE_INTEGER, precio: 0 };
  assert.throws(() => agregarProducto(carritoInicial, enorme, Number.MAX_SAFE_INTEGER), /cantidad/);
});

test('modificar y eliminar buscan item.id, y modificar exige el producto correspondiente', () => {
  assert.throws(() => modificarCantidad(carritoInicial, 104, producto(104), 2), /no existe/);
  assert.throws(() => eliminarProducto(carritoInicial, 108), /no existe/);
  assert.throws(() => modificarCantidad(carritoInicial, 1, producto(104), 2), /no corresponde/);
  assert.throws(() => eliminarProducto(carritoInicial, '3'), /identificador/);
});

test('operaciones sin modificación efectiva conservan referencia y fecha', () => {
  assert.equal(modificarCantidad(carritoInicial, 1, producto(101), 2), carritoInicial);
  const vacio = vaciarCarrito(carritoInicial);
  assert.equal(vaciarCarrito(vacio), vacio);
});

test('rechaza desbordamientos de precio, subtotal y total sin cambios parciales', () => {
  const vacio = vaciarCarrito(carritoInicial);
  assert.throws(() => agregarProducto(vacio, { ...producto(101), precio: Number.MAX_VALUE }, 1), /monetario/);
  const caro = { ...producto(101), precio: 50000000000000 };
  assert.throws(() => agregarProducto(vacio, caro, 2), /subtotal/);
  const primero = agregarProducto(vacio, caro, 1);
  assert.throws(() => agregarProducto(primero, { ...caro, id: 102 }, 1), /total/);
  assert.equal(primero.items.length, 1);
  assert.equal(primero.total, caro.precio);
});

test('getCarrito lee el mock y pasa AbortSignal a fetch', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.equal(url, '/data/carrito.json');
    assert.equal(opciones.signal, controller.signal);
    return { ok: true, json: async () => carritoInicial };
  });
  assert.deepEqual(await getCarrito({ signal: controller.signal }), carritoInicial);
});

test('getCarrito rechaza HTTP de error antes de leer JSON', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, json: () => assert.fail('No debe leer JSON') }));
  await assert.rejects(getCarrito(), /No se pudo cargar el carrito/);
});

test('getCarrito propaga errores de red, JSON y cancelación', async (t) => {
  for (const error of [new TypeError('Sin conexión'), new SyntaxError('JSON inválido'), new DOMException('Cancelado', 'AbortError')]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => { throw error; });
    await assert.rejects(getCarrito(), (recibido) => recibido === error);
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => { throw new SyntaxError('JSON inválido'); } }));
  await assert.rejects(getCarrito(), SyntaxError);
});

test('getCarrito y las operaciones rechazan DTOs incompletos o duplicados', async (t) => {
  const invalidos = [null, [], {}, { items: [] },
    { ...carritoInicial, total: NaN },
    { ...carritoInicial, actualizadoEn: '' },
    { ...carritoInicial, items: [null] },
    { ...carritoInicial, items: [{ ...carritoInicial.items[0], cantidad: 0 }] },
    { ...carritoInicial, items: [carritoInicial.items[0], carritoInicial.items[0]] },
    { ...carritoInicial, items: [carritoInicial.items[0], { ...carritoInicial.items[0], id: 4 }] },
    { ...carritoInicial, items: [carritoInicial.items[0], { ...carritoInicial.items[1], id: 1 }] },
  ];
  for (const carrito of invalidos) {
    const mock = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => carrito }));
    await assert.rejects(getCarrito(), TypeError);
    assert.throws(() => agregarProducto(carrito, producto(101), 1), TypeError);
    assert.throws(() => modificarCantidad(carrito, 1, producto(101), 1), TypeError);
    assert.throws(() => eliminarProducto(carrito, 1), TypeError);
    assert.throws(() => vaciarCarrito(carrito), TypeError);
    mock.mock.restore();
  }
});
