/**
 * SIGGAB - Aprobaciones utilities.
 * Role-based access control and formatting helpers.
 */
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';

function normalizeRole(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function canViewAprobaciones(rol?: string): boolean {
  const role = normalizeRole(rol);
  return role === 'administrador' || role === 'medico veterinario' || role === 'veterinario';
}

// Backend: PATCH /eventos-sanitarios/:id/aprobar requiere Medico Veterinario.
export function canApproveSanitario(rol?: string): boolean {
  const role = normalizeRole(rol);
  return role === 'medico veterinario' || role === 'veterinario';
}

// Backend: validaciones productivas requieren Administrador.
export function canApproveProductivo(rol?: string): boolean {
  return normalizeRole(rol) === 'administrador';
}

// Backend: /solicitudes-compra/:id/aprobar requiere Administrador.
export function canApproveSolicitudes(rol?: string): boolean {
  return normalizeRole(rol) === 'administrador';
}

export function getAprobacionesErrorMessage(err: unknown): string {
  return getApiErrorMessage(err, {
    forbidden: 'No tienes permisos para consultar o aprobar registros.',
    fallback: 'No fue posible cargar los registros de aprobacion.',
  });
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
