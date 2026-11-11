# Carrito persistido

El carrito dejó de usar `public/data/carrito.json`. El estado Redux representa
el `CarritoResponse` que devuelve el backend, por lo que precio, subtotal,
total, stock y cantidades acumuladas se calculan exclusivamente en Java y se
persisten en la base de datos.

## Flujo

`ProductoDetalle.jsx` despacha `addToCart({ productoId, cantidad })`. El thunk
hace `POST /api/carrito/{usuarioId}/items` y su `extraReducer` reemplaza el
carrito del store con la respuesta del servidor. `Carrito.jsx` aplica el mismo
patrón para modificar cantidad, eliminar una línea y vaciar el carrito. Las
acciones muestran el mensaje de la API si una regla de negocio falla.

| Operación | Endpoint | Thunk |
| --- | --- | --- |
| Cargar carrito | `GET /api/carrito/{usuarioId}` | `cargarCarrito` |
| Agregar producto | `POST /api/carrito/{usuarioId}/items` | `addToCart` |
| Cambiar cantidad | `PUT /api/carrito/{usuarioId}/items/{itemId}` | `updateCartItem` |
| Quitar línea | `DELETE /api/carrito/{usuarioId}/items/{itemId}` | `removeFromCart` |
| Vaciar | `DELETE /api/carrito/{usuarioId}` | `clearCart` |
| Listar carritos | `GET /api/carrito` (ADMIN) | API administrativa |

El backend comprueba que el usuario autenticado sea dueño del carrito. Un ADMIN
puede consultar todos los carritos; ningún cliente puede acceder al de otro.

## Ejecutar localmente

1. Iniciar el backend desde `back-PetShop` con `./mvnw spring-boot:run` y contar
   con un usuario y productos cargados en la base.
2. Copiar `.env.example` a `.env.local` en `front-PetShop` y completar
   `VITE_USUARIO_ID` con el id de ese usuario.
3. Para el backend actual (HTTP Basic), establecer `VITE_API_AUTHORIZATION` con
   el valor `Basic <base64(correo:clave)>`. No se deben versionar credenciales.
4. Ejecutar `npm run dev`. Vite proxifica `/api` a `http://localhost:8080`.

Cuando exista una pantalla de login, puede guardar el encabezado autorizado en
`sessionStorage` bajo la clave `petshop.authorization`; dicho valor tiene
prioridad sobre la variable de entorno. En producción el frontend debe servirse
detrás del mismo gateway (`/api`) o configurarse `VITE_API_BASE_URL` junto con
CORS en el backend.

## Verificación

```bash
npm run test:carrito
npm run build
```

Las pruebas del servicio comprueban rutas, verbos, cuerpo del POST/PUT,
validaciones y propagación del mensaje de error del backend. En el backend,
`./mvnw test` cubre el flujo de carrito, stock y autorización de propietario.
