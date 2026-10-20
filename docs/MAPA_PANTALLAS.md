# Mapa de pantallas y navegación

Este documento organiza la base visual y el trabajo pendiente a partir de los controladores del backend disponibles en el repositorio. Las rutas frontend y los endpoints HTTP son cosas distintas. Los recorridos marcados como pendientes son propuestas de organización para coordinar con el equipo, no funcionalidades ya implementadas ni contratos nuevos.

El inventario se contrastó con los controladores del backend en el commit `a76f4ac`. Si ese repositorio cambia, volver a revisar los controladores y `SecurityConfig` antes de darlo por vigente.

## Wireflow general

```text
Inicio (/)
  ├─ Productos (/productos) → Detalle (/productos/:id) → Carrito (/carrito)
  │                                                    └─ Checkout (/checkout) → resultado de compra
  ├─ Compras (/compras) → Detalle de compra (/compras/:id)
  └─ Accesos pendientes de acordar: usuarios y operaciones de administración

UI Kit (/ui-kit): referencia interna para el equipo
Gestión de productos (/gestion-productos): ruta preparada; acceso a coordinar
```

Están implementados Inicio, UI Kit, el catálogo `/productos`, el historial `/compras` y el detalle `/compras/:id` con datos locales. Las demás rutas del gráfico tienen un placeholder o, si no se indica URL, todavía deben diseñarse. Las flechas describen el recorrido previsto, no acciones disponibles hoy. El resultado del checkout es parte del flujo pendiente y no tiene una URL definida.

## Maquetas de referencia de la base visual

```text
ESCRITORIO / TABLET AMPLIA                  MÓVIL / TABLET ANGOSTA
┌───────────────────────────────────┐       ┌───────────────────────┐
│ logo   Inicio Productos Carrito…  │       │ logo             menú │
├───────────────────────────────────┤       ├───────────────────────┤
│ contenido dentro de MainLayout    │       │ contenido adaptable   │
│                                   │       │ en una columna        │
└───────────────────────────────────┘       └───────────────────────┘

INICIO                                      UI KIT
┌───────────────────────────────────┐       ┌───────────────────────┐
│ título + texto + ir a productos   │       │ título y descripción  │
│                         visual    │       │ paleta y tipografía   │
├───────────────────────────────────┤       │ botones y formularios │
│ cuidado │ juego │ compañía        │       │ feedback y navegación │
└───────────────────────────────────┘       └───────────────────────┘
```

La aplicación implementada es la referencia visual detallada de estas dos pantallas. Los siguientes esquemas de baja fidelidad representan el alcance de navegación y deben detallarse con sus responsables; los placeholders no constituyen implementaciones de esas funcionalidades.

## Esquemas propuestos para las pantallas pendientes

Los bloques representan zonas de pantalla e interacciones posibles, sin fijar campos ni estructuras de datos. Las rutas indicadas están preparadas con placeholders; las demás ubicaciones y el diseño detallado deben acordarse con el equipo.

```text
CATÁLOGO /productos                       DETALLE /productos/:id
┌────────────────────────────────┐        ┌─────────────────────────────┐
│ búsqueda y filtros disponibles │        │ información del producto    │
│ listado de productos           │ ────→  │ precio y stock              │
│ acceso al detalle              │        │ cantidad · agregar al carrito│
└────────────────────────────────┘        └─────────────────────────────┘

CARRITO /carrito                         CHECKOUT /checkout
┌────────────────────────────────┐        ┌─────────────────────────────┐
│ ítems · cantidades             │        │ revisión y confirmación     │
│ actualizar / quitar / vaciar   │ ────→  │ resultado de compra         │
│ subtotales · total · continuar │        └─────────────────────────────┘
└────────────────────────────────┘

COMPRAS /compras                         DETALLE /compras/:id
┌────────────────────────────────┐        ┌─────────────────────────────┐
│ consulta / listado de compras │ ────→  │ información de la compra    │
│ acceso al detalle              │        └─────────────────────────────┘
└────────────────────────────────┘

GESTIÓN DE PRODUCTOS /gestion-productos
┌──────────────────────────────────────────────────────────────────────┐
│ consulta · alta · edición · actualización de stock · eliminación    │
└──────────────────────────────────────────────────────────────────────┘

USUARIOS (ubicaciones pendientes de acordar)
┌──────────────────────────────────────────────────────────────────────┐
│ listado / consulta por id o correo · registro · ingreso              │
└──────────────────────────────────────────────────────────────────────┘

CATEGORÍAS, MARCAS Y ESPECIES (ubicaciones pendientes de acordar)
┌──────────────────────────────────────────────────────────────────────┐
│ listado / consulta por id · alta · edición · eliminación             │
└──────────────────────────────────────────────────────────────────────┘
```

El catálogo podrá usar las consultas de categorías, marcas y especies para sus filtros, de acuerdo con los endpoints existentes. Las vistas de administración y de usuarios se incluyen en el mapa porque el backend contempla esas operaciones; su acceso y asignación siguen pendientes de coordinación.

## Cobertura prevista de los endpoints

La siguiente tabla inventaría los endpoints presentes en los controladores Java y señala dónde debería resolverse su interacción visual. Debe completarse en conjunto con los responsables: aún no existe una pantalla funcional para ninguno de estos endpoints en el frontend.

| Endpoints del backend | Pantalla o interacción prevista | Estado |
| --- | --- | --- |
| `GET /api/productos` (filtros: `soloDisponibles`, `categoriaId`, `marcaId`, `especieId`, `creadorId`, `nombre`) | Catálogo `/productos` | UI implementada con JSON local, Barza; integración API pendiente |
| `GET /api/productos/{id}` | Detalle `/productos/:id` | Pendiente, Sol |
| `POST /api/productos`, `PUT /api/productos/{id}`, `PATCH /api/productos/{id}/stock`, `DELETE /api/productos/{id}` | Gestión `/gestion-productos`; edición, stock y eliminación requieren `usuarioId` | Pendiente, Nico |
| `GET /api/carrito/{usuarioId}` | Visualización `/carrito` | UI implementada con JSON local, Bauti; integración API pendiente |
| `POST /api/carrito/{usuarioId}/items`, `PUT /api/carrito/{usuarioId}/items/{itemId}`, `DELETE /api/carrito/{usuarioId}/items/{itemId}`, `DELETE /api/carrito/{usuarioId}` | Acciones dentro del carrito y desde el detalle del producto | Pendiente, Fede y coordinación con Sol/Bauti |
| `POST /api/compras/checkout/{usuarioId}` | Flujo de checkout y resultado | Pendiente, Joaquín |
| `GET /api/compras` (opcional `usuarioId`), `GET /api/compras/{id}` | Historial `/compras` y detalle `/compras/:id` | UI implementada con JSON local, Luqui; integración API pendiente |
| `GET /api/usuarios`, `GET /api/usuarios/{id}`, `GET /api/usuarios/buscar?correo=...` | Consulta de usuarios | Pantallas, acceso y distribución pendientes de acordar |
| `POST /api/auth/register`, `POST /api/auth/login` | Registro e ingreso | Pantallas y acceso pendientes de acordar; sin autenticación implementada en el frontend |
| `GET /api/categorias` (opcional `soloActivas`), `GET /api/categorias/{id}`, `POST /api/categorias`, `PUT /api/categorias/{id}`, `DELETE /api/categorias/{id}` | Consulta y gestión de categorías; posible apoyo al catálogo | Pendiente de diseño y coordinación con Nico/Barza |
| `GET /api/marcas` (opcional `soloActivas`), `GET /api/marcas/{id}`, `POST /api/marcas`, `PUT /api/marcas/{id}`, `DELETE /api/marcas/{id}` | Consulta y gestión de marcas; posible apoyo al catálogo | Pendiente de diseño y coordinación con Nico/Barza |
| `GET /api/especies`, `GET /api/especies/{id}`, `POST /api/especies`, `PUT /api/especies/{id}`, `DELETE /api/especies/{id}` | Consulta y gestión de especies; posible apoyo al catálogo | Pendiente de diseño y coordinación con Nico/Barza |

Los mocks del catálogo y las compras están en `public/data/productos.json` y `public/data/compras.json`; siguen la forma de `ProductoResponse` y `CompraResponse` (con `DetalleCompraResponse`), respectivamente. El detalle de compra lee el mismo JSON que el historial. Los mocks no modifican contratos. El DTO de compra no incluye estado, por lo que la pantalla no muestra estados de pedido.

En esta versión del backend, `SecurityConfig` configura HTTP Basic: algunas operaciones requieren autenticación y ciertas operaciones de administración requieren rol ADMIN. Los controles de acceso para la integración futura deben contrastarse con esa configuración y con los servicios del backend. El frontend actual no implementa ese acceso.

**Diferencia detectada:** el README del backend todavía menciona `/api/usuarios/registro` y `/api/usuarios/login`, pero los controladores de la versión revisada exponen `/api/auth/register` y `/api/auth/login`. Coordinar la actualización de ese README con quien mantenga el backend.

## Pendientes para la entrega grupal

- Completar y acordar las maquetas detalladas y sus estados para todas las operaciones listadas. Los esquemas de este archivo son de baja fidelidad y no reemplazan esas definiciones.
- Integrar las pantallas asignadas y actualizar el estado de cada ruta; Inicio, UI Kit y Catálogo están implementados.
- Definir accesos, pantallas y responsables para usuarios y para las operaciones de categorías, marcas y especies que aún no están distribuidas de forma explícita.
- Agregar los JSON de cada módulo y verificar que las respuestas simuladas respeten el contrato real del backend.
- Revisar el flujo completo, los estados de carga, vacío y error, y la adaptación en móvil, tablet y escritorio.
