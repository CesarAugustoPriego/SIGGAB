/**
 * SIGGAB — Aprobaciones utilities.
 * Role-based access control and formatting helpers.
 */

const ROLES_VIEW_APROBACIONES = ['ADMINISTRADOR', 'MEDICO VETERINARIO', 'VETERINARIO', 'MÉDICO VETERINARIO', 'ADMIN', 'ADMINISTRATOR'];

export function canViewAprobaciones(rol?: string): boolean {
  if (!rol) return false;
  return ROLES_VIEW_APROBACIONES.includes(rol.toUpperCase());
}

export function canApproveSanitario(rol?: string): boolean {
  if (!rol) return false;
  return ['ADMINISTRADOR', 'MEDICO VETERINARIO', 'VETERINARIO', 'MÉDICO VETERINARIO'].includes(rol.toUpperCase());
}

export function canApproveProductivo(rol?: string): boolean {
  if (!rol) return false;
  return rol.toUpperCase().includes('ADMIN');
}

export function canApproveSolicitudes(rol?: string): boolean {
  if (!rol) return false;
  return rol.toUpperCase().includes('ADMIN');
}

export function getAprobacionesErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error desconocido al cargar aprobaciones.';
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
