# Guía de integración de pantallas

Esta guía está dirigida al equipo que va a incorporar las pantallas del TPO sobre la base visual existente. Describe el trabajo previsto y señala explícitamente lo que todavía no está implementado. El catálogo visual está en [UI_KIT.md](UI_KIT.md) y el inventario de rutas y endpoints en [MAPA_PANTALLAS.md](MAPA_PANTALLAS.md).

## Punto de partida

- La aplicación se monta con React, Material UI y React Router. El tema ya se aplica a toda la aplicación.
- Están implementados con datos locales: Inicio (`/`), UI Kit (`/ui-kit`), catálogo (`/productos`), detalle de producto (`/productos/:id`), carrito con sus operaciones (`/carrito`), checkout y resultado (`/checkout` y `/checkout/confirmada/:id`), historial de compras (`/compras`) y detalle de compra (`/compras/:id`). Gestión de productos (`/gestion-productos`) todavía muestra `ComingSoonPage`.
- `MainLayout` ya agrega la barra y el contenedor general. Las rutas que son sus hijas no deben volver a agregarlo dentro de la pantalla.
- Los datos simulados están en `public/data/` y se leen mediante servicios en `src/services/`: `productosService.js` (catálogo), `carritoService.js` (carrito, a través de `CarritoContext`) y `comprasService.js` (historial, detalle y checkout simulado). La API está disponible, pero requiere autenticación HTTP Basic que el frontend aún no implementa.
- Los nombres de componentes y ubicaciones que aparezcan como ejemplos futuros deben confirmarse con el integrante responsable antes de importarlos.

## Ejecutar y verificar

Desde la carpeta `front-PetShop`:

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

`npm ci` instala las versiones del lockfile; basta con volver a ejecutarlo cuando se necesite reinstalar o actualizar las dependencias según ese archivo. Vite muestra la URL local en la terminal. Dejar esa terminal abierta mientras se utiliza la aplicación; `Ctrl + C` detiene el servidor.

- Página principal: [http://127.0.0.1:5173/](http://127.0.0.1:5173/).
- UI Kit: [http://127.0.0.1:5173/ui-kit](http://127.0.0.1:5173/ui-kit).
- Pruebas de navegador: [http://127.0.0.1:5173/tests/](http://127.0.0.1:5173/tests/).

Si el puerto 5173 ya está ocupado, Vite puede elegir el siguiente disponible: abrir la URL que muestre la terminal y agregar `/ui-kit` para acceder al UI Kit. Para revisar la compilación y las pruebas de servicios:

```bash
npm run build
node --test src/services/carritoService.test.js src/services/comprasService.test.js
```

El resultado de la compilación se genera en `dist/`, una carpeta ignorada por Git. La aplicación no necesita que Spring Boot esté ejecutándose.

## Reemplazar un placeholder por una pantalla real

1. Coordinar el nombre, la ubicación y las props del componente con el responsable de la pantalla.
2. Verificar que el archivo exista y que funcione por separado con sus dependencias.
3. Importarlo en `src/App.jsx` y reemplazar solamente el `element` de la ruta correspondiente. Mantener esa ruta dentro de `<Route element={<MainLayout />}>`.
4. Probar la URL directamente, el enlace correspondiente y la navegación hacia otras pantallas.
5. Actualizar el estado de la ruta en [UI_KIT.md](UI_KIT.md#routing) y en el mapa de pantallas.

El catálogo de Barza está en `src/pages/ProductList.jsx` y ya se importa en `App.jsx`:

```jsx
import ProductList from './pages/ProductList';
<Route path="productos" element={<ProductList />} />
```

La página obtiene los productos mediante `src/services/productosService.js`, que lee `public/data/productos.json`.

### Rutas con identificadores

Las rutas `productos/:id`, `compras/:id` y `checkout/confirmada/:id` reservan un segmento para el identificador. El componente puede leerlo con `useParams` de React Router; el valor obtenido es texto y debe validarse según las necesidades de la pantalla. Por ejemplo, `/productos/12` coincide con `productos/:id` y entrega `id` con valor `"12"`.

Para navegar entre pantallas usar `Link`, `NavLink` o un componente MUI integrado con React Router, como ya hacen Home y Navbar. Esto permite navegar dentro de la SPA sin una recarga completa. Las rutas del navegador (`/productos/12`) no son las URLs del backend (`/api/productos/{id}`).

### Si hace falta un acceso en el menú

`navigationItems` en `src/components/layout/Navbar.jsx` alimenta tanto la navegación de escritorio como la móvil. Para incorporar una opción, acordar la ruta, asegurar que exista en `App.jsx` y agregar allí el objeto con `label` y `to`. No todas las rutas necesitan una opción en el menú principal: por ejemplo, los detalles y el checkout se alcanzan desde su flujo.

## Datos locales y contratos del backend

La consigna pide que las pantallas se alimenten con JSON locales que respeten las respuestas del backend. Los mocks actuales están en `public/data/`: `productos.json` (`ProductoResponse`), `carrito.json` (`CarritoResponse`) y `compras.json` (`CompraResponse`). Cada módulo documenta los suyos: [CARRITO.md](CARRITO.md), [DETALLE_PRODUCTO.md](DETALLE_PRODUCTO.md) y [COMPRAS.md](COMPRAS.md).

Antes de preparar un JSON:

1. Identificar el endpoint y el método HTTP que se pretende simular.
2. Revisar su controller en `back-PetShop/src/main/java/ar/edu/uade/catalogo/controller/` y el DTO de respuesta en el paquete `dto/` del backend.
3. Comparar con la respuesta JSON real o los tests de integración del backend, incluidos los tipos, objetos anidados, arreglos y posibles valores nulos. Un DTO de entrada `Request` no debe confundirse con uno de salida `Response`.
4. Conservar exactamente los nombres y la forma de la respuesta. Evitar agregar campos para acomodarlos a una tarjeta o inventar objetos cuando el endpoint devuelve una lista.
5. Acordar ubicación y nombre de los archivos con el responsable del módulo y ubicarlos en `public/data/`.

Como referencia de la versión del backend revisada, estos son los **tipos de respuesta**, no ejemplos de datos:

| Operación | Forma de la respuesta | DTO a revisar |
| --- | --- | --- |
| `GET /api/productos` | Lista de productos | `ProductoResponse` y sus DTOs anidados |
| `GET /api/productos/{id}` | Un producto | `ProductoResponse` y sus DTOs anidados |
| `GET /api/carrito/{usuarioId}` | Un carrito | `CarritoResponse` e `ItemCarritoResponse` |
| Operaciones de ítems y vaciado de carrito | Un carrito actualizado | `CarritoResponse` e `ItemCarritoResponse` |
| `GET /api/compras` | Lista de compras | `CompraResponse` y `DetalleCompraResponse` |
| `GET /api/compras/{id}` | Una compra | `CompraResponse` y `DetalleCompraResponse` |
| `POST /api/compras/checkout/{usuarioId}` | Una compra | `CompraResponse` y `DetalleCompraResponse` |

Volver a contrastar la tabla si cambia el backend. Consultar [MAPA_PANTALLAS.md](MAPA_PANTALLAS.md#cobertura-prevista-de-los-endpoints) para el inventario completo, incluidos usuarios y administración.

### Preparación para la integración asíncrona

Una lectura de JSON mediante `fetch` es asíncrona. Cada pantalla debe contemplar carga, respuesta y error, y verificar `response.ok`: `fetch` no rechaza automáticamente una respuesta HTTP de error. El UI Kit ofrece muestras visuales de carga y alertas.

El acceso a los datos ya está aislado en un servicio por módulo, que devuelve la misma forma de respuesta que el backend. Para pasar a la API real conviene modificar el servicio y no las pantallas. Además de cambiar la URL, puede requerir métodos HTTP, parámetros, autenticación y manejo de respuestas sin cuerpo: un JSON estático por sí solo no implementa operaciones. Por eso el carrito simula sus operaciones en `carritoService.js` y el checkout en `comprasService.js`.

En el backend revisado algunas operaciones están protegidas mediante HTTP Basic y otras exigen rol ADMIN. La autenticación, la configuración entre orígenes y la integración real quedan fuera de esta base visual y deben coordinarse con el equipo cuando correspondan.

## Responsabilidades y coordinación

| Integrante | Módulo previsto | Integración a coordinar |
| --- | --- | --- |
| Lu | Base visual, navegación, Home y UI Kit | Tema, layout, rutas y documentación compartidos. |
| Barza | Catálogo | Lista, tarjetas, filtros y datos locales de productos. |
| Sol | Detalle de producto | Ruta con `id`, cantidad y acción para agregar al carrito. |
| Bauti | Visualización del carrito | Presentación de ítems, totales y estado vacío. |
| Fede | Operaciones del carrito | Estado y acciones coordinados con Sol y Bauti. |
| Joaquín | Checkout | Flujo de confirmación y resultado. |
| Luqui | Consultas e historial | Historial `/compras` con consulta y detalle `/compras/:id` con datos locales; integración API pendiente. |
| Nico | Gestión y operaciones restantes | Gestión de productos y cobertura de operaciones pendientes según el backend. |

Las pantallas y los accesos de usuarios, categorías, marcas y especies todavía necesitan una definición compartida. Los cambios en `App.jsx`, `Navbar.jsx`, `theme.js`, `package.json` y `package-lock.json` pueden generar conflictos entre ramas; conviene coordinarlos y revisar la versión actual antes de integrar.

## Comprobaciones antes de integrar

Esta lista se aplica a cada módulo nuevo:

- [ ] La pantalla usa `MainLayout` a través de la ruta y no duplica la barra.
- [ ] Los imports corresponden a archivos realmente existentes y se aprovechan componentes ya disponibles.
- [ ] Los colores, espaciados y controles siguen el tema y el UI Kit.
- [ ] Enlaces y botones de navegación funcionan sin recarga; los detalles usan el identificador correcto.
- [ ] La pantalla se revisó aproximadamente a 360, 768 y 1440 px: sin desborde horizontal, con texto y controles accesibles.
- [ ] El menú móvil abre, cierra y permite navegar; se comprobaron teclado y etiquetas de los controles agregados.
- [ ] Si hay datos, el JSON coincide con el DTO y la forma de respuesta del endpoint; se contemplan carga, vacío y error cuando corresponde.
- [ ] La consola no muestra errores relevantes y `npm run build` termina correctamente.
- [ ] Las pruebas de servicios (`node --test`) y las de navegador (`/tests/`) siguen aprobadas.
- [ ] El UI Kit y los documentos se actualizaron si se agregó un componente compartido o cambió el estado de una ruta.
