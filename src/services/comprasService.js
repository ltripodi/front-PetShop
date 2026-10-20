// La extensión permite ejecutar las pruebas del servicio con node --test.
import { getProductos } from './productosService.js';

// Compras creadas por el checkout simulado. Viven en memoria, igual que el
// carrito del Context: al recargar la página se vuelve al JSON local.
let comprasSimuladas = [];
// Carritos ya comprados: el backend los vacía al confirmar, así que una segunda
// confirmación del mismo carrito se rechaza como carrito vacío.
let carritosComprados = new WeakSet();

function crearError(nombre, mensaje) {
  const error = new Error(mensaje);
  error.name = nombre;
  return error;
}

function validarId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError('El identificador debe ser un entero positivo.');
  }
}

// Los importes del backend son BigDecimal con dos decimales.
function aCentavos(importe) {
  if (typeof importe !== 'number' || !Number.isFinite(importe) || importe < 0) {
    throw new TypeError('Los importes deben ser válidos.');
  }
  return Math.round(importe * 100);
}

// LocalDateTime del backend: fecha y hora local, sin zona horaria.
function fechaLocal(fecha) {
  const dos = (valor) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`;
}

function validarCompra(compra) {
  if (!compra || typeof compra !== 'object') throw new TypeError('La compra no es válida.');
  validarId(compra.id);
  validarId(compra.usuarioId);
  if (typeof compra.realizadaEn !== 'string' || !Number.isFinite(Date.parse(compra.realizadaEn))) {
    throw new TypeError('La compra debe tener una fecha válida.');
  }
  if (!Array.isArray(compra.lineas)) throw new TypeError('La compra debe incluir una lista de líneas.');
  let totalCentavos = 0;
  compra.lineas.forEach((linea) => {
    if (!linea || typeof linea !== 'object') throw new TypeError('La línea de la compra no es válida.');
    validarId(linea.id);
    validarId(linea.productoId);
    if (typeof linea.productoNombre !== 'string' || !linea.productoNombre.trim()) throw new TypeError('La línea debe tener un producto.');
    if (!Number.isSafeInteger(linea.cantidad) || linea.cantidad <= 0) throw new TypeError('La cantidad debe ser válida.');
    const subtotal = aCentavos(linea.subtotal);
    if (aCentavos(linea.precioUnitario) * linea.cantidad !== subtotal) {
      throw new TypeError('El subtotal de la línea no coincide con el precio y la cantidad.');
    }
    totalCentavos += subtotal;
  });
  if (aCentavos(compra.total) !== totalCentavos) throw new TypeError('El total no coincide con la suma de las líneas.');
}

// Igual que findAllByOrderByRealizadaEnDesc: las más recientes primero.
function ordenarPorFecha(compras) {
  return [...compras].sort((primera, segunda) => Date.parse(segunda.realizadaEn) - Date.parse(primera.realizadaEn) || segunda.id - primera.id);
}

async function cargarCompras({ signal } = {}) {
  const response = await fetch('/data/compras.json', { signal });
  if (!response.ok) throw new Error('No se pudo cargar el historial de compras.');
  const compras = await response.json();
  if (!Array.isArray(compras)) throw new TypeError('El historial local debe ser una lista de compras.');
  const todas = [...compras, ...comprasSimuladas.map((compra) => structuredClone(compra))];
  const ids = new Set();
  todas.forEach((compra) => {
    validarCompra(compra);
    if (ids.has(compra.id)) throw new TypeError('El historial no puede contener compras duplicadas.');
    ids.add(compra.id);
  });
  return todas;
}

/** Simula GET /api/compras: con usuarioId devuelve sólo las compras de ese usuario. */
export async function getCompras({ usuarioId, signal } = {}) {
  if (usuarioId != null) validarId(usuarioId);
  const compras = await cargarCompras({ signal });
  return ordenarPorFecha(usuarioId == null ? compras : compras.filter((compra) => compra.usuarioId === usuarioId));
}

/** Simula GET /api/compras/{id}. Un id de ruta que no es un entero positivo equivale a una compra inexistente. */
export async function getCompraPorId(id, options) {
  const texto = String(id);
  const idNumerico = /^[1-9]\d*$/.test(texto) ? Number(texto) : NaN;
  if (!Number.isSafeInteger(idNumerico)) throw crearError('CompraNoEncontradaError', 'No encontramos esa compra.');
  const compras = await cargarCompras(options);
  const compra = compras.find((actual) => actual.id === idNumerico);
  if (!compra) throw crearError('CompraNoEncontradaError', 'No encontramos esa compra.');
  return compra;
}

/**
 * Simula POST /api/compras/checkout/{usuarioId} con las reglas de CompraService.checkout:
 * valida todo el carrito contra el catálogo antes de registrar y usa el precio vigente del producto.
 * El backend lee el carrito por usuarioId; acá se recibe porque vive en CarritoContext.
 * No descuenta stock (productos.json es estático) ni vacía el carrito: eso queda a cargo de quien llama.
 * Los errores de negocio usan el nombre de la excepción del backend, por ejemplo StockInsuficienteError.
 */
export async function checkout(carrito, { signal } = {}) {
  if (!carrito || typeof carrito !== 'object' || !Array.isArray(carrito.items)) throw new TypeError('El carrito no es válido.');
  validarId(carrito.usuarioId);
  const carritoVacio = () => crearError('CarritoVacioError', 'El carrito debe tener al menos un producto para realizar la compra.');
  if (carrito.items.length === 0 || carritosComprados.has(carrito)) throw carritoVacio();

  const [productos, compras] = await Promise.all([getProductos({ signal }), cargarCompras({ signal })]);
  // Después de las esperas: otra confirmación del mismo carrito pudo terminar antes.
  if (carritosComprados.has(carrito)) throw carritoVacio();

  const catalogo = new Map(productos.filter((producto) => producto?.id != null).map((producto) => [producto.id, producto]));
  const existentes = [...compras, ...comprasSimuladas];
  let siguienteLinea = existentes.reduce((maximo, compra) => Math.max(maximo, ...compra.lineas.map((linea) => linea.id)), 0) + 1;
  let totalCentavos = 0;
  const lineas = carrito.items.map((item) => {
    if (!item || typeof item !== 'object') throw new TypeError('El ítem del carrito no es válido.');
    const producto = catalogo.get(item.productoId);
    if (!producto) throw crearError('RecursoNoEncontradoError', `No existe el producto con id: ${item.productoId}.`);
    if (!Number.isSafeInteger(item.cantidad) || item.cantidad <= 0) throw crearError('DatosInvalidosError', 'La cantidad debe ser mayor a 0.');
    if (producto.disponible !== true) throw crearError('ProductoNoDisponibleError', `El producto ${producto.nombre} no está disponible.`);
    const stock = Number.isSafeInteger(producto.stock) && producto.stock > 0 ? producto.stock : 0;
    if (item.cantidad > stock) throw crearError('StockInsuficienteError', `Stock insuficiente para ${producto.nombre}. Disponible: ${stock}.`);
    const precio = aCentavos(producto.precio);
    const subtotal = precio * item.cantidad;
    totalCentavos += subtotal;
    return { id: siguienteLinea++, productoId: producto.id, productoNombre: producto.nombre, precioUnitario: precio / 100, cantidad: item.cantidad, subtotal: subtotal / 100 };
  });

  const compra = {
    id: existentes.reduce((maximo, actual) => Math.max(maximo, actual.id), 0) + 1,
    usuarioId: carrito.usuarioId,
    realizadaEn: fechaLocal(new Date()),
    total: totalCentavos / 100,
    lineas,
  };
  validarCompra(compra);
  comprasSimuladas = [...comprasSimuladas, compra];
  carritosComprados.add(carrito);
  return structuredClone(compra);
}

/** Descarta las compras simuladas para volver al historial del JSON. Lo usan las pruebas. */
export function reiniciarComprasSimuladas() {
  comprasSimuladas = [];
  carritosComprados = new WeakSet();
}
