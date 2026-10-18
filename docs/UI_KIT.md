# UI Kit - PetShop

## Objetivo

El UI Kit es una referencia visual compartida para que el equipo consulte el tema y los componentes disponibles antes de crear otros. Reutilizarlos ayuda a mantener una interfaz coherente y evita duplicaciones. La página está en `/ui-kit` y la presente guía explica cómo continuar la integración.

Con el servidor de desarrollo iniciado en el puerto predeterminado, se accede desde [http://127.0.0.1:5173/ui-kit](http://127.0.0.1:5173/ui-kit). Si Vite informa otro puerto, usar la dirección mostrada en la terminal y agregar `/ui-kit`. Los pasos de inicio están en el [README](../README.md#abrir-la-aplicación).

## Arquitectura visual

```text
main.jsx: ThemeProvider + CssBaseline
└── App
    └── BrowserRouter + Routes
        └── MainLayout
            ├── Navbar
            └── Outlet → página de la ruta
```

Las páginas bajo `MainLayout` reciben automáticamente la navegación y un área de contenido con ancho y márgenes consistentes. El mapa de pantallas, el flujo propuesto y la correspondencia con el backend están en [MAPA_PANTALLAS.md](MAPA_PANTALLAS.md).

### Archivos y responsabilidades

| Ubicación | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Montar React y aplicar `ThemeProvider` y `CssBaseline`. |
| `src/App.jsx` | Declarar el router y las rutas hijas del layout. |
| `src/theme/theme.js` | Definir el tema compartido de Material UI. |
| `src/components/layout/` | Barra de navegación y estructura común. |
| `src/components/common/` | Íconos y página temporal reutilizable. |
| `src/components/products/` | Tarjeta de producto y filtros del catálogo. |
| `src/components/ui-kit/` | Secciones de muestra utilizadas en la página del UI Kit. |
| `src/pages/Home.jsx` | Pantalla inicial y enlace al catálogo. |
| `src/pages/ProductList.jsx` | Catálogo con búsqueda, filtros y estados de carga. |
| `src/pages/UiKit.jsx` | Página que reúne la biblioteca visual. |
| `src/services/productosService.js` | Lectura asíncrona del catálogo local. |
| `public/data/productos.json` | Mock de `GET /api/productos` con forma `ProductoResponse`. |

El detalle para integrar pantallas y preparar datos está en [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md). El catálogo ya usa un servicio de datos local; no hay conexión al backend ni estado global.

## Theme

El tema está en `src/theme/theme.js` y se aplica desde `src/main.jsx`. Es la fuente compartida de identidad visual:

- **Paleta:** verde para `primary`, terracota para `secondary`, fondos claros, texto oscuro y colores semánticos para `error`, `warning` y `success`. Los valores actuales se pueden consultar en el código y visualmente en `/ui-kit`.
- **Tipografía:** pila de fuentes del sistema, con variantes de Material UI y tamaños adaptables para los títulos principales.
- **Espaciado:** escala predeterminada de MUI de 8 px (`p: 2` equivale a 16 px).
- **Forma:** radio base de 12 px; los botones tienen forma redondeada.
- **Breakpoints:** valores predeterminados de MUI: `xs` desde 0 px, `sm` desde 600 px, `md` desde 900 px, `lg` desde 1200 px y `xl` desde 1536 px. El menú cambia a navegación de escritorio en `md`.

Se puede usar el tema directamente en `sx`, sin repetir sus colores:

```jsx
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary', p: { xs: 2, md: 4 } }}>
  Contenido
</Box>
```

Cuando se necesita el objeto completo, se puede usar `const theme = useTheme()` desde `@mui/material/styles`, como en `ThemeShowcase.jsx`.

### Guía de uso de la paleta

| Token | Uso en la base actual |
| --- | --- |
| `primary.main` y `primary.dark` | Identidad, acción principal y énfasis. |
| `primary.light` | Fondos suaves y estados activos de navegación. |
| `secondary.main` y `secondary.light` | Acentos y acciones secundarias. |
| `background.default` y `background.paper` | Fondo general y superficies de contenido. |
| `text.primary` y `text.secondary` | Texto principal y texto de apoyo. |
| `error.main`, `warning.main`, `success.main` | Feedback semántico mediante los componentes de MUI. |
| `divider` | Bordes y separadores. |

Los valores se mantienen en `theme.js`, no en esta tabla. Por ejemplo, `sx={{ color: 'primary.main' }}` resuelve el color a través del tema. Si se modifica la paleta, conviene revisar contraste, estados activos y el UI Kit en todos los tamaños.

### Tipografía, espaciado y forma

- `h1`, `h2` y `h3` usan tamaños fluidos con límites mediante `clamp`; la pila es `Trebuchet MS`, `Segoe UI` y fuentes sans-serif del sistema.
- Usar la variante visual y el elemento semántico apropiados. Por ejemplo, `<Typography component="h1" variant="h2">` se ve como `h2`, pero sigue siendo el título principal de la página.
- En `sx`, `p: 1`, `p: 2` y `p: 3` corresponden a 8, 16 y 24 px. Las propiedades responsivas aceptan valores por breakpoint, como `p: { xs: 2, md: 4 }`.
- El radio base es 12 px. En el sistema `sx` de MUI, un número en `borderRadius` multiplica ese valor; por ejemplo, `borderRadius: 2` equivale a 24 px con el tema actual.
- `MuiButton` desactiva la elevación y usa un radio redondeado desde el tema; no hace falta repetirlo en cada pantalla.

## MainLayout

`src/components/layout/MainLayout.jsx` contiene `Navbar` y un `Container` principal responsive con el `Outlet` de React Router. La pantalla que corresponda a la ruta se renderiza en ese `Outlet`; no necesita crear otra barra de navegación ni otro contenedor general. No recibe props.

Las páginas van como rutas hijas de `MainLayout` en `App.jsx`. El layout no debe contener lógica de negocio ni operaciones de catálogo, carrito, checkout o gestión.

```jsx
<Route element={<MainLayout />}>
  <Route path="mi-pantalla" element={<MiPantalla />} />
</Route>
```

El ejemplo presupone que `MiPantalla` ya fue creada e importada. Si una pantalla necesita organizar su contenido, puede agregar contenedores internos sin repetir el layout general.

## Navbar

`src/components/layout/Navbar.jsx` no recibe props. En escritorio muestra Inicio, Productos, Carrito y Compras; debajo de `md` usa un `Drawer` que se cierra al elegir una opción, al presionar Escape o al hacer clic fuera. El logo lleva al inicio. Los enlaces usan React Router y evitan recargar la SPA.

Para agregar una opción, modificar el arreglo `navigationItems` del mismo archivo y definir la ruta correspondiente en `App.jsx`. Conviene coordinar ese cambio con el equipo porque ambos son archivos compartidos. Las rutas de detalle, checkout, gestión y UI Kit existen, pero no aparecen como opciones principales en la barra.

Por ejemplo, para mostrar el UI Kit también en el menú, se podría agregar `{ label: 'UI Kit', to: '/ui-kit' }` a `navigationItems`: la misma lista se usa para escritorio y móvil. Es solo un ejemplo; hoy esa opción no está en la barra. La opción `end: true` de Inicio evita que quede activa en todas las rutas.

## UI Kit

En `/ui-kit` se muestran los colores reales del tema, tipografía, botones, controles de formulario, alertas, carga, un ejemplo de estado vacío y enlaces de navegación. La barra superior es la misma `Navbar` de la aplicación. Los controles son demostrativos y no ejecutan acciones de negocio.

Las muestras están separadas para facilitar su mantenimiento:

| Archivo en `src/components/ui-kit/` | Contenido |
| --- | --- |
| `ThemeShowcase.jsx` | Colores leídos del tema y variantes de tipografía. |
| `ButtonsShowcase.jsx` | Botones principales, secundarios, alternativos, deshabilitado, error y con ícono. |
| `FormsShowcase.jsx` | `TextField`, `Select`, `Checkbox`, `Radio` y `Switch`. |
| `FeedbackShowcase.jsx` | Alertas, indicador de carga y ejemplo visual de estado vacío. |
| `ShowcaseSection.jsx` | Estructura compartida de las secciones del UI Kit. |

Los controles de formulario mantienen solo el estado necesario para la demostración; no representan login, filtros ni checkout. El estado vacío es una composición de MUI dentro de `FeedbackShowcase`, no un componente común ya disponible para importar.

Para incorporar un componente del equipo:

1. Confirmar que el componente exista en el repositorio y revisar sus props y dependencias.
2. Importar el componente real en `UiKit.jsx` o en una sección específica y mostrarlo sin modificar su implementación para esta página.
3. Si requiere props, usar valores locales mínimos de demostración acordes a su contrato; no crear ni alterar JSON de backend para el ejemplo.
4. Explicar su uso y agregar la documentación que corresponda. Por ahora no hay componentes de otros integrantes disponibles para mostrar.

## Componentes reutilizables

### MainLayout

- Ubicación: `src/components/layout/MainLayout.jsx`.
- Propósito: estructura compartida de navegación y contenido para rutas hijas.
- Props: ninguna; el contenido se obtiene mediante `Outlet`.
- Uso: ver el ejemplo de rutas en la sección MainLayout.

### Navbar

- Ubicación: `src/components/layout/Navbar.jsx`.
- Propósito: navegación principal responsive.
- Props: ninguna. Ya está incluida en `MainLayout`; no hace falta agregarla en cada página.

### ComingSoonPage

- Ubicación: `src/components/common/ComingSoonPage.jsx`.
- Propósito: estado temporal para rutas de pantallas que aún no se integraron.
- Props: `title` y `description` opcional.

```jsx
import ComingSoonPage from '../components/common/ComingSoonPage';

<ComingSoonPage title="Mi pantalla" />
```

### PawIcon, MenuIcon y CloseIcon

- Ubicación: `src/components/common/Icons.jsx`.
- Propósito: íconos compartidos usados por la identidad y la navegación, basados en `SvgIcon` de MUI.
- Props: acepta las props de `SvgIcon`, por ejemplo `color`, `fontSize` y `sx`.

```jsx
import { PawIcon } from '../components/common/Icons';

<PawIcon color="primary" />
```

### ShowcaseSection

- Ubicación: `src/components/ui-kit/ShowcaseSection.jsx`.
- Propósito: presentación consistente de secciones dentro del UI Kit.
- Props: `title`, `description` opcional y `children`.

```jsx
import { Button } from '@mui/material';
import ShowcaseSection from '../components/ui-kit/ShowcaseSection';

<ShowcaseSection title="Mi componente" description="Ejemplo de uso">
  <Button>Acción de ejemplo</Button>
</ShowcaseSection>
```

## Routing

Las rutas están definidas en `src/App.jsx`. Las marcadas como placeholder muestran `ComingSoonPage`; el catálogo consume un JSON local y todavía no está conectado al backend.

| Ruta | Pantalla prevista | Estado |
| --- | --- | --- |
| `/` | Inicio | Implementada |
| `/productos` | Catálogo | Implementada con JSON local |
| `/productos/:id` | Detalle de producto | Placeholder temporal |
| `/carrito` | Carrito | Placeholder temporal |
| `/checkout` | Finalización de compra | Placeholder temporal |
| `/compras` | Historial de compras | Placeholder temporal |
| `/compras/:id` | Detalle de compra | Placeholder temporal |
| `/gestion-productos` | Gestión de productos | Placeholder temporal |
| `/ui-kit` | Biblioteca visual | Implementada |

Las URLs desconocidas muestran un mensaje genérico con enlace al inicio. Las rutas frontend no son endpoints de la API. En despliegue, el servidor de archivos debe devolver `index.html` para las rutas de la SPA, de modo que una carga directa como `/ui-kit` llegue a React Router.

## Cómo agregar una nueva pantalla

1. Revisar `/ui-kit` y esta guía; buscar componentes ya existentes antes de crear otros.
2. Crear la pantalla en la ubicación acordada por el equipo y reutilizar Material UI y el tema.
3. Importar la pantalla real en `App.jsx` y reemplazar el `element` de su ruta temporal, manteniéndola como hija de `MainLayout`. No hace falta envolverla nuevamente en el layout.
4. Agregar un acceso a `navigationItems` solo si corresponde; coordinar los cambios compartidos.
5. Para datos simulados, usar los JSON locales asignados a cada integrante y verificar que coincidan exactamente con los DTOs de respuesta del backend. No inventar campos.
6. Validar en móvil, tablet y escritorio, y ejecutar `npm run build`.
7. Actualizar esta guía y el [mapa](MAPA_PANTALLAS.md) cuando cambie el estado de una ruta o componente.

## Convenciones visuales

- Usar Material UI y las variantes del tema antes de definir estilos nuevos.
- Evitar repetir colores y tamaños hardcodeados; emplear `sx`, spacing y breakpoints del tema.
- Reutilizar componentes existentes, mantenerlos pequeños y no duplicar el trabajo de otro integrante.
- Diseñar para móvil, tablet y escritorio, con navegación accesible y sin desbordes horizontales.
- Mantener el layout y la navegación sin lógica de negocio. Los componentes demostrativos del UI Kit no representan contratos de la API.

## Diseño responsive y accesibilidad

- `MainLayout` utiliza `Container` de MUI con ancho máximo `lg` y padding vertical que cambia entre `xs`, `sm` y `md`. Las páginas reciben ese contenedor a través del `Outlet`.
- La Home usa una columna en móvil y dos desde `md`; los bloques inferiores pasan de una a tres columnas desde `sm`.
- La navegación cambia de `Drawer` a barra de escritorio en `md`. Al elegir un enlace o cerrar el menú se recupera el contenido; el menú también se cierra al pasar a escritorio.
- Para una nueva pantalla, revisar que el contenido no desborde a 360 px, que los controles puedan tocarse y leerse y que la estructura se adapte a 768 px y 1440 px. Estos son tamaños de verificación, no breakpoints adicionales.
- Usar títulos y etiquetas de formulario con significado, texto descriptivo para acciones y navegación por teclado. Las imágenes decorativas pueden ocultarse a lectores de pantalla; las informativas necesitan una alternativa textual adecuada.

La lista de comprobaciones antes de integrar una pantalla está en [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md#comprobaciones-antes-de-integrar).
