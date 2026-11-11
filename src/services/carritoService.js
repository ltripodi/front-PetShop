import { API_BASE_URL, authorizationHeaders } from './apiConfig.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function validarId(id, nombre = 'El identificador') {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError(`${nombre} debe ser un entero positivo seguro.`);
  }
}

function validarCantidad(cantidad) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new TypeError('La cantidad debe ser un entero positivo seguro.');
  }
}

function validarImporte(importe, nombre) {
  if (typeof importe !== 'number' || !Number.isFinite(importe) || importe < 0) {
    throw new TypeError(`${nombre} debe ser un importe no negativo.`);
  }
}

function validarCarrito(carrito) {
  if (!carrito || !Array.isArray(carrito.items)) {
    throw new TypeError('La respuesta del carrito debe incluir una lista de ítems.');
  }
  validarId(carrito.id, 'El id del carrito');
  validarId(carrito.usuarioId, 'El id del usuario');
  if (typeof carrito.actualizadoEn !== 'string' || Number.isNaN(Date.parse(carrito.actualizadoEn))) {
    throw new TypeError('El carrito debe incluir una fecha de actualización válida.');
  }
  validarImporte(carrito.total, 'El total');

  const items = new Set();
  const productos = new Set();
  carrito.items.forEach((item) => {
    if (!item || typeof item.productoNombre !== 'string' || !item.productoNombre.trim()) {
      throw new TypeError('Cada ítem debe incluir el nombre del producto.');
    }
    validarId(item.id, 'El id del ítem');
    validarId(item.productoId, 'El id del producto');
    validarCantidad(item.cantidad);
    validarImporte(item.precioUnitario, 'El precio unitario');
    validarImporte(item.subtotal, 'El subtotal');
    if (items.has(item.id) || productos.has(item.productoId)) {
      throw new TypeError('La respuesta del carrito contiene ítems duplicados.');
    }
    items.add(item.id);
    productos.add(item.productoId);
  });

  return carrito;
}

async function cuerpo(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function solicitar(ruta, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${ruta}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...authorizationHeaders(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const respuesta = await cuerpo(response);

  if (!response.ok) {
    const mensaje = respuesta?.message
      ?? `La operación sobre el carrito falló (${response.status}).`;
    throw new ApiError(mensaje, response.status);
  }

  return validarCarrito(respuesta);
}

/** Obtiene el carrito persistido; si no existía, el backend crea uno vacío. */
export function getCarrito(usuarioId, { signal } = {}) {
  validarId(usuarioId, 'El id del usuario');
  return solicitar(`/carrito/${usuarioId}`, { signal });
}

/** Agrega unidades al carrito persistido. El backend valida producto y stock. */
export function addToCart(usuarioId, productoId, cantidad, { signal } = {}) {
  validarId(usuarioId, 'El id del usuario');
  validarId(productoId, 'El id del producto');
  validarCantidad(cantidad);
  return solicitar(`/carrito/${usuarioId}/items`, {
    method: 'POST',
    body: { productoId, cantidad },
    signal,
  });
}

export function updateCartItem(usuarioId, itemId, cantidad, { signal } = {}) {
  validarId(usuarioId, 'El id del usuario');
  validarId(itemId, 'El id del ítem');
  validarCantidad(cantidad);
  return solicitar(`/carrito/${usuarioId}/items/${itemId}`, {
    method: 'PUT',
    body: { cantidad },
    signal,
  });
}

export function removeFromCart(usuarioId, itemId, { signal } = {}) {
  validarId(usuarioId, 'El id del usuario');
  validarId(itemId, 'El id del ítem');
  return solicitar(`/carrito/${usuarioId}/items/${itemId}`, { method: 'DELETE', signal });
}

export function clearCart(usuarioId, { signal } = {}) {
  validarId(usuarioId, 'El id del usuario');
  return solicitar(`/carrito/${usuarioId}`, { method: 'DELETE', signal });
}
