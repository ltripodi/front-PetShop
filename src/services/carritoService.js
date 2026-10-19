function validarId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError('El identificador debe ser un entero positivo seguro.');
  }
}

function validarCantidad(cantidad) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new TypeError('La cantidad debe ser un entero positivo seguro.');
  }
}

// Se redondea la representación decimal de Number a centavos (mitades hacia arriba).
// BigInt evita multiplicar decimales binarios antes de redondear; no sale al DTO.
// No se puede recuperar precisión ya perdida antes de recibir el Number, ni
// representar todos los centavos de importes grandes al volver a dividir por 100.
function aCentavos(importe) {
  if (typeof importe !== 'number' || !Number.isFinite(importe) || importe < 0) {
    throw new TypeError('El precio o importe debe ser un número finito no negativo.');
  }
  const [coeficiente, exponente = '0'] = importe.toString().split('e');
  const [entero, decimales = ''] = coeficiente.split('.');
  const digitos = BigInt(entero + decimales);
  const desplazamiento = Number(exponente) + 2 - decimales.length;
  let centavos;
  if (desplazamiento >= 0) {
    centavos = digitos * (10n ** BigInt(desplazamiento));
  } else {
    const divisor = 10n ** BigInt(-desplazamiento);
    centavos = (digitos + divisor / 2n) / divisor;
  }
  if (centavos > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('El importe supera el rango monetario seguro.');
  }
  return Number(centavos);
}

function subtotalEnCentavos(precioUnitario, cantidad) {
  validarCantidad(cantidad);
  const subtotal = aCentavos(precioUnitario) * cantidad;
  if (!Number.isSafeInteger(subtotal)) {
    throw new RangeError('El subtotal supera el rango monetario seguro.');
  }
  return subtotal;
}

function validarCarrito(carrito) {
  if (!carrito || !Array.isArray(carrito.items)) {
    throw new TypeError('El carrito local debe tener una lista de ítems.');
  }
  validarId(carrito.id);
  validarId(carrito.usuarioId);
  if (typeof carrito.actualizadoEn !== 'string' || !Number.isFinite(Date.parse(carrito.actualizadoEn))) {
    throw new TypeError('El carrito debe tener una fecha de actualización válida.');
  }
  aCentavos(carrito.total);
  const ids = new Set();
  const productos = new Set();
  for (const item of carrito.items) {
    if (!item || typeof item.productoNombre !== 'string' || !item.productoNombre.trim()) {
      throw new TypeError('El ítem debe tener un nombre de producto.');
    }
    validarId(item.id);
    validarId(item.productoId);
    subtotalEnCentavos(item.precioUnitario, item.cantidad);
    aCentavos(item.subtotal);
    if (ids.has(item.id) || productos.has(item.productoId)) {
      throw new TypeError('El carrito no puede contener ítems ni productos duplicados.');
    }
    ids.add(item.id);
    productos.add(item.productoId);
  }
}

function validarProducto(producto, cantidad) {
  if (!producto || typeof producto.nombre !== 'string' || !producto.nombre.trim()) {
    throw new TypeError('El producto debe existir y tener un nombre.');
  }
  validarId(producto.id);
  validarCantidad(cantidad);
  if (producto.disponible !== true) {
    throw new Error('El producto no está disponible.');
  }
  if (!Number.isSafeInteger(producto.stock) || producto.stock < 0) {
    throw new TypeError('El stock debe ser un entero no negativo seguro.');
  }
  if (cantidad > producto.stock) {
    throw new RangeError('Stock insuficiente para la cantidad solicitada.');
  }
  aCentavos(producto.precio);
}

function buscarItem(carrito, itemId) {
  validarId(itemId);
  const item = carrito.items.find((actual) => actual.id === itemId);
  if (!item) throw new Error('El ítem no existe en el carrito.');
  return item;
}

function recalcularCarrito(carrito, items) {
  let totalCentavos = 0;
  const itemsCalculados = items.map((item) => {
    const subtotal = subtotalEnCentavos(item.precioUnitario, item.cantidad);
    totalCentavos += subtotal;
    if (!Number.isSafeInteger(totalCentavos)) {
      throw new RangeError('El total supera el rango monetario seguro.');
    }
    return { ...item, subtotal: subtotal / 100 };
  });
  return { ...carrito, items: itemsCalculados, total: totalCentavos / 100, actualizadoEn: new Date().toISOString() };
}

// Los errores HTTP, de red, JSON y validación se propagan al consumidor.
// Se conserva AbortError para que el futuro Context pueda distinguir cancelaciones.
export async function getCarrito({ signal } = {}) {
  const response = await fetch('/data/carrito.json', { signal });
  if (!response.ok) {
    throw new Error('No se pudo cargar el carrito.');
  }
  const carrito = await response.json();
  validarCarrito(carrito);
  return carrito;
}

/** Suma cantidad por productoId; conserva ID y precio de un ítem ya agregado. */
export function agregarProducto(carrito, producto, cantidad) {
  validarCarrito(carrito);
  validarProducto(producto, cantidad);
  const existente = carrito.items.find((item) => item.productoId === producto.id);
  const cantidadFinal = (existente?.cantidad ?? 0) + cantidad;
  validarProducto(producto, cantidadFinal);
  if (existente) {
    return recalcularCarrito(carrito, carrito.items.map((item) => (
      item.id === existente.id ? { ...item, cantidad: cantidadFinal } : item
    )));
  }
  // ID numérico local, único dentro del carrito, sin contador global mutable.
  const id = carrito.items.reduce((maximo, item) => Math.max(maximo, item.id), 0) + 1;
  validarId(id);
  const nuevoItem = {
    id,
    productoId: producto.id,
    productoNombre: producto.nombre,
    precioUnitario: aCentavos(producto.precio) / 100,
    cantidad,
    subtotal: 0,
  };
  return recalcularCarrito(carrito, [...carrito.items, nuevoItem]);
}

/** Establece una cantidad absoluta. itemId corresponde al ítem, no al producto. */
export function modificarCantidad(carrito, itemId, producto, cantidad) {
  validarCarrito(carrito);
  const item = buscarItem(carrito, itemId);
  validarProducto(producto, cantidad);
  if (item.productoId !== producto.id) {
    throw new Error('El producto no corresponde al ítem solicitado.');
  }
  if (item.cantidad === cantidad) return carrito;
  return recalcularCarrito(carrito, carrito.items.map((actual) => (
    actual.id === itemId ? { ...actual, cantidad } : actual
  )));
}

/** Elimina por item.id sin consultar el catálogo. */
export function eliminarProducto(carrito, itemId) {
  validarCarrito(carrito);
  buscarItem(carrito, itemId);
  return recalcularCarrito(carrito, carrito.items.filter((item) => item.id !== itemId));
}

/** Conserva los datos del carrito y evita cambiar la fecha si ya estaba vacío. */
export function vaciarCarrito(carrito) {
  validarCarrito(carrito);
  if (carrito.items.length === 0 && carrito.total === 0) return carrito;
  return recalcularCarrito(carrito, []);
}
