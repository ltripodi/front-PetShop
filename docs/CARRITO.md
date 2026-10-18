# Visualización del carrito — Bauti

`src/pages/Carrito.jsx` reemplaza el placeholder de `/carrito`. Lee `public/data/carrito.json`, que simula `GET /api/carrito/{usuarioId}` y respeta `CarritoResponse` e `ItemCarritoResponse` del backend (`id`, `usuarioId`, `items`, `total`, `actualizadoEn`). Los productos del mock existen en `public/data/productos.json` con el mismo nombre y precio.

La pantalla contempla carga, error con Reintentar, carrito vacío y carrito con ítems. El total que se muestra es el que devuelve el backend; no se recalcula en el front.

| Archivo | Responsabilidad |
| --- | --- |
| `src/pages/Carrito.jsx` | Carga del carrito, estados y disposición en dos columnas desde `md`. |
| `src/components/carrito/ItemCarrito.jsx` | Tarjeta de un ítem: imagen, nombre con enlace al detalle, precio unitario, cantidad y subtotal. |
| `src/components/carrito/ResumenCarrito.jsx` | Cantidad de productos y unidades, total, Finalizar compra (`/checkout`) y Seguir comprando. |
| `public/data/carrito.json` | Mock de `CarritoResponse`. |

`CarritoResponse` no incluye imágenes: la pantalla las busca en el catálogo con `getProductos` por `productoId`. Si el catálogo no carga, el carrito se muestra igual con el ícono de reemplazo. No se modificó el servicio ni el JSON de productos.

## Integración pendiente con Fede

La visualización no modifica el carrito. Para las operaciones, la página acepta dos props opcionales:

```jsx
<Carrito
  renderAccionesItem={({ item, carrito, actualizarCarrito }) => <CarritoActions item={item} onCambio={actualizarCarrito} />}
  renderAccionesCarrito={({ carrito, actualizarCarrito }) => /* por ejemplo, vaciar el carrito */ null}
/>
```

Lo que devuelva `renderAccionesItem` se muestra debajo de cada ítem y lo de `renderAccionesCarrito` al final del resumen. Como todas las operaciones de `/api/carrito` devuelven el `CarritoResponse` completo y recalculado, alcanza con pasar esa respuesta a `actualizarCarrito` para refrescar la pantalla. El ejemplo de `CarritoActions` es ilustrativo: sus props las define Fede.

Cuando exista la integración con la API, la función local `getCarrito` de `Carrito.jsx` puede reemplazarse por el servicio de carrito sin cambiar los componentes de presentación.

## Comprobación manual

- Abrir `/carrito` desde la barra y directamente por URL.
- Contrastar nombres, precios, cantidades, subtotales y total con `carrito.json`.
- Seguir el enlace de un producto al detalle, y los botones a `/checkout` y `/productos`.
- Dejar `items` vacío en el JSON y comprobar el estado vacío; renombrar el archivo y comprobar el error y Reintentar.
- Revisar a 360, 768 y 1440 px y ejecutar `npm run build`.
