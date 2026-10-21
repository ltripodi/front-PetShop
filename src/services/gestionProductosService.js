import { getProductos } from './productosService.js';

export const USUARIO_ACTUAL_ID = 1;
let productosGestion = null;
 
function crearError(nombre, mensaje) {
  const error = new Error(mensaje);
  error.name = nombre;
  return error;
}
 
const datosInvalidos = (mensaje) => crearError('DatosInvalidosError', mensaje);
const noEncontrado = (mensaje) => crearError('RecursoNoEncontradoError', mensaje);
const operacionNoPermitida = (mensaje) => crearError('OperacionNoPermitidaError', mensaje);
 
function fechaLocal(fecha) {
  const dos = (valor) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`;
}
 
async function cargar({ signal } = {}) {
  if (!productosGestion) {
    const productos = await getProductos({ signal });
    // Si otra lectura terminó antes, se conserva la primera copia.
    productosGestion ??= structuredClone(productos);
  }
  return productosGestion;
}
 
function parsearId(id, mensaje) {
  const texto = String(id);
  const numero = /^[1-9]\d*$/.test(texto) ? Number(texto) : NaN;
  if (!Number.isSafeInteger(numero)) throw noEncontrado(mensaje);
  return numero;
}
 
function obtener(productos, id) {
  if (id == null) throw datosInvalidos('El id del producto es obligatorio');
  const numero = parsearId(id, `No existe el producto con id: ${id}`);
  const producto = productos.find((actual) => actual.id === numero);
  if (!producto) throw noEncontrado(`No existe el producto con id: ${id}`);
  return producto;
}
 
function validarCreador(producto, usuarioId) {
  if (usuarioId == null) throw datosInvalidos('El id del usuario es obligatorio para gestionar el producto');
  if (producto.creador?.id !== usuarioId) {
    throw operacionNoPermitida('Solo el usuario que publicó el producto puede gestionarlo');
  }
}
 
function validarDatos(request) {
  if (!request) throw datosInvalidos('Los datos del producto son obligatorios');
  if (typeof request.nombre !== 'string' || !request.nombre.trim()) throw datosInvalidos('El nombre del producto es obligatorio');
  if (typeof request.descripcion !== 'string' || !request.descripcion.trim()) throw datosInvalidos('La descripción del producto es obligatoria');
  if (typeof request.precio !== 'number' || !Number.isFinite(request.precio) || request.precio < 0) {
    throw datosInvalidos('El precio del producto debe ser mayor o igual a 0');
  }
  if (!Number.isSafeInteger(request.stock) || request.stock < 0) throw datosInvalidos('El stock del producto debe ser mayor o igual a 0');
  if (request.categoriaId == null) throw datosInvalidos('La categoría del producto es obligatoria');
}
 
function validarImagenes(imagenes, obligatorias) {
  if (imagenes == null) {
    if (obligatorias) throw datosInvalidos('El producto debe tener al menos una imagen');
    return;
  }
  if (!Array.isArray(imagenes) || imagenes.length === 0) throw datosInvalidos('El producto debe tener al menos una imagen');
  imagenes.forEach((imagen) => {
    if (!imagen || typeof imagen.ubicacion !== 'string' || !imagen.ubicacion.trim()) {
      throw datosInvalidos('La ubicación de la imagen es obligatoria');
    }
  });
}
 
const porNombre = (primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es');
 
function sinRepetidos(elementos) {
  return [...new Map(elementos.filter(Boolean).map((elemento) => [elemento.id, elemento])).values()].sort(porNombre);
}
 
function opciones(productos) {
  return {
    categorias: sinRepetidos(productos.map(({ categoria }) => categoria)),
    marcas: sinRepetidos(productos.map(({ marca }) => marca)),
    especies: sinRepetidos(productos.flatMap(({ especies = [] }) => especies)),
  };
}
 
function obtenerCategoria(productos, categoriaId) {
  const categoria = opciones(productos).categorias.find(({ id }) => id === categoriaId);
  if (!categoria) throw noEncontrado(`No existe la categoría con id: ${categoriaId}`);
  return categoria;
}
 
function obtenerMarca(productos, marcaId) {
  if (marcaId == null) return null;
  const marca = opciones(productos).marcas.find(({ id }) => id === marcaId);
  if (!marca) throw noEncontrado(`No existe la marca con id: ${marcaId}`);
  return marca;
}

function obtenerCreador(productos, usuarioId) {
  const producto = productos.find(({ creador }) => creador?.id === usuarioId);
  if (!producto) throw noEncontrado(`No existe el usuario con id: ${usuarioId}`);
  return producto.creador;
}

function resolverEspecies(productos, especiesIds, actuales) {
  if (especiesIds == null) return actuales;
  if (especiesIds.includes(null) || especiesIds.includes(undefined)) throw datosInvalidos('El id de la especie es obligatorio');
  const disponibles = opciones(productos).especies;
  return [...new Set(especiesIds)]
    .map((especieId) => {
      const especie = disponibles.find(({ id }) => id === especieId);
      if (!especie) throw noEncontrado(`No existe la especie con id: ${especieId}`);
      return especie;
    })
    .sort(porNombre);
}
 
function resolverImagenes(productos, imagenes, actuales) {
  if (imagenes == null) return actuales;
  let siguienteId = productos.flatMap(({ imagenes: lista = [] }) => lista).reduce((maximo, { id }) => Math.max(maximo, id), 0) + 1;
  let hayPrincipal = false;
  const resultado = imagenes.map((pedido, indice) => {
    const principal = pedido.principal === true && !hayPrincipal;
    hayPrincipal ||= principal;
    return {
      id: siguienteId++,
      ubicacion: pedido.ubicacion.trim(),
      posicion: pedido.posicion ?? indice + 1,
      principal,
    };
  });
  if (!hayPrincipal) resultado[0].principal = true;
  return resultado.sort((primera, segunda) => primera.posicion - segunda.posicion);
}

export async function getOpcionesProducto(options) {
  return structuredClone(opciones(await cargar(options)));
}
 
export async function getProductosPropios({ usuarioId = USUARIO_ACTUAL_ID, signal } = {}) {
  const productos = await cargar({ signal });
  return structuredClone(productos
    .filter(({ creador }) => creador?.id === usuarioId)
    .sort((primero, segundo) => Date.parse(segundo.publicadoEn) - Date.parse(primero.publicadoEn) || segundo.id - primero.id));
}
 
export async function getProductoGestion(id, options) {
  return structuredClone(obtener(await cargar(options), id));
}

export async function crearProducto(request, options) {
  const productos = await cargar(options);
  validarDatos(request);
  if (request.creadorId == null) throw datosInvalidos('El usuario creador del producto es obligatorio');
  validarImagenes(request.imagenes, true);
 
  const producto = {
    id: productos.reduce((maximo, { id }) => Math.max(maximo, id), 0) + 1,
    nombre: request.nombre.trim(),
    descripcion: request.descripcion,
    precio: Math.round(request.precio * 100) / 100,
    stock: request.stock,
    publicadoEn: fechaLocal(new Date()),
    disponible: request.disponible == null || request.disponible,
    categoria: obtenerCategoria(productos, request.categoriaId),
    marca: obtenerMarca(productos, request.marcaId),
    creador: obtenerCreador(productos, request.creadorId),
    especies: resolverEspecies(productos, request.especiesIds, []),
    imagenes: [],
  };
  producto.imagenes = resolverImagenes(productos, request.imagenes, []);
  productos.push(producto);
  return structuredClone(producto);
}

export async function actualizarProducto(id, request, usuarioId, options) {
  const productos = await cargar(options);
  const actual = obtener(productos, id);
  validarCreador(actual, usuarioId);
  validarDatos(request);
  validarImagenes(request.imagenes, false);
 
  const actualizado = {
    ...actual,
    nombre: request.nombre.trim(),
    descripcion: request.descripcion,
    precio: Math.round(request.precio * 100) / 100,
    stock: request.stock,
    categoria: obtenerCategoria(productos, request.categoriaId),
    marca: obtenerMarca(productos, request.marcaId),
    disponible: request.disponible == null ? actual.disponible : request.disponible,
    especies: resolverEspecies(productos, request.especiesIds, actual.especies),
    imagenes: resolverImagenes(productos, request.imagenes, actual.imagenes),
  };
  productos[productos.indexOf(actual)] = actualizado;
  return structuredClone(actualizado);
}
 
export async function actualizarStock(id, request, usuarioId, options) {
  const productos = await cargar(options);
  const actual = obtener(productos, id);
  validarCreador(actual, usuarioId);
  if (!request || (request.stock == null && request.ajuste == null)) throw datosInvalidos('Indicá el stock nuevo o el ajuste a aplicar');
  if (request.stock != null && request.ajuste != null) throw datosInvalidos('Enviá el stock nuevo o el ajuste, pero no los dos juntos');
  const valor = request.stock ?? request.ajuste;
  if (!Number.isSafeInteger(valor)) throw datosInvalidos('El stock debe ser un número entero');
 
  const nuevoStock = request.stock != null ? request.stock : actual.stock + request.ajuste;
  if (nuevoStock < 0) throw datosInvalidos('El stock no puede quedar negativo');
  const actualizado = { ...actual, stock: nuevoStock };
  productos[productos.indexOf(actual)] = actualizado;
  return structuredClone(actualizado);
}
 
export async function eliminarProducto(id, usuarioId, options) {
  const productos = await cargar(options);
  const actual = obtener(productos, id);
  validarCreador(actual, usuarioId);
  productos[productos.indexOf(actual)] = { ...actual, disponible: false };
}

export function reiniciarGestionProductos() {
  productosGestion = null;
}
 
