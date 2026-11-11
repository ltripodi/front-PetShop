const env = import.meta.env ?? {};

function idPositivo(valor, nombre) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError(`${nombre} debe ser un entero positivo.`);
  }
  return id;
}

// El proxy de Vite resuelve /api hacia el backend local durante el desarrollo.
// En un despliegue se puede reemplazar por la URL absoluta del gateway o de la API.
export const API_BASE_URL = (env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
export const USUARIO_ACTUAL_ID = idPositivo(env.VITE_USUARIO_ID ?? 1, 'VITE_USUARIO_ID');

/**
 * El backend usa HTTP Basic. La aplicación de autenticación debe guardar este
 * valor al iniciar sesión; mientras no exista, sirve para ejecutar localmente
 * con VITE_API_AUTHORIZATION. Nunca se incluye una clave por defecto.
 */
export function authorizationHeaders() {
  const authorization = globalThis.sessionStorage?.getItem('petshop.authorization')
    ?? env.VITE_API_AUTHORIZATION;
  return authorization?.trim() ? { Authorization: authorization.trim() } : {};
}
