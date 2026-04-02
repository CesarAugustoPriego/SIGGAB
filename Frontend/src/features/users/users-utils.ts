import { ApiClientError } from '../../types/api';

type UsersFieldErrorKey = 'nombreCompleto' | 'username' | 'idRol' | 'password';

interface ValidationIssue {
  campo?: string;
  mensaje?: string;
}

function normalizeText(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function asValidationIssues(payloadErrors: unknown): ValidationIssue[] {
  if (!Array.isArray(payloadErrors)) return [];
  return payloadErrors
    .filter((issue) => issue && typeof issue === 'object')
    .map((issue) => ({
      campo: String((issue as { campo?: unknown }).campo || ''),
      mensaje: String((issue as { mensaje?: unknown }).mensaje || ''),
    }))
    .filter((issue) => issue.mensaje);
}

function toFieldKey(campo: string): UsersFieldErrorKey | null {
  if (campo === 'nombreCompleto') return 'nombreCompleto';
  if (campo === 'username') return 'username';
  if (campo === 'idRol') return 'idRol';
  if (campo === 'password') return 'password';
  return null;
}

export function isAdministratorRole(roleName: string | undefined) {
  return normalizeText(roleName) === 'administrador';
}

export function formatRoleLabel(roleName: string) {
  return roleName.replace(/_/g, ' ');
}

export function getUsersFieldErrors(error: unknown) {
  const fieldErrors: Partial<Record<UsersFieldErrorKey, string>> = {};

  if (!(error instanceof ApiClientError)) {
    return fieldErrors;
  }

  const issues = asValidationIssues(error.payload?.errors);
  for (const issue of issues) {
    const key = toFieldKey(issue.campo || '');
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.mensaje || 'Valor invalido.';
    }
  }

  return fieldErrors;
}

export function getUsersErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = asValidationIssues(error.payload?.errors);

    if (error.status === 400 && issues.length > 0) {
      return issues[0].mensaje || 'Datos invalidos para guardar el usuario.';
    }

    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'No tienes permisos para gestionar usuarios.';
    if (error.status === 409) return error.message || 'El username ya existe.';
    if (error.status === 400) return error.message || 'Datos invalidos para guardar el usuario.';
    if (error.status === 404) return 'El usuario no existe o ya fue eliminado.';
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message;
  }

  return 'Ocurrio un error inesperado.';
}
