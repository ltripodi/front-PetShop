export async function getProductos({ signal } = {}) {
  const response = await fetch('/data/productos.json', { signal });

  if (!response.ok) {
    throw new Error('No se pudo cargar el catálogo de productos.');
  }

  const productos = await response.json();
  if (!Array.isArray(productos)) {
    throw new TypeError('El catálogo local debe ser una lista de productos.');
  }

  return productos;
}