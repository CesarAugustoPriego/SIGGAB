import { ApiClientError } from '../../types/api';
import type { EstadoRegistro, TipoEventoReproductivo } from './productivo-types';

// ─── Role helpers ─────────────────────────────────────────────────────────────

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

/** Puede ver la pantalla de producción */
export function canViewProductivo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'produccion',
    'medico veterinario',
  ]);
}

/** Puede ver listados de registros productivos */
export function canListProductivo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'produccion',
  ]);
}

/** Puede crear lotes */
export function canCreateLote(roleName: string | undefined) {
  return hasRole(roleName, ['produccion', 'administrador']);
}

/** Puede crear registros (peso, leche, repro) */
export function canCreateRegistro(roleName: string | undefined) {
  return hasRole(roleName, ['produccion', 'campo', 'administrador']);
}

/** Puede editar registros (solo Producción, solo PENDIENTE) */
export function canEditRegistro(roleName: string | undefined) {
  return hasRole(roleName, ['produccion']);
}

/** Puede validar (aprobar/rechazar) registros y lotes */
export function canValidarRegistro(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

/** Puede ver eventos reproductivos (incluye veterinario) */
export function canViewReproductivos(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'produccion',
    'medico veterinario',
  ]);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toNumeric(value: number | string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatEstadoRegistro(estado: EstadoRegistro) {
  return estado;
}

export function getEstadoClass(estado: EstadoRegistro) {
  if (estado === 'APROBADO') return 'is-approved';
  if (estado === 'RECHAZADO') return 'is-rejected';
  return 'is-pending';
}

export function getTipoEventoClass(tipo: TipoEventoReproductivo) {
  if (tipo === 'PARTO') return 'is-parto';
  if (tipo === 'PREÑEZ') return 'is-prenez';
  if (tipo === 'MONTA') return 'is-monta';
  if (tipo === 'CELO') return 'is-celo';
  if (tipo === 'ABORTO') return 'is-aborto';
  return '';
}

// ─── Error handling ───────────────────────────────────────────────────────────

interface ValidationIssue {
  campo?: string;
  mensaje?: string;
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

export function getProductivoErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = asValidationIssues(error.payload?.errors);

    if (error.status === 400 && issues.length > 0) {
      return issues[0].mensaje || 'Datos invalidos en el formulario.';
    }

    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'No tienes permisos para esta accion.';
    if (error.status === 404) return error.message || 'Registro no encontrado.';
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message;
  }

  return 'Ocurrio un error inesperado.';
}
