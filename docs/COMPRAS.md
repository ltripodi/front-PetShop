# Compras: checkout, historial y detalle — Luqui

Este módulo cubre los puntos 6 y 7 de la consigna del frontend: la finalización de compra y la consulta de compras. Todas las pantallas usan datos simulados que respetan `CompraResponse` y `DetalleCompraResponse` del backend (`id`, `usuarioId`, `realizadaEn`, `total`, `lineas` con `id`, `productoId`, `productoNombre`, `precioUnitario`, `cantidad` y `subtotal`). No hay conexión al backend.

| Ruta | Pantalla | Endpoint simulado |
| --- | --- | --- |
| `/checkout` | Revisión y confirmación del carrito | `POST /api/compras/checkout/{usuarioId}` |
| `/checkout/confirmada/:id` | Compra confirmada | Respuesta del checkout |
| `/compras` | Historial con consulta | `GET /api/compras?usuarioId=1` |
| `/compras/:id` | Detalle de una compra | `GET /api/compras/{id}` |

| Archivo | Responsabilidad |
| --- | --- |
| `src/pages/Checkout.jsx` | Revisa el carrito contra el catálogo, confirma la compra, vacía el carrito y navega al resultado. |
| `src/pages/CompraConfirmada.jsx` | Muestra la compra recibida del checkout; sin ella, redirige al detalle del historial. |
| `src/pages/CompraList.jsx` | Historial del usuario con búsqueda, filtro por mes, orden, contador y total. |
| `src/pages/CompraDetalle.jsx` | Detalle por ID con líneas, imágenes y precio actual del catálogo, y resumen. |
| `src/components/compras/CompraCard.jsx` | Tarjeta de una compra en el historial. |
| `src/components/compras/CompraFiltros.jsx` | Controles de búsqueda, mes y orden. |
| `src/components/compras/LineaCompra.jsx` | Línea de compra reutilizable (detalle y confirmación). |
| `src/components/compras/ResumenCompra.jsx` | Resumen lateral reutilizable (checkout, confirmación y detalle). |
| `src/services/comprasService.js` | Lectura y validación del historial, búsqueda por ID y checkout simulado. |
| `public/data/compras.json` | Mock del historial: ocho compras del usuario 1. |

## Datos simulados

`compras.json` contiene ocho compras del usuario 1 (el mismo de `carrito.json`), entre el 21/09 y el 17/10 de 2026. Los IDs crecen con la fecha, como un autoincremental; cada compra es posterior a la publicación de sus productos, y los nombres coinciden con `productos.json`. Subtotales y totales cierran. La compra 1 registra el alimento para perro a $22.900, distinto del precio actual: así se ve que el detalle conserva el precio del momento de la compra, igual que `DetalleCompra.precio` en el backend.

El servicio valida el historial al leerlo (IDs, fecha, cantidades, que cada subtotal sea precio × cantidad y que el total sea la suma de las líneas) y rechaza compras duplicadas.

## Servicio

```js
import { checkout, getCompraPorId, getCompras } from '../services/comprasService';

await getCompras({ usuarioId: 1, signal });    // de la más reciente a la más antigua
await getCompraPorId('3', { signal });         // acepta el ID de la ruta como texto
await checkout(carrito, { signal });           // devuelve un CompraResponse
```

- `getCompras` ordena como `findAllByOrderByRealizadaEnDesc` y filtra por `usuarioId` cuando se indica.
- `getCompraPorId` informa un ID inexistente o inválido (`abc`, `0`, `1.5`) con un error `CompraNoEncontradaError`, sin consultar el historial si el ID es inválido.
- `checkout` repite las reglas de `CompraService.checkout`: valida todo el carrito antes de registrar, usa el **precio vigente** del producto (no el del carrito) y no registra compras parciales. Los errores de negocio usan el nombre de la excepción del backend:

| Error | Caso |
| --- | --- |
| `CarritoVacioError` | Carrito sin ítems, o el mismo carrito ya comprado (el backend lo vacía al confirmar). |
| `RecursoNoEncontradoError` | Un producto del carrito ya no existe en el catálogo. |
| `ProductoNoDisponibleError` | Un producto no está disponible. |
| `StockInsuficienteError` | La cantidad supera el stock. |
| `DatosInvalidosError` | Cantidad no positiva. |

La compra confirmada se agrega en memoria al historial. `reiniciarComprasSimuladas()` vuelve al JSON y lo usan las pruebas.

## Checkout (punto 6)

El endpoint de checkout no recibe cuerpo: por eso no hay formulario de envío ni de pago. La pantalla es una revisión y confirmación del carrito.

- Muestra los ítems con `ItemCarrito` (Bauti) y las imágenes del catálogo. Mientras verifica stock y precios, Confirmar compra queda deshabilitado.
- Anticipa las validaciones del backend en cada ítem: producto inexistente, no disponible, sin stock o con stock insuficiente. Si hay alguno, ofrece Ir al carrito para corregirlo.
- Si un precio cambió desde que se agregó, lo avisa y el total ya usa el precio vigente.
- Al confirmar llama a `checkout(carrito)`, vacía el carrito con `vaciarCarrito()` del Context (Fede) y navega a `/checkout/confirmada/:id` **reemplazando** el checkout en el historial del navegador. Ignora el doble clic.
- Si el backend rechaza la compra (por ejemplo, porque el stock cambió), muestra su mensaje, conserva el carrito y vuelve a consultar el catálogo. Ante un error de conexión permite reintentar.
- También contempla carrito vacío, error al cargar el carrito (Reintentar del Context) y catálogo inaccesible.

`CompraConfirmada` recibe la compra en el estado de la navegación. Si se recarga o se abre la URL directamente, redirige a `/compras/:id`, que la consulta.

## Historial y detalle (punto 7)

- El historial pide las compras del usuario 1: el frontend todavía no tiene ingreso, así que el usuario es el de los mocks.
- Búsqueda por producto, o por número de compra (`#3` o `3`). Filtro por mes con opciones tomadas de las compras. Orden por más recientes, más antiguas, mayor o menor total. Limpiar filtros vuelve a la vista inicial.
- Contador "N de M compras" con el total de las compras mostradas, estado sin resultados, historial vacío y error con Reintentar.
- El detalle muestra cada línea con enlace al producto, imagen y, si cambió, el precio actual. Si el catálogo falla, se muestra igual con una imagen genérica. Un ID inexistente o inválido muestra "Compra no encontrada"; un error de conexión, Reintentar. Al pasar de una compra a otra no se muestran datos de la anterior.
- Estados de pedido: `CompraResponse` no tiene estado, así que no se muestran.

## Límites de la simulación

- Las compras confirmadas viven en memoria, igual que el carrito: navegar las conserva y recargar vuelve a `compras.json` y `carrito.json`.
- El checkout no descuenta stock, porque `productos.json` es estático.
- No hay autenticación: el usuario es fijo.

## Integración con la API real

Los cambios se concentran en `comprasService.js`; las pantallas no deberían cambiar:

- `getCompras` → `GET /api/compras?usuarioId={id}`.
- `getCompraPorId` → `GET /api/compras/{id}`; un 404 debe convertirse en `CompraNoEncontradaError`.
- `checkout(carrito)` → `POST /api/compras/checkout/{carrito.usuarioId}` sin cuerpo; responde 201 con la compra. Convertir los errores del `@ControllerAdvice` en los nombres de la tabla anterior para que la pantalla muestre el mensaje.
- Todos requieren autenticación (`anyRequest().authenticated()` en `SecurityConfig`) y configurar CORS en el backend.

## Pruebas automatizadas

```bash
node --test src/services/comprasService.test.js
npm run build
```

Con `npm run dev` en ejecución, abrir `/tests/` para correr todas las pruebas de navegador, o cada página por separado:

| Página | Cubre |
| --- | --- |
| `/tests/compras.html` | Historial, consulta, detalle, errores e integración con la App y el checkout. |
| `/tests/checkout.html` | Revisión, validaciones, precio vigente, confirmación, doble clic, errores y flujo detalle → carrito → checkout → historial. |
| `/tests/flujoCompra.html` | Recorridos completos por todos los módulos, dos compras en la misma sesión y carga directa de todas las rutas. |

Las pruebas usan la App y los componentes reales con `fetch` simulado a partir de los JSON; no modifican los mocks. Los helpers compartidos están en `tests/utilidades.js`.

## Recorrido manual con `npm run dev`

1. Abrir `/compras`: aparecen las ocho compras. Probar buscar `rascador`, elegir el mes de septiembre y ordenar por mayor total.
2. Abrir la compra 1: el alimento para perro muestra el precio de la compra y el precio actual.
3. Ir a `/carrito` (tres productos del mock), opcionalmente cambiar cantidades, y Finalizar compra.
4. Confirmar: aparece la compra 9 y el carrito queda vacío.
5. Ver mis compras: la compra 9 encabeza el historial.
6. Revisar a 360, 768 y 1440 px. Recargar la página para volver a los datos iniciales.
