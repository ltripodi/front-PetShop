# Detalle de producto — Sol

`src/pages/ProductoDetalle.jsx` lee `id` con `useParams` y busca ese identificador en el resultado de `getProductos`. Las tarjetas de Barza ya enlazan a `/productos/${product.id}`; no requieren cambios.

Se reutiliza `public/data/productos.json`: contiene toda la información necesaria, por lo que no se crea `detalleProductos.json` ni se duplican productos. El catálogo y su servicio permanecen sin cambios.

`SelectorCantidad` es un componente controlado: recibe `cantidad`, `stock`, `onChange` y `disabled`. La página conserva la cantidad con `useState`. Los controles limitan la selección entre 1 y el stock; sin disponibilidad se bloquean. Para productos sin stock se muestra subtotal cero y la cantidad inicial queda deshabilitada.

## Integración pendiente con Fede

La pantalla acepta una prop opcional `onAgregarAlCarrito({ producto, cantidad })`. Fede podrá conectar su servicio o contexto desde el componente que renderiza la ruta:

```jsx
<ProductoDetalle onAgregarAlCarrito={agregarAlCarrito} />
```

El adaptador debe devolver una promesa que resuelva con `{ agregado: true }` solamente cuando el carrito haya confirmado la operación. La pantalla bloquea envíos repetidos mientras espera, confirma únicamente ese resultado y muestra errores o respuestas sin confirmar. El servicio debe validar nuevamente stock y disponibilidad al realizar la operación.

Sin esa prop, el botón informa que la función aún no está habilitada y que no se agregó ningún producto. No se guarda un carrito local ni se modifica stock, autenticación, endpoints o la pantalla de Bauti.

## Comprobación manual

- Abrir `/productos`, elegir una tarjeta y volver al catálogo.
- Recorrer los identificadores 101 a 108 y contrastar los datos con el JSON.
- En 101: disminuir en 1, aumentar hasta 18 y comprobar subtotal y límites.
- En 107: verificar stock cero y controles deshabilitados.
- En 108: comprobar que la marca ausente no produce errores.
- Abrir un identificador inexistente y simular fallo de `/data/productos.json`; comprobar Reintentar.
- Revisar a 360, 768 y 1440 px, imágenes fallidas, navegación por teclado y las demás rutas.
- Ejecutar `npm run build`.
