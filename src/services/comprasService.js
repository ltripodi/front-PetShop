function validarId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError('El identificador debe ser un entero positivo.');
  }
}

function validarCompra(compra) {
  if (!compra || typeof compra !== 'object') throw new TypeError('La compra no es válida.');
  validarId(compra.id);
  validarId(compra.usuarioId);
  if (typeof compra.realizadaEn !== 'string' || !Number.isFinite(Date.parse(compra.realizadaEn))) {
    throw new TypeError('La compra debe tener una fecha válida.');
  }
  if (typeof compra.total !== 'number' || !Number.isFinite(compra.total) || compra.total < 0) {
    throw new TypeError('La compra debe tener un total válido.');
  }
  if (!Array.isArray(compra.lineas)) throw new TypeError('La compra debe incluir una lista de líneas.');
  compra.lineas.forEach((linea) => {
    validarId(linea.id);
    validarId(linea.productoId);
    if (typeof linea.productoNombre !== 'string' || !linea.productoNombre.trim()) throw new TypeError('La línea debe tener un producto.');
    if (!Number.isSafeInteger(linea.cantidad) || linea.cantidad <= 0) throw new TypeError('La cantidad debe ser válida.');
    for (const importe of [linea.precioUnitario, linea.subtotal]) {
      if (typeof importe !== 'number' || !Number.isFinite(importe) || importe < 0) throw new TypeError('Los importes deben ser válidos.');
    }
  });
}

async function cargarCompras({ signal } = {}) {
  const response = await fetch('/data/compras.json', { signal });
  if (!response.ok) throw new Error('No se pudo cargar el historial de compras.');
  const compras = await response.json();
  if (!Array.isArray(compras)) throw new TypeError('El historial local debe ser una lista de compras.');
  compras.forEach(validarCompra);
  return compras;
}

export async function getCompras(options) {
  return cargarCompras(options);
}

export async function getCompraPorId(id, options) {
  const idNumerico = Number(id);
  validarId(idNumerico);
  const compras = await cargarCompras(options);
  const compra = compras.find((actual) => actual.id === idNumerico);
  if (!compra) {
    const error = new Error('No encontramos esa compra.');
    error.name = 'CompraNoEncontradaError';
    throw error;
  }
  return compra;
}
