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

La aplicación no necesita que el backend esté iniciado. Para verificar la compilación, ejecutá `npm run build` desde `front-PetShop`.

## Datos simulados

Todas las pantallas funcionan con los JSON de `public/data/`, que respetan los DTOs de respuesta del backend: `productos.json` (catálogo), `carrito.json` (carrito del usuario 1, con tres productos) y `compras.json` (ocho compras del usuario 1). Las operaciones del carrito y el checkout se simulan en memoria con las mismas validaciones del backend.

Recorrido sugerido con `npm run dev`:

1. **Productos:** buscar y filtrar el catálogo, abrir un producto y agregarlo al carrito.
2. **Carrito:** cambiar cantidades o eliminar productos y elegir **Finalizar compra**.
3. **Checkout:** revisar y **Confirmar compra**. Se registra la compra 9 y el carrito queda vacío.
4. **Compras:** la compra nueva encabeza el historial. Buscar por producto o número, filtrar por mes, ordenar y abrir el detalle.

Los cambios sólo viven en memoria: al recargar la página se vuelve a los datos iniciales.

## Pruebas

```bash
node --test src/services/carritoService.test.js src/services/comprasService.test.js
```

Con `npm run dev` en ejecución, abrí `/tests/` (por ejemplo [http://127.0.0.1:5173/tests/](http://127.0.0.1:5173/tests/)) para ejecutar todas las pruebas de navegador: carrito, historial de compras, checkout y flujo completo de compra.

## Documentación

- [UI Kit y arquitectura visual](docs/UI_KIT.md)
- [Guía de integración](docs/GUIA_INTEGRACION.md)
- [Mapa de pantallas y endpoints](docs/MAPA_PANTALLAS.md)
- Módulos: [detalle de producto](docs/DETALLE_PRODUCTO.md), [carrito](docs/CARRITO.md) y [compras: checkout, historial y detalle](docs/COMPRAS.md)
