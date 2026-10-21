import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  USUARIO_ACTUAL_ID,
  actualizarProducto,
  actualizarStock,
  crearProducto,
  eliminarProducto,
  getOpcionesProducto,
  getProductoGestion,
  getProductosPropios,
  reiniciarGestionProductos,
} from './gestionProductosService.js';
 
const productos = JSON.parse(await readFile(new URL('../../public/data/productos.json', import.meta.url), 'utf8'));
 
// Responde a la única lectura local que usa el servicio.
function simularFetch(t) {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url === '/data/productos.json') return { ok: true, json: async () => structuredClone(productos) };
    throw new Error(`Solicitud inesperada: ${url}`);
  });
}
 
function rechazaCon(nombre, patron) {
  return (error) => error.name === nombre && patron.test(error.message);
}
 
const imagen = (ubicacion, extra = {}) => ({ ubicacion, posicion: null, principal: false, ...extra });
 
function pedido(cambios = {}) {
  return {
    nombre: '  Cama ortopédica  ',
    descripcion: 'Cama con espuma viscoelástica.',
    precio: 32999.5,
    stock: 6,
    categoriaId: 4,
    marcaId: 6,
    creadorId: USUARIO_ACTUAL_ID,
    disponible: true,
    especiesIds: [2, 1],
    imagenes: [imagen('https://ejemplo.test/cama.jpg')],
    ...cambios,
  };
}
 
const propios = productos.filter(({ creador }) => creador.id === USUARIO_ACTUAL_ID);
const ajeno = productos.find(({ creador }) => creador.id !== USUARIO_ACTUAL_ID);
 
beforeEach(() => reiniciarGestionProductos());
 
test('lista sólo los productos del usuario actual, los más recientes primero', async (t) => {
  simularFetch(t);
  const resultado = await getProductosPropios();
  assert.deepEqual(
    resultado.map(({ id }) => id).sort(),
    propios.map(({ id }) => id).sort(),
  );
  assert.ok(resultado.every(({ creador }) => creador.id === USUARIO_ACTUAL_ID));
  const fechas = resultado.map(({ publicadoEn }) => Date.parse(publicadoEn));
  assert.deepEqual(fechas, [...fechas].sort((primera, segunda) => segunda - primera));
});
 
test('las opciones del formulario salen del catálogo, sin repetidos y ordenadas', async (t) => {
  simularFetch(t);
  const { categorias, marcas, especies } = await getOpcionesProducto();
  assert.deepEqual(categorias.map(({ nombre }) => nombre), ['Alimentos', 'Descanso', 'Juguetes', 'Paseo']);
  assert.equal(new Set(marcas.map(({ id }) => id)).size, marcas.length);
  assert.deepEqual(especies.map(({ nombre }) => nombre), ['Gato', 'Perro']);
});
 
test('crear: recorta el nombre, ordena especies, marca la imagen principal y devuelve un ProductoResponse', async (t) => {
  simularFetch(t);
  const creado = await crearProducto(pedido());
  assert.equal(creado.id, Math.max(...productos.map(({ id }) => id)) + 1);
  assert.equal(creado.nombre, 'Cama ortopédica');
  assert.equal(creado.precio, 32999.5);
  assert.equal(creado.disponible, true);
  assert.equal(creado.categoria.nombre, 'Descanso');
  assert.equal(creado.marca.id, 6);
  assert.equal(creado.creador.id, USUARIO_ACTUAL_ID);
  assert.deepEqual(creado.especies.map(({ nombre }) => nombre), ['Gato', 'Perro']);
  assert.equal(creado.imagenes.length, 1);
  assert.equal(creado.imagenes[0].principal, true);
  assert.equal(creado.imagenes[0].posicion, 1);
  assert.match(creado.publicadoEn, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  assert.deepEqual(Object.keys(creado), Object.keys(productos[0]));
 
  const nuevoPropio = (await getProductosPropios()).find(({ id }) => id === creado.id);
  assert.ok(nuevoPropio, 'El producto creado aparece en la lista del usuario.');
});
 
test('crear: sin disponible queda disponible, sin marca queda en null y sólo la primera imagen principal cuenta', async (t) => {
  simularFetch(t);
  const creado = await crearProducto(pedido({
    disponible: null,
    marcaId: null,
    imagenes: [imagen('a.jpg', { principal: true }), imagen('b.jpg', { principal: true }), imagen('c.jpg')],
  }));
  assert.equal(creado.disponible, true);
  assert.equal(creado.marca, null);
  assert.deepEqual(creado.imagenes.map(({ principal }) => principal), [true, false, false]);
  assert.deepEqual(creado.imagenes.map(({ posicion }) => posicion), [1, 2, 3]);
});
 
test('crear: si ninguna imagen es principal, lo es la primera', async (t) => {
  simularFetch(t);
  const creado = await crearProducto(pedido({ imagenes: [imagen('a.jpg'), imagen('b.jpg')] }));
  assert.deepEqual(creado.imagenes.map(({ principal }) => principal), [true, false]);
});
 
test('crear: rechaza los datos inválidos con los mismos mensajes del backend', async (t) => {
  simularFetch(t);
  const casos = [
    [{ nombre: '   ' }, /nombre del producto es obligatorio/],
    [{ descripcion: '' }, /descripción del producto es obligatoria/],
    [{ precio: -1 }, /precio del producto debe ser mayor o igual a 0/],
    [{ precio: null }, /precio del producto debe ser mayor o igual a 0/],
    [{ stock: -1 }, /stock del producto debe ser mayor o igual a 0/],
    [{ stock: 1.5 }, /stock del producto debe ser mayor o igual a 0/],
    [{ categoriaId: null }, /categoría del producto es obligatoria/],
    [{ creadorId: null }, /usuario creador del producto es obligatorio/],
    [{ imagenes: null }, /al menos una imagen/],
    [{ imagenes: [] }, /al menos una imagen/],
    [{ imagenes: [imagen('  ')] }, /ubicación de la imagen es obligatoria/],
  ];
  for (const [cambios, patron] of casos) {
    await assert.rejects(crearProducto(pedido(cambios)), rechazaCon('DatosInvalidosError', patron), JSON.stringify(cambios));
  }
});
 
test('crear: categoría, marca, especie o creador inexistentes devuelven RecursoNoEncontradoError', async (t) => {
  simularFetch(t);
  await assert.rejects(crearProducto(pedido({ categoriaId: 99 })), rechazaCon('RecursoNoEncontradoError', /No existe la categoría con id: 99/));
  await assert.rejects(crearProducto(pedido({ marcaId: 99 })), rechazaCon('RecursoNoEncontradoError', /No existe la marca con id: 99/));
  await assert.rejects(crearProducto(pedido({ especiesIds: [1, 99] })), rechazaCon('RecursoNoEncontradoError', /No existe la especie con id: 99/));
  await assert.rejects(crearProducto(pedido({ creadorId: 99 })), rechazaCon('RecursoNoEncontradoError', /No existe el usuario con id: 99/));
  assert.equal((await getProductosPropios()).length, propios.length, 'Un alta rechazada no deja productos a medias.');
});
 
test('editar: actualiza los datos, conserva creador y publicación, y reemplaza especies e imágenes', async (t) => {
  simularFetch(t);
  const original = propios[0];
  const editado = await actualizarProducto(original.id, pedido({
    nombre: 'Nombre nuevo',
    stock: 3,
    categoriaId: 2,
    marcaId: null,
    disponible: false,
    especiesIds: [1],
    imagenes: [imagen('z.jpg'), imagen('y.jpg', { principal: true })],
  }), USUARIO_ACTUAL_ID);
 
  assert.equal(editado.id, original.id);
  assert.equal(editado.nombre, 'Nombre nuevo');
  assert.equal(editado.stock, 3);
  assert.equal(editado.categoria.id, 2);
  assert.equal(editado.marca, null);
  assert.equal(editado.disponible, false);
  assert.deepEqual(editado.especies.map(({ id }) => id), [1]);
  assert.deepEqual(editado.imagenes.map(({ ubicacion, principal }) => [ubicacion, principal]), [['z.jpg', false], ['y.jpg', true]]);
  assert.deepEqual(editado.creador, original.creador);
  assert.equal(editado.publicadoEn, original.publicadoEn);
  assert.deepEqual(await getProductoGestion(original.id), editado);
});
 
test('editar: especies, imágenes y disponible en null conservan los valores actuales', async (t) => {
  simularFetch(t);
  const original = propios[0];
  const editado = await actualizarProducto(original.id, pedido({ especiesIds: null, imagenes: null, disponible: null }), USUARIO_ACTUAL_ID);
  assert.deepEqual(editado.especies, original.especies);
  assert.deepEqual(editado.imagenes, original.imagenes);
  assert.equal(editado.disponible, original.disponible);
});
 
test('editar, stock y baja: sólo el creador puede gestionar el producto', async (t) => {
  simularFetch(t);
  const noPermitida = rechazaCon('OperacionNoPermitidaError', /Solo el usuario que publicó el producto puede gestionarlo/);
  await assert.rejects(actualizarProducto(ajeno.id, pedido(), USUARIO_ACTUAL_ID), noPermitida);
  await assert.rejects(actualizarStock(ajeno.id, { ajuste: 1 }, USUARIO_ACTUAL_ID), noPermitida);
  await assert.rejects(eliminarProducto(ajeno.id, USUARIO_ACTUAL_ID), noPermitida);
  await assert.rejects(eliminarProducto(propios[0].id, null), rechazaCon('DatosInvalidosError', /id del usuario es obligatorio/));
  assert.deepEqual(await getProductoGestion(ajeno.id), ajeno, 'El producto ajeno no se modificó.');
});
 
test('un id inexistente o inválido se informa como producto no encontrado', async (t) => {
  simularFetch(t);
  const inexistente = rechazaCon('RecursoNoEncontradoError', /No existe el producto con id/);
  await assert.rejects(getProductoGestion(9999), inexistente);
  await assert.rejects(getProductoGestion('abc'), inexistente);
  await assert.rejects(getProductoGestion('1; DROP'), inexistente);
  await assert.rejects(actualizarStock(9999, { stock: 1 }, USUARIO_ACTUAL_ID), inexistente);
  await assert.rejects(eliminarProducto(9999, USUARIO_ACTUAL_ID), inexistente);
});
 
test('stock: establece un valor absoluto o aplica un ajuste positivo o negativo', async (t) => {
  simularFetch(t);
  const original = propios[0];
  assert.equal((await actualizarStock(original.id, { stock: 40 }, USUARIO_ACTUAL_ID)).stock, 40);
  assert.equal((await actualizarStock(original.id, { ajuste: 5 }, USUARIO_ACTUAL_ID)).stock, 45);
  assert.equal((await actualizarStock(original.id, { ajuste: -45 }, USUARIO_ACTUAL_ID)).stock, 0);
  assert.equal((await getProductoGestion(original.id)).stock, 0);
});
 
test('stock: rechaza pedidos vacíos, ambiguos, no enteros o que dejen el stock negativo', async (t) => {
  simularFetch(t);
  const id = propios[0].id;
  const stockOriginal = propios[0].stock;
  const datosInvalidos = (patron) => rechazaCon('DatosInvalidosError', patron);
  await assert.rejects(actualizarStock(id, {}, USUARIO_ACTUAL_ID), datosInvalidos(/stock nuevo o el ajuste/));
  await assert.rejects(actualizarStock(id, null, USUARIO_ACTUAL_ID), datosInvalidos(/stock nuevo o el ajuste/));
  await assert.rejects(actualizarStock(id, { stock: 1, ajuste: 1 }, USUARIO_ACTUAL_ID), datosInvalidos(/no los dos juntos/));
  await assert.rejects(actualizarStock(id, { ajuste: 1.5 }, USUARIO_ACTUAL_ID), datosInvalidos(/número entero/));
  await assert.rejects(actualizarStock(id, { stock: -1 }, USUARIO_ACTUAL_ID), datosInvalidos(/no puede quedar negativo/));
  await assert.rejects(actualizarStock(id, { ajuste: -(stockOriginal + 1) }, USUARIO_ACTUAL_ID), datosInvalidos(/no puede quedar negativo/));
  assert.equal((await getProductoGestion(id)).stock, stockOriginal, 'Un ajuste rechazado no modifica el stock.');
});
 
test('eliminar: es una baja lógica, el producto sigue existiendo como no disponible', async (t) => {
  simularFetch(t);
  const original = propios[0];
  await eliminarProducto(original.id, USUARIO_ACTUAL_ID);
  const guardado = await getProductoGestion(original.id);
  assert.equal(guardado.disponible, false);
  assert.equal(guardado.stock, original.stock);
  assert.ok((await getProductosPropios()).some(({ id }) => id === original.id), 'Sigue en la lista del usuario.');
  await eliminarProducto(original.id, USUARIO_ACTUAL_ID);
  assert.equal((await getProductoGestion(original.id)).disponible, false, 'Repetir la baja no falla.');
});
 
test('los datos devueltos son copias: modificarlos no altera el estado interno', async (t) => {
  simularFetch(t);
  const lista = await getProductosPropios();
  lista[0].nombre = 'Alterado';
  lista[0].especies.push({ id: 99, nombre: 'X' });
  assert.notEqual((await getProductosPropios())[0].nombre, 'Alterado');
  assert.ok((await getProductoGestion(lista[0].id)).especies.every(({ id }) => id !== 99));
});
 
test('un fallo al leer el catálogo se propaga y la siguiente lectura reintenta', async (t) => {
  let fallar = true;
  t.mock.method(globalThis, 'fetch', async () => {
    if (fallar) return { ok: false, json: async () => [] };
    return { ok: true, json: async () => structuredClone(productos) };
  });
  await assert.rejects(getProductosPropios(), /No se pudo cargar el catálogo/);
  fallar = false;
  assert.equal((await getProductosPropios()).length, propios.length);
});
 
