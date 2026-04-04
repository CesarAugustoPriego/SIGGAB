import { ApiClientError } from '../../types/api';

interface ApiErrorMessageOptions {
  badRequest?: string;
  forbidden?: string;
  notFound?: string;
  conflict?: string;
  fallback?: string;
}

const DEFAULT_MESSAGES = {
  badRequest: 'Datos invalidos.',
  forbidden: 'No tienes permisos para esta accion.',
  notFound: 'Registro no encontrado.',
  conflict: 'Existe un conflicto con los datos enviados.',
  fallback: 'Ocurrio un error inesperado.',
} as const;

export function getApiErrorMessage(error: unknown, options: ApiErrorMessageOptions = {}) {
  const messages = {
    ...DEFAULT_MESSAGES,
    ...options,
  };

  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return messages.forbidden;
    if (error.status === 404) return error.message || messages.notFound;
    if (error.status === 409) return error.message || messages.conflict;
    if (error.status === 400) return error.message || messages.badRequest;
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message || messages.fallback;
  }

  return messages.fallback;
}
