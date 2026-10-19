# Visualización del carrito — Bauti

`src/pages/Carrito.jsx` reemplaza el placeholder de `/carrito`. Consume el estado compartido mediante `useCarrito()`. `CarritoProvider` carga inicialmente `public/data/carrito.json` mediante el servicio, que simula `GET /api/carrito/{usuarioId}` y respeta `CarritoResponse` e `ItemCarritoResponse` del backend (`id`, `usuarioId`, `items`, `total`, `actualizadoEn`). Los productos del mock existen en `public/data/productos.json` con el mismo nombre y precio.

La pantalla contempla carga, error con Reintentar, carrito vacío y carrito con ítems. Muestra el total del estado compartido: inicialmente el del mock y, después de una operación simulada, el recalculado por `carritoService.js`. Los componentes de presentación no recalculan importes y no hay conexión al backend.

| Archivo | Responsabilidad |
| --- | --- |
| `src/pages/Carrito.jsx` | Consumo del estado compartido, carga de imágenes y disposición en dos columnas desde `md`. |
| `src/context/CarritoContext.jsx` | Carga inicial, reintentos y estado compartido; delega las operaciones al servicio. |
| `src/hooks/useCarrito.js` | Acceso al Context; informa un error si se usa fuera del proveedor. |
| `src/services/carritoService.js` | Lectura del mock, validaciones y operaciones inmutables con recálculo de importes. |
| `src/components/carrito/ItemCarrito.jsx` | Tarjeta de un ítem: imagen, nombre con enlace al detalle, precio unitario, cantidad y subtotal. |
| `src/components/carrito/ResumenCarrito.jsx` | Cantidad de productos y unidades, total, Finalizar compra (`/checkout`) y Seguir comprando. |
| `public/data/carrito.json` | Mock de `CarritoResponse`. |

`CarritoResponse` no incluye imágenes: la pantalla las busca en el catálogo con `getProductos` por `productoId`. Si el catálogo no carga, el carrito se muestra igual con el ícono de reemplazo. No se modificó el servicio ni el JSON de productos.

## Reutilización y UI Kit

Antes de crear los componentes se revisó lo existente. Se reutilizan `PawIcon`, el tema y `MainLayout`. `ProductCard` no sirve para el carrito porque toda la tarjeta es un enlace al detalle y no muestra cantidad ni subtotal. No había componentes de ítem ni de resumen, así que `ItemCarrito` y `ResumenCarrito` se agregaron al UI Kit (`/ui-kit`, sección «Componentes del equipo») y a `UI_KIT.md`.

## Integración con Fede

Las Etapas 1 y 2 implementan el servicio y el estado compartido. `CarritoProvider` envuelve `App` desde `main.jsx`, por lo que el carrito se conserva al navegar entre pantallas. Al recargar la aplicación se vuelve a leer el mock; no hay persistencia adicional. Dentro de un componente bajo el proveedor, el contrato del hook es:

```jsx
const {
  carrito, cargando, error, reintentarCarga,
  agregarProducto, modificarCantidad, eliminarProducto, vaciarCarrito,
} = useCarrito();
```

`carrito` es `null` hasta completar la carga; `cargando` indica la inicialización en curso y `error` contiene el error de inicialización o `null`. `reintentarCarga()` es asíncrona y comunica los errores de lectura mediante ese estado. No inicia otra carga si hay una pendiente o un carrito ya cargado, para evitar sobrescribir cambios del usuario.

| Operación del Context | Responsabilidad |
| --- | --- |
| `agregarProducto({ producto, cantidad })` | Agrega o suma unidades por `productoId`, validando el stock acumulado. |
| `modificarCantidad({ itemId, producto, cantidad })` | Establece una cantidad absoluta positiva para un ítem existente. Requiere el producto correspondiente para validar stock, disponibilidad y precio. |
| `eliminarProducto(itemId)` | Elimina únicamente el ítem indicado, sin consultar el catálogo. |
| `vaciarCarrito()` | Elimina todos los ítems y establece el total en cero, sin consultar el catálogo. |

`item.id` identifica una línea del carrito; `item.productoId` identifica el producto del catálogo. Por ejemplo, el producto `104` corresponde al ítem `2` del mock: modificar o eliminar esa línea requiere `itemId: 2`, no `104`. El DTO del ítem no contiene stock ni disponibilidad y no reemplaza al producto requerido por `modificarCantidad`.

Las cuatro operaciones son síncronas y devuelven `{ exito: true, carrito }`; agregar incluye también `agregado: true`. Pueden lanzar errores de validación o de estado del proveedor: el consumidor debe capturarlos. Si una operación falla, no modifica el carrito ni devuelve un resultado de éxito. Los errores de las operaciones no se guardan en `error`, que corresponde a la inicialización.

Los cálculos usan centavos enteros. Al ingresar un precio se redondea su representación decimal a dos decimales, con las mitades hacia arriba (`10.075` → `10.08`), mediante aritmética entera con `BigInt`. El DTO sigue usando `Number`; se rechazan importes o cálculos que excedan el rango entero seguro en centavos. Esta conversión no recupera precisión perdida antes de recibir el número y `Number` no puede representar todos los centavos de importes muy grandes.

La página conserva las props opcionales `renderAccionesItem` y `renderAccionesCarrito`. Reciben `{ item, carrito, ...operaciones }` y `{ carrito, ...operaciones }`, respectivamente, con las cuatro operaciones del Context; no reciben un setter directo del estado. Lo que devuelva la primera se muestra debajo del ítem y lo de la segunda al final del resumen. Todavía no hay controles visuales de edición ni integración del botón de detalle; corresponden a etapas posteriores.

## Comprobación manual

- Abrir `/carrito` desde la barra y directamente por URL.
- Contrastar nombres, precios, cantidades, subtotales y total con `carrito.json`.
- Seguir el enlace de un producto al detalle, y los botones a `/checkout` y `/productos`.
- Con Vite en ejecución, abrir `/tests/carritoContext.html`: verifica el carrito vacío y el error con Reintentar mediante datos simulados, sin modificar los JSON originales.
- Revisar a 360, 768 y 1440 px y ejecutar `npm run build`.
