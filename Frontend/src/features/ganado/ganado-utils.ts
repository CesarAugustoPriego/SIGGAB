import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';
import type { Animal, EstadoAnimal } from './ganado-types';

type GanadoFieldErrorKey =
  | 'numeroArete'
  | 'fechaIngreso'
  | 'pesoInicial'
  | 'idRaza'
  | 'procedencia'
  | 'edadEstimada'
  | 'estadoSanitarioInicial'
  | 'motivoBaja'
  | 'fechaBaja';

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

function toFieldKey(campo: string): GanadoFieldErrorKey | null {
  if (campo === 'numeroArete') return 'numeroArete';
  if (campo === 'fechaIngreso') return 'fechaIngreso';
  if (campo === 'pesoInicial') return 'pesoInicial';
  if (campo === 'idRaza') return 'idRaza';
  if (campo === 'procedencia') return 'procedencia';
  if (campo === 'edadEstimada') return 'edadEstimada';
  if (campo === 'estadoSanitarioInicial') return 'estadoSanitarioInicial';
  if (campo === 'motivoBaja') return 'motivoBaja';
  if (campo === 'fechaBaja') return 'fechaBaja';
  return null;
}

function hasRole(roleName: string | undefined, allowed: string[]) {
  const normalized = normalizeText(roleName);
  return allowed.includes(normalized);
}

export function canViewGanado(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'campo',
  ]);
}

export function canCreateAnimal(roleName: string | undefined) {
  return hasRole(roleName, [
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'campo',
  ]);
}

export function canEditAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canBajaAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canViewAnimalHistorial(roleName: string | undefined) {
  return canViewGanado(roleName);
}

export function getGanadoFieldErrors(error: unknown) {
  const fieldErrors: Partial<Record<GanadoFieldErrorKey, string>> = {};

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

export function getGanadoErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = asValidationIssues(error.payload?.errors);

    if (error.status === 400 && issues.length > 0) {
      return issues[0].mensaje || 'Datos invalidos en el formulario de ganado.';
    }
  }
  return getApiErrorMessage(error, {
    badRequest: 'Datos invalidos en el formulario de ganado.',
    forbidden: 'No tienes permisos para esta accion en ganado.',
    notFound: 'No se encontro el animal solicitado.',
    conflict: 'El numero de arete ya existe.',
  });
}

export function formatEstadoAnimal(estado: EstadoAnimal) {
  if (estado === 'ACTIVO') return 'ACTIVO';
  if (estado === 'VENDIDO') return 'VENDIDO';
  if (estado === 'MUERTO') return 'MUERTO';
  if (estado === 'TRANSFERIDO') return 'TRANSFERIDO';
  return estado;
}

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toNumeric(value: number | string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getCardTestId(numeroArete: string) {
  return `card-${numeroArete}`;
}

export function findAnimalByArete(animals: Animal[], arete: string) {
  return animals.find((animal) => animal.numeroArete === arete) || null;
}
