import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';
import type {
  EstadoAprobacionSanitaria,
  EstadoCalendarioSanitario,
  EventoSanitario,
} from './sanitario-types';

type SanitarioFieldErrorKey =
  | 'idAnimal'
  | 'idTipoEvento'
  | 'fechaEvento'
  | 'diagnostico'
  | 'medicamento'
  | 'dosis'
  | 'estadoAprobacion'
  | 'fechaProgramada'
  | 'fechaAlerta'
  | 'estado';

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

function hasRole(roleName: string | undefined, allowed: string[]) {
  const normalized = normalizeText(roleName);
  return allowed.includes(normalized);
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

function toFieldKey(campo: string): SanitarioFieldErrorKey | null {
  if (campo === 'idAnimal') return 'idAnimal';
  if (campo === 'idTipoEvento') return 'idTipoEvento';
  if (campo === 'fechaEvento') return 'fechaEvento';
  if (campo === 'diagnostico') return 'diagnostico';
  if (campo === 'medicamento') return 'medicamento';
  if (campo === 'dosis') return 'dosis';
  if (campo === 'estadoAprobacion') return 'estadoAprobacion';
  if (campo === 'fechaProgramada') return 'fechaProgramada';
  if (campo === 'fechaAlerta') return 'fechaAlerta';
  if (campo === 'estado') return 'estado';
  return null;
}

export function canViewSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'campo',
  ]);
}

export function canListSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
  ]);
}

export function canCreateEventoSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'medico veterinario',
    'campo',
  ]);
}

export function canEditEventoSanitario(roleName: string | undefined) {
  return hasRole(roleName, ['medico veterinario']);
}

export function canAprobarEventoSanitario(roleName: string | undefined) {
  return hasRole(roleName, ['medico veterinario']);
}

export function canManageCalendarioSanitario(roleName: string | undefined) {
  return hasRole(roleName, ['medico veterinario']);
}

export function canViewAlertasSanitarias(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
  ]);
}

export function getSanitarioFieldErrors(error: unknown) {
  const fieldErrors: Partial<Record<SanitarioFieldErrorKey, string>> = {};

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

export function getSanitarioErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = asValidationIssues(error.payload?.errors);

    if (error.status === 400 && issues.length > 0) {
      return issues[0].mensaje || 'Datos invalidos para modulo sanitario.';
    }
  }
  return getApiErrorMessage(error, {
    badRequest: 'Datos invalidos para modulo sanitario.',
    forbidden: 'No tienes permisos para esta accion sanitaria.',
    notFound: 'No se encontro el registro sanitario solicitado.',
    conflict: 'Conflicto de datos en modulo sanitario.',
  });
}

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function formatEstadoAprobacion(estado: EstadoAprobacionSanitaria) {
  if (estado === 'PENDIENTE') return 'PENDIENTE';
  if (estado === 'APROBADO') return 'APROBADO';
  if (estado === 'RECHAZADO') return 'RECHAZADO';
  return estado;
}

export function formatEstadoCalendario(estado: EstadoCalendarioSanitario) {
  if (estado === 'PENDIENTE') return 'PENDIENTE';
  if (estado === 'COMPLETADO') return 'COMPLETADO';
  if (estado === 'CANCELADO') return 'CANCELADO';
  return estado;
}

export function getEventoCardTestId(evento: EventoSanitario) {
  const arete = evento.animal?.numeroArete || 'sin-arete';
  return `sanitario-evento-${arete}-${evento.idEvento}`;
}
