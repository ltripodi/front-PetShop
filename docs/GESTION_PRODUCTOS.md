# Gestión de productos — Nico

Pantallas para publicar, editar, ajustar el stock y dar de baja productos, sobre los endpoints `POST`, `PUT`, `PATCH` y `DELETE` de `/api/productos`. Funcionan con los datos locales de `public/data/productos.json`; no se conectan todavía al backend.

## Rutas

| Ruta | Pantalla | Archivo |
| --- | --- | --- |
| `/gestion-productos` | Lista de mis productos, búsqueda, ajuste de stock y baja | `src/pages/ProductoGestion.jsx` |
| `/gestion-productos/nuevo` | Alta de producto | `src/pages/ProductoForm.jsx` |
| `/gestion-productos/:id/editar` | Edición de un producto | `src/pages/ProductoForm.jsx` |

`Navbar.jsx` incorpora la opción **Gestión**. Las tres rutas son hijas de `MainLayout`.

## Archivos

- `src/services/gestionProductosService.js`: simula las operaciones y replica las reglas de `ProductoService`. Es lo único que tocaría la integración con la API.
- `src/components/gestion/AjusteStockDialog.jsx`: diálogo para sumar o restar unidades, o fijar el stock total.
- `src/components/gestion/ConfirmarEliminarDialog.jsx`: confirmación previa a la baja.
- `src/services/gestionProductosService.test.js`: pruebas del servicio con `node --test`.

No se crearon JSON nuevos: las categorías, marcas y especies del formulario se toman de los productos existentes, igual que los filtros del catálogo.

## Correspondencia con el backend

| Operación del servicio | Endpoint simulado | Reglas que replica |
| --- | --- | --- |
| `getProductosPropios` | `GET /api/productos?creadorId=` | Incluye los productos no disponibles; los más recientes primero. |
| `getProductoGestion` | `GET /api/productos/{id}` | Un id que no es un entero positivo equivale a un producto inexistente. |
| `crearProducto` | `POST /api/productos` | Nombre y descripción obligatorios, precio y stock mayores o iguales a 0, categoría y creador obligatorios, al menos una imagen. |
| `actualizarProducto` | `PUT /api/productos/{id}?usuarioId=` | Sólo el creador. Especies, imágenes y disponibilidad en `null` conservan los valores actuales. |
| `actualizarStock` | `PATCH /api/productos/{id}/stock?usuarioId=` | Stock nuevo **o** ajuste, no los dos; no puede quedar negativo. |
| `eliminarProducto` | `DELETE /api/productos/{id}?usuarioId=` | Baja lógica: el producto queda no disponible y se conserva. |

Los errores de negocio usan el nombre de la excepción del backend (`DatosInvalidosError`, `RecursoNoEncontradoError`, `OperacionNoPermitidaError`) y los mismos mensajes. Al guardar imágenes, sólo la primera marcada como principal lo es y, si ninguna lo está, lo es la primera.

## Decisiones y límites

- **Usuario actual:** el frontend todavía no tiene login. `USUARIO_ACTUAL_ID = 1` (el usuario del carrito simulado) hace de dueño: la lista muestra sólo sus productos y los que pertenecen a otros usuarios no se pueden editar. Al integrar la autenticación, ese valor debe salir de la sesión.
- **Eliminar es una baja lógica**, como en el backend. El producto sigue en la lista como "No disponible" y su botón de eliminar queda deshabilitado.
- **Los cambios viven en memoria** y se pierden al recargar la página. No se reflejan en el catálogo, el detalle ni el carrito: esas pantallas leen el JSON directamente y no se modificaron.
- **Imágenes:** se cargan por dirección (URL); no hay subida de archivos porque el backend sólo recibe la ubicación.
- **Creador:** el backend lo busca en la base de datos; acá sólo se conocen los que aparecen en el catálogo.

## Comprobación manual

- Abrir `/gestion-productos`: deben verse únicamente los productos del usuario 1.
- Crear un producto con todos los campos, con varias imágenes y la segunda como principal. Verificar el mensaje de éxito y que aparezca en la lista.
- Enviar el formulario vacío y con valores inválidos (precio negativo, stock decimal): deben mostrarse los errores sin enviar.
- Editar un producto, cambiar nombre y disponibilidad, y comprobar los datos precargados.
- Ajustar stock sumando, restando más unidades de las que hay (debe bloquearlo) y estableciendo un total.
- Eliminar un producto: confirmar, cancelar, y comprobar que queda como "No disponible".
- Abrir `/gestion-productos/9999/editar` y la edición de un producto de otro usuario.
- Revisar a 360, 768 y 1440 px, navegación por teclado y los diálogos con `Esc`.
- Ejecutar `npm run build` y `node --test src/services/gestionProductosService.test.js`.
```[cite: 7]
