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

La base visual no necesita que el backend esté iniciado. Para verificar la compilación, ejecutá `npm run build` desde `front-PetShop`.

## Documentación

Documentación: [UI Kit y arquitectura visual](docs/UI_KIT.md), [guía de integración](docs/GUIA_INTEGRACION.md) y [mapa de pantallas y endpoints](docs/MAPA_PANTALLAS.md).
