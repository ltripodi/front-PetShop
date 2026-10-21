// Utilidades compartidas por las pruebas de navegador de compras y checkout.
// Cada página de pruebas tiene un <div id="pruebas"> y un <pre id="resultados">.
import { act } from 'react';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export const contenedor = document.getElementById('pruebas');
export const fetchOriginal = globalThis.fetch;

export function comprobar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

export function iguales(recibido, esperado, mensaje) {
  comprobar(JSON.stringify(recibido) === JSON.stringify(esperado), `${mensaje}\nRecibido: ${JSON.stringify(recibido)}\nEsperado: ${JSON.stringify(esperado)}`);
}

export async function leerDatos(archivo) {
  return (await fetchOriginal(`/data/${archivo}`)).json();
}

// Responde con copias de los datos por URL. Una función permite simular demoras o errores.
export function simularFetch(datos) {
  globalThis.fetch = async (url, opciones) => {
    const respuesta = datos[url];
    if (typeof respuesta === 'function') return respuesta(opciones);
    if (!respuesta) throw new Error(`Solicitud inesperada: ${url}`);
    return { ok: true, json: async () => structuredClone(respuesta) };
  };
}

// Falla mientras fallar() sea verdadero; después responde con los datos.
export function fallaHasta(fallar, datos) {
  return async () => {
    if (fallar()) throw new TypeError('Sin conexión');
    return { ok: true, json: async () => structuredClone(datos) };
  };
}

// Las lecturas pasan por fetch y microtareas: se espera a que la pantalla refleje el resultado.
export async function esperar(condicion, mensaje) {
  for (let intento = 0; intento < 150; intento += 1) {
    if (condicion()) return;
    await act(async () => { await new Promise((resolver) => { setTimeout(resolver, 10); }); });
  }
  throw new Error(`Tiempo agotado: ${mensaje}`);
}

export const titulo = () => contenedor.querySelector('h1')?.textContent;

export function control(nombre, origen = contenedor) {
  const encontrado = [...origen.querySelectorAll('button, a')].find((actual) => (
    (actual.getAttribute('aria-label') ?? actual.textContent.trim()) === nombre
  ));
  comprobar(encontrado, `No se encontró el control: ${nombre}`);
  return encontrado;
}

export function existeControl(nombre, origen = contenedor) {
  return [...origen.querySelectorAll('button, a')].some((actual) => (actual.getAttribute('aria-label') ?? actual.textContent.trim()) === nombre);
}

export async function pulsar(nombre, origen = contenedor) {
  const actual = control(nombre, origen);
  comprobar(!actual.disabled, `El control está deshabilitado: ${nombre}`);
  await act(async () => { actual.click(); });
}

export async function escribir(etiqueta, valor) {
  const campo = [...contenedor.querySelectorAll('input')].find((input) => input.labels?.[0]?.textContent === etiqueta);
  comprobar(campo, `No se encontró el campo: ${etiqueta}`);
  // React escucha el evento input con el valor asignado por el setter nativo.
  const asignar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    asignar.call(campo, valor);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// Select de MUI: se abre con mousedown y las opciones se muestran en un portal fuera del contenedor.
export async function elegir(etiqueta, opcion) {
  const label = [...contenedor.querySelectorAll('label')].find((actual) => actual.textContent === etiqueta);
  comprobar(label, `No se encontró el selector: ${etiqueta}`);
  const combo = label.parentElement.querySelector('[role="combobox"]');
  await act(async () => { combo.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); });
  const item = [...document.querySelectorAll('[role="listbox"] [role="option"]')].find((actual) => actual.textContent === opcion);
  comprobar(item, `No se encontró la opción: ${opcion}`);
  await act(async () => { item.click(); });
  await esperar(() => !document.querySelector('[role="listbox"]'), 'El menú del selector no se cerró.');
}

// Ejecuta las pruebas en orden; limpiar() corre siempre después de cada una.
export async function ejecutarPruebas(pruebas, { nombre, limpiar }) {
  const resultados = document.getElementById('resultados');
  const urlPruebas = window.location.href;
  let aprobadas = 0;
  const salida = [];
  for (const { nombre: nombrePrueba, ejecutar } of pruebas) {
    try {
      await ejecutar();
      aprobadas += 1;
      salida.push(`OK: ${nombrePrueba}`);
    } catch (error) {
      salida.push(`ERROR: ${nombrePrueba}\n${error.stack}`);
    } finally {
      await limpiar();
      globalThis.fetch = fetchOriginal;
      window.history.replaceState(null, '', urlPruebas);
    }
    resultados.textContent = `${aprobadas}/${pruebas.length} aprobadas\n\n${salida.join('\n')}`;
  }
  document.title = `${aprobadas}/${pruebas.length} — ${nombre}`;
}
