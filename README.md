# front-PetShop

## Abrir la aplicación

La aplicación usa React, Vite, Material UI y React Router. Necesitás Node.js 18, 20 o 22 en adelante.

Desde la carpeta que contiene el repositorio, entrá al frontend e instalá sus dependencias la primera vez:

```bash
cd front-PetShop
npm ci
```

Si ya estás dentro de `front-PetShop`, no hace falta ejecutar `cd front-PetShop`. Luego iniciá el servidor:

```bash
npm run dev -- --host 127.0.0.1
```

Abrí estas direcciones en el navegador mientras la terminal siga abierta:

- **Página principal:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **UI Kit:** [http://127.0.0.1:5173/ui-kit](http://127.0.0.1:5173/ui-kit)

Si el puerto `5173` está ocupado, Vite mostrará otra dirección en la terminal: abrí esa dirección para la página principal y agregale `/ui-kit` para ver el UI Kit. Para detener el servidor, presioná `Ctrl + C` en la terminal.

El catálogo y las pantallas de compras aún usan datos de demostración, pero el
carrito sí requiere el backend iniciado y autenticación HTTP Basic. Copiá
`.env.example` a `.env.local`, completá el usuario y la autorización de una
cuenta existente, e iniciá `back-PetShop` con `./mvnw spring-boot:run`. Vite
redirige automáticamente las llamadas `/api` a `http://localhost:8080`.

Para verificar la compilación, ejecutá `npm run build` desde `front-PetShop`.

## Datos simulados

Las pantallas de catálogo y compras todavía usan los JSON de `public/data/`.
El carrito usa los endpoints persistidos del backend y no lee
`public/data/carrito.json`; ese archivo se conserva como fixture histórico.

Recorrido sugerido con `npm run dev`:

1. **Productos:** buscar y filtrar el catálogo, abrir un producto y agregarlo al carrito.
2. **Carrito:** cambiar cantidades o eliminar productos y elegir **Finalizar compra**.
3. **Checkout:** revisar y **Confirmar compra**. Se registra la compra 9 y el carrito queda vacío.
4. **Compras:** la compra nueva encabeza el historial. Buscar por producto o número, filtrar por mes, ordenar y abrir el detalle.

Los cambios del carrito sobreviven a una recarga porque viven en la base de
datos. Las compras simuladas y el catálogo de demostración siguen siendo
locales.

## Pruebas

```bash
npm run test:carrito
node src/services/comprasService.test.js
```

Con `npm run dev` en ejecución, abrí `/tests/` (por ejemplo [http://127.0.0.1:5173/tests/](http://127.0.0.1:5173/tests/)) para ejecutar todas las pruebas de navegador: carrito, historial de compras, checkout y flujo completo de compra.

## Documentación

- [UI Kit y arquitectura visual](docs/UI_KIT.md)
- [Guía de integración](docs/GUIA_INTEGRACION.md)
- [Mapa de pantallas y endpoints](docs/MAPA_PANTALLAS.md)
- Módulos: [detalle de producto](docs/DETALLE_PRODUCTO.md), [carrito](docs/CARRITO.md) y [compras: checkout, historial y detalle](docs/COMPRAS.md)
