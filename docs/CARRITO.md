# Visualización del carrito — Bauti

`src/pages/Carrito.jsx` reemplaza el placeholder de `/carrito`. Consume el estado compartido mediante `useCarrito()`. `CarritoProvider` carga inicialmente `public/data/carrito.json` mediante el servicio, que simula `GET /api/carrito/{usuarioId}` y respeta `CarritoResponse` e `ItemCarritoResponse` del backend (`id`, `usuarioId`, `items`, `total`, `actualizadoEn`). Los productos del mock existen en `public/data/productos.json` con el mismo nombre y precio.

La pantalla contempla carga, error con Reintentar, carrito vacío y carrito con ítems. Muestra el total del estado compartido: inicialmente el del mock y, después de una operación simulada, el recalculado por `carritoService.js`. Los componentes de presentación no recalculan importes y no hay conexión al backend.

| Archivo | Responsabilidad |
| --- | --- |
| `src/pages/Carrito.jsx` | Consumo del estado compartido, carga de imágenes y disposición en dos columnas desde `md`. |
| `src/context/CarritoContext.jsx` | Carga inicial, reintentos y estado compartido; delega las operaciones al servicio. |
| `src/hooks/useCarrito.js` | Acceso al Context; informa un error si se usa fuera del proveedor. |
| `src/services/carritoService.js` | Lectura del mock, validaciones y operaciones inmutables con recálculo de importes. |
| `src/components/carrito/CarritoActions.jsx` | Selector de cantidad y eliminación por ítem; vaciado cuando no recibe un ítem. |
| `src/components/carrito/ItemCarrito.jsx` | Tarjeta de un ítem: imagen, nombre con enlace al detalle, precio unitario, cantidad y subtotal. |
| `src/components/carrito/ResumenCarrito.jsx` | Cantidad de productos y unidades, total, Finalizar compra (`/checkout`) y Seguir comprando. |
| `public/data/carrito.json` | Mock de `CarritoResponse`. |

`CarritoResponse` no incluye imágenes: la pantalla busca los productos con `getProductos` por `productoId`. Una misma consulta por montaje proporciona las imágenes y el producto completo para validar stock y disponibilidad al modificar cantidades. Mientras carga el catálogo, o si falla, la edición de cantidades queda deshabilitada; eliminar y vaciar siguen disponibles. Si falla, se informa el problema y se usa el ícono de reemplazo. No se modificó el servicio ni el JSON de productos.

## Reutilización y UI Kit

Antes de crear los componentes se revisó lo existente. Se reutilizan `PawIcon`, el tema y `MainLayout`. `ProductCard` no sirve para el carrito porque toda la tarjeta es un enlace al detalle y no muestra cantidad ni subtotal. No había componentes de ítem ni de resumen, así que `ItemCarrito` y `ResumenCarrito` se agregaron al UI Kit (`/ui-kit`, sección «Componentes del equipo») y a `UI_KIT.md`.

`CarritoActions` reutiliza `Stack`, `Button`, `Typography` y `Alert` de MUI y el `SelectorCantidad` existente. Usa colores semánticos del tema, distribución en columna en móvil y en fila desde `sm`, y botones con altura mínima de 44 px. Cada grupo identifica el producto; los botones de eliminar incluyen su nombre y los errores se anuncian mediante `Alert`. El selector conserva sus etiquetas, salida con `aria-live` y límites deshabilitados.

La muestra `CarritoShowcase` pertenece a la presentación de Bauti y se conserva sin cambios. El uso de los controles del Paso 5 se documenta aquí, sin agregar lógica de negocio ni nuevas secciones al UI Kit.

### Uso de CarritoActions

Desde un componente bajo `CarritoProvider`, obtener las operaciones con `useCarrito()` e importar `src/components/carrito/CarritoActions.jsx`. Para las acciones de una línea:

```jsx
<CarritoActions
  item={item}
  producto={producto}
  cargandoCatalogo={cargandoCatalogo}
  modificarCantidad={modificarCantidad}
  eliminarProducto={eliminarProducto}
/>
```

`item` es la línea del carrito; `producto` es el registro del catálogo identificado por `item.productoId`. `cargandoCatalogo` es opcional y vale `false` por defecto. Sin producto se bloquean los cambios de cantidad; eliminar sigue disponible. Para las acciones del carrito completo, omitir `item`:

```jsx
<CarritoActions vaciarCarrito={vaciarCarrito} />
```

Los callbacks son síncronos, siguen el contrato del Context descrito abajo y pueden lanzar errores. El componente sólo mantiene el error de la última operación, no cantidades ni importes independientes. `Carrito.jsx` ya incorpora ambos usos de forma predeterminada.

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

La página conserva las props opcionales `renderAccionesItem` y `renderAccionesCarrito`. Reciben `{ item, carrito, producto, cargandoCatalogo, ...operaciones }` y `{ carrito, ...operaciones }`, respectivamente, con las cuatro operaciones del Context; no reciben un setter directo del estado. Lo que devuelva la primera se muestra debajo del ítem y lo de la segunda al final del resumen.

En la Etapa 3, ambas props usan `CarritoActions` de forma predeterminada. Por ítem, reutiliza `SelectorCantidad` de Sol y aplica inmediatamente la cantidad absoluta elegida; también permite eliminar por `item.id`. Sin ítem, muestra Vaciar carrito. El componente captura errores y los muestra con `Alert`; no mantiene una copia del estado del carrito. La falta del producto o su indisponibilidad bloquean la edición de cantidades, pero permiten eliminar.

`App.jsx` conecta `agregarProducto` con la callback `onAgregarAlCarrito` de `ProductoDetalle.jsx`. El detalle conserva su selector, bloqueo durante el agregado y mensajes existentes: sólo confirma cuando recibe `agregado: true`. El servicio valida el stock acumulado. No se modificaron el detalle ni los componentes visuales de Bauti, y no se implementó checkout.

## Validaciones y límites de la simulación

- El servicio concentra las validaciones de identificadores, estructura del carrito, cantidades enteras positivas y seguras, disponibilidad, stock y precios finitos no negativos. Rechaza identificadores de ítems o `productoId` duplicados en un carrito recibido y desbordamientos de importes. Cantidad cero no elimina: se usa `eliminarProducto`.
- Agregar acumula por `productoId`; modificar y eliminar utilizan `item.id`. Los ítems existentes conservan su identificador y precio unitario. Los nuevos reciben un identificador numérico local único dentro del carrito.
- Las operaciones son inmutables: ante un error no se publican cambios parciales. El Context usa el último estado para procesar operaciones consecutivas. La carga admite cancelación y descarta respuestas obsoletas, también bajo StrictMode.
- Los controles reflejan stock y disponibilidad del catálogo leído al montar la pantalla; no reservan ni descuentan stock del JSON. No hay sincronización entre pestañas, usuarios o sesiones.
- Los cambios sólo viven en memoria mientras el proveedor está montado. Navegar conserva el carrito; recargar restaura `public/data/carrito.json`. No se usan `localStorage`, `sessionStorage` ni API real.
- Si falla el catálogo, se informa el problema y se mantienen eliminar y vaciar. Volver a entrar a la pantalla vuelve a consultar el catálogo. El detalle conserva su mensaje genérico para operaciones rechazadas.
- Checkout, historial y administración quedan fuera del Paso 5. El enlace existente a `/checkout` no realiza una compra.

## Pruebas automatizadas

Desde la raíz del proyecto:

```bash
node --test src/services/carritoService.test.js
npm run build
```

Las pruebas del servicio cubren las operaciones, validaciones, inmutabilidad, lectura y redondeo monetario. Para Context e integración, ejecutar `npm run dev` y abrir `/tests/carritoContext.html` en la dirección que informe Vite. La página ejecuta las pruebas automáticamente y muestra los resultados; las pruebas del navegador no se ejecutan con `node --test`.

Las pruebas de integración usan componentes y routers reales con `fetch` simulado. Incluyen carga y reintentos, StrictMode, cancelación, navegación, agregados nuevos y acumulados, stock insuficiente, doble clic, modificación, eliminación y vaciado, y catálogo inaccesible o pendiente. No cambian los JSON. La revisión visual y de teclado se realiza además con los pasos siguientes.

## Comprobación manual

- Abrir `/carrito` desde la barra y directamente por URL.
- Contrastar nombres, precios, cantidades, subtotales y total con `carrito.json`.
- Agregar desde un detalle y navegar al carrito; comprobar acumulación y rechazo si se supera el stock acumulado.
- Modificar cantidades, eliminar un ítem y vaciar; comprobar que cambian los subtotales y el total. Recargar la aplicación para restaurar el mock.
- Seguir el enlace de un producto al detalle, y los botones a `/checkout` y `/productos`.
- Con Vite en ejecución, abrir `/tests/carritoContext.html`: verifica el carrito vacío y el error con Reintentar mediante datos simulados, sin modificar los JSON originales.
- Revisar a 360, 768 y 1440 px y ejecutar `npm run build`.
