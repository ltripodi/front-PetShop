import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormHelperText,
  InputLabel, ListItemText, MenuItem, Radio, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  USUARIO_ACTUAL_ID,
  actualizarProducto,
  crearProducto,
  getOpcionesProducto,
  getProductoGestion,
} from '../services/gestionProductosService';

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  categoriaId: '',
  marcaId: '',
  especiesIds: [],
  disponible: true,
  imagenes: [''],
  principal: 0,
};

// Los valores del formulario son texto (así los entregan los campos); se convierten al armar el pedido.
function desdeProducto(producto) {
  const imagenes = [...producto.imagenes].sort((primera, segunda) => primera.posicion - segunda.posicion);
  return {
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: String(producto.precio),
    stock: String(producto.stock),
    categoriaId: producto.categoria ? String(producto.categoria.id) : '',
    marcaId: producto.marca ? String(producto.marca.id) : '',
    especiesIds: producto.especies.map(({ id }) => String(id)),
    disponible: producto.disponible,
    imagenes: imagenes.map(({ ubicacion }) => ubicacion),
    principal: Math.max(0, imagenes.findIndex(({ principal }) => principal)),
  };
}

// Mismas reglas que ProductoService: se avisa acá antes de enviar, y el servicio las vuelve a validar.
function validar(formulario) {
  const errores = {};
  if (!formulario.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
  if (!formulario.descripcion.trim()) errores.descripcion = 'La descripción es obligatoria.';

  const precio = Number(formulario.precio);
  if (formulario.precio.trim() === '') errores.precio = 'El precio es obligatorio.';
  else if (!Number.isFinite(precio) || precio < 0) errores.precio = 'El precio debe ser mayor o igual a 0.';

  const stock = Number(formulario.stock);
  if (formulario.stock.trim() === '') errores.stock = 'El stock es obligatorio.';
  else if (!Number.isSafeInteger(stock) || stock < 0) errores.stock = 'El stock debe ser un entero mayor o igual a 0.';

  if (!formulario.categoriaId) errores.categoriaId = 'Elegí una categoría.';
  if (!formulario.imagenes.some((ubicacion) => ubicacion.trim())) errores.imagenes = 'Agregá al menos una imagen.';
  return errores;
}

function armarPedido(formulario) {
  // Las filas vacías se descartan; si la principal estaba vacía, lo es la primera que queda.
  const imagenes = formulario.imagenes
    .map((ubicacion, indice) => ({ ubicacion: ubicacion.trim(), principal: indice === formulario.principal }))
    .filter(({ ubicacion }) => ubicacion);
  return {
    nombre: formulario.nombre.trim(),
    descripcion: formulario.descripcion.trim(),
    precio: Number(formulario.precio),
    stock: Number(formulario.stock),
    categoriaId: Number(formulario.categoriaId),
    marcaId: formulario.marcaId === '' ? null : Number(formulario.marcaId),
    creadorId: USUARIO_ACTUAL_ID,
    disponible: formulario.disponible,
    especiesIds: formulario.especiesIds.map(Number),
    imagenes: imagenes.map((imagen, indice) => ({ ubicacion: imagen.ubicacion, posicion: indice + 1, principal: imagen.principal })),
  };
}

export default function ProductoForm() {
  const { id } = useParams();
  // La clave reinicia el estado al pasar de crear a editar, o de un producto a otro.
  return <Formulario key={id ?? 'nuevo'} id={id} />;
}

function Formulario({ id }) {
  const editando = id !== undefined;
  const navigate = useNavigate();
  const [opciones, setOpciones] = useState(null);
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [reintento, setReintento] = useState(0);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setErrorCarga(null);
    Promise.all([
      getOpcionesProducto({ signal: controller.signal }),
      editando ? getProductoGestion(id, { signal: controller.signal }) : null,
    ])
      .then(([opcionesCargadas, productoCargado]) => {
        if (controller.signal.aborted) return;
        setOpciones(opcionesCargadas);
        setProducto(productoCargado);
        if (productoCargado) setFormulario(desdeProducto(productoCargado));
      })
      .catch((error) => { if (!controller.signal.aborted) setErrorCarga(error); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [id, editando, reintento]);

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    setErrorEnvio(null);
  }

  function cambiarImagen(indice, valor) {
    setFormulario((actual) => ({ ...actual, imagenes: actual.imagenes.map((ubicacion, posicion) => (posicion === indice ? valor : ubicacion)) }));
    setErrores((actual) => ({ ...actual, imagenes: undefined }));
    setErrorEnvio(null);
  }

  function agregarImagen() {
    setFormulario((actual) => ({ ...actual, imagenes: [...actual.imagenes, ''] }));
  }

  function quitarImagen(indice) {
    setFormulario((actual) => {
      const imagenes = actual.imagenes.filter((_, posicion) => posicion !== indice);
      // Si se quita la principal pasa a serlo la primera; si se quita una anterior, se corre el índice.
      let principal = actual.principal;
      if (indice === principal) principal = 0;
      else if (indice < principal) principal -= 1;
      return { ...actual, imagenes, principal };
    });
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    const encontrados = validar(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    setErrorEnvio(null);
    try {
      const pedido = armarPedido(formulario);
      const guardado = editando
        ? await actualizarProducto(id, pedido, USUARIO_ACTUAL_ID)
        : await crearProducto(pedido);
      navigate('/gestion-productos', {
        state: { mensaje: { severity: 'success', texto: `Producto «${guardado.nombre}» ${editando ? 'actualizado' : 'creado'} correctamente.` } },
      });
    } catch (error) {
      setErrorEnvio(error.message);
      setEnviando(false);
    }
  }

  const titulo = editando ? 'Editar producto' : 'Nuevo producto';
  const sinPermiso = editando && producto && producto.creador?.id !== USUARIO_ACTUAL_ID;

  const encabezado = (
    <Box component="header">
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Gestión de productos</Typography>
      <Typography component="h1" variant="h2">{titulo}</Typography>
    </Box>
  );

  if (cargando) {
    return (
      <Stack spacing={3}>
        {encabezado}
        <Box role="status" aria-label="Cargando formulario" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (errorCarga) {
    const noExiste = errorCarga.name === 'RecursoNoEncontradoError';
    return (
      <Stack spacing={3}>
        {encabezado}
        <Alert
          severity="error"
          action={noExiste ? undefined : <Button color="inherit" size="small" onClick={() => setReintento((clave) => clave + 1)}>Reintentar</Button>}
        >
          {noExiste ? 'No encontramos ese producto.' : 'No pudimos cargar el formulario. Revisá tu conexión e intentá de nuevo.'}
        </Alert>
        <Box><Button component={RouterLink} to="/gestion-productos" variant="outlined">Volver a la gestión</Button></Box>
      </Stack>
    );
  }

  if (sinPermiso) {
    return (
      <Stack spacing={3}>
        {encabezado}
        <Alert severity="warning">Solo el usuario que publicó el producto puede gestionarlo.</Alert>
        <Box><Button component={RouterLink} to="/gestion-productos" variant="outlined">Volver a la gestión</Button></Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {encabezado}
      <Box component="form" noValidate onSubmit={enviar} aria-label={titulo}>
        <Stack spacing={3}>
          {errorEnvio && <Alert severity="error">{errorEnvio}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <TextField
              label="Nombre"
              value={formulario.nombre}
              onChange={(evento) => cambiar('nombre', evento.target.value)}
              error={Boolean(errores.nombre)}
              helperText={errores.nombre}
              required
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              label="Descripción"
              value={formulario.descripcion}
              onChange={(evento) => cambiar('descripcion', evento.target.value)}
              error={Boolean(errores.descripcion)}
              helperText={errores.descripcion}
              required
              multiline
              minRows={3}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              label="Precio"
              type="number"
              value={formulario.precio}
              onChange={(evento) => cambiar('precio', evento.target.value)}
              error={Boolean(errores.precio)}
              helperText={errores.precio ?? 'En pesos argentinos.'}
              required
              slotProps={{ htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' } }}
            />
            <TextField
              label="Stock"
              type="number"
              value={formulario.stock}
              onChange={(evento) => cambiar('stock', evento.target.value)}
              error={Boolean(errores.stock)}
              helperText={errores.stock ?? 'Unidades disponibles.'}
              required
              slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            />
            <FormControl required error={Boolean(errores.categoriaId)} fullWidth>
              <InputLabel id="producto-categoria-label">Categoría</InputLabel>
              <Select
                labelId="producto-categoria-label"
                label="Categoría"
                value={formulario.categoriaId}
                onChange={(evento) => cambiar('categoriaId', evento.target.value)}
              >
                {opciones.categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={String(categoria.id)}>{categoria.nombre}</MenuItem>
                ))}
              </Select>
              {errores.categoriaId && <FormHelperText>{errores.categoriaId}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="producto-marca-label">Marca</InputLabel>
              <Select
                labelId="producto-marca-label"
                label="Marca"
                value={formulario.marcaId}
                onChange={(evento) => cambiar('marcaId', evento.target.value)}
              >
                <MenuItem value="">Sin marca</MenuItem>
                {opciones.marcas.map((marca) => (
                  <MenuItem key={marca.id} value={String(marca.id)}>{marca.nombre}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Opcional.</FormHelperText>
            </FormControl>
            <FormControl fullWidth sx={{ gridColumn: { sm: '1 / -1' } }}>
              <InputLabel id="producto-especies-label">Especies</InputLabel>
              <Select
                multiple
                labelId="producto-especies-label"
                label="Especies"
                value={formulario.especiesIds}
                onChange={(evento) => cambiar('especiesIds', evento.target.value)}
                renderValue={(seleccion) => opciones.especies.filter(({ id: especieId }) => seleccion.includes(String(especieId))).map(({ nombre }) => nombre).join(', ')}
              >
                {opciones.especies.map((especie) => (
                  <MenuItem key={especie.id} value={String(especie.id)}>
                    <Checkbox checked={formulario.especiesIds.includes(String(especie.id))} />
                    <ListItemText primary={especie.nombre} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Opcional. Para qué animales es el producto.</FormHelperText>
            </FormControl>
          </Box>

          <Box component="fieldset" sx={{ border: 1, borderColor: errores.imagenes ? 'error.main' : 'divider', borderRadius: 2, p: 2, m: 0, minWidth: 0 }}>
            <Typography component="legend" variant="subtitle1" sx={{ fontWeight: 700, px: 1 }}>Imágenes</Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Pegá la dirección de cada imagen y marcá cuál es la principal.
              </Typography>
              {formulario.imagenes.map((ubicacion, indice) => (
                // El índice es la identidad de la fila: no hay otro dato estable y las filas no se reordenan.
                <Stack key={indice} direction="row" spacing={1} alignItems="flex-start">
                  <Radio
                    checked={formulario.principal === indice}
                    onChange={() => cambiar('principal', indice)}
                    slotProps={{ input: { 'aria-label': `Imagen ${indice + 1} principal` } }}
                    sx={{ mt: 0.5 }}
                  />
                  <TextField
                    label={`Imagen ${indice + 1}`}
                    placeholder="https://…"
                    value={ubicacion}
                    onChange={(evento) => cambiarImagen(indice, evento.target.value)}
                    fullWidth
                    size="small"
                  />
                  <Button
                    onClick={() => quitarImagen(indice)}
                    disabled={formulario.imagenes.length === 1}
                    color="inherit"
                    aria-label={`Quitar imagen ${indice + 1}`}
                    sx={{ mt: 0.25, flexShrink: 0 }}
                  >
                    Quitar
                  </Button>
                </Stack>
              ))}
              {errores.imagenes && <FormHelperText error>{errores.imagenes}</FormHelperText>}
              <Box><Button onClick={agregarImagen} variant="outlined" size="small">Agregar imagen</Button></Box>
            </Stack>
          </Box>

          <FormControlLabel
            control={<Switch checked={formulario.disponible} onChange={(evento) => cambiar('disponible', evento.target.checked)} />}
            label="Disponible en el catálogo"
          />

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
            <Button component={RouterLink} to="/gestion-productos" color="inherit" disabled={enviando}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={enviando}>
              {enviando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Crear producto')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
