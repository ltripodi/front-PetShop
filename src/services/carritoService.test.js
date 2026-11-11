import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiError,
  addToCart,
  clearCart,
  getCarrito,
  removeFromCart,
  updateCartItem,
} from './carritoService.js';

const carrito = {
  id: 8,
  usuarioId: 3,
  items: [{
    id: 12,
    productoId: 44,
    productoNombre: 'Alimento premium',
    precioUnitario: 125.5,
    cantidad: 2,
    subtotal: 251,
  }],
  total: 251,
  actualizadoEn: '2026-11-11T10:30:00',
};

function respuesta(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

test('getCarrito consulta el endpoint persistido y respeta AbortSignal', async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/carrito/3');
    assert.equal(options.method, 'GET');
    assert.equal(options.signal, controller.signal);
    return respuesta(carrito);
  });

  assert.deepEqual(await getCarrito(3, { signal: controller.signal }), carrito);
  assert.equal(mock.mock.calls.length, 1);
});

test('addToCart envía sólo productoId y cantidad, y publica el CarritoResponse del backend', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/carrito/3/items');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { productoId: 44, cantidad: 2 });
    return respuesta(carrito);
  });

  assert.deepEqual(await addToCart(3, 44, 2), carrito);
});

test('actualizar, eliminar y vaciar usan los verbos y rutas del controller', async (t) => {
  const llamadas = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    llamadas.push({ url, method: options.method, body: options.body });
    return respuesta(carrito);
  });

  await updateCartItem(3, 12, 1);
  await removeFromCart(3, 12);
  await clearCart(3);

  assert.deepEqual(llamadas, [
    { url: '/api/carrito/3/items/12', method: 'PUT', body: JSON.stringify({ cantidad: 1 }) },
    { url: '/api/carrito/3/items/12', method: 'DELETE', body: undefined },
    { url: '/api/carrito/3', method: 'DELETE', body: undefined },
  ]);
});

test('conserva el mensaje de error de la API', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => respuesta({ message: 'Stock insuficiente para Alimento premium.' }, { ok: false, status: 400 }));

  await assert.rejects(addToCart(3, 44, 2), (error) => (
    error instanceof ApiError
    && error.status === 400
    && error.message === 'Stock insuficiente para Alimento premium.'
  ));
});

test('valida los parámetros antes de llamar al backend', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => respuesta(carrito));

  assert.throws(() => getCarrito(0), TypeError);
  assert.throws(() => addToCart(3, '44', 1), TypeError);
  assert.throws(() => updateCartItem(3, 12, 0), TypeError);
  assert.throws(() => removeFromCart(3, null), TypeError);
  assert.equal(mock.mock.calls.length, 0);
});

test('rechaza respuestas que no respetan CarritoResponse', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => respuesta({ ...carrito, items: [{ ...carrito.items[0], cantidad: 0 }] }));

  await assert.rejects(getCarrito(3), /cantidad/);
});
