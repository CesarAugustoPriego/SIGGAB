import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';

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
  }
  return getApiErrorMessage(error, {
    badRequest: 'Datos invalidos para guardar el usuario.',
    forbidden: 'No tienes permisos para gestionar usuarios.',
    notFound: 'El usuario no existe o ya fue eliminado.',
    conflict: 'El username ya existe.',
  });
}
