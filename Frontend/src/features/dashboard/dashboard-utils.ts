import { ApiClientError } from '../../types/api';

// ─── Role helpers ─────────────────────────────────────────────────────────────

function norm(v: string | undefined) {
  return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function hasRole(roleName: string | undefined, list: string[]) {
  return list.includes(norm(roleName));
}

/** Puede ver la pantalla Dashboard */
export function canViewDashboard(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'medico veterinario', 'produccion', 'almacen']);
}

/** Puede ver KPIs + Ganado + Stream SSE */
export function canViewResumen(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador']);
}

/** Puede ver panel producción */
export function canViewProduccion(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'produccion']);
}

/** Puede ver panel sanitario */
export function canViewSanitario(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'medico veterinario']);
}

/** Puede ver panel inventario */
export function canViewInventarioDash(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'almacen']);
}

/** Puede ver bitácora */
export function canViewBitacora(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmtDate(v: string | null | undefined) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(v: string | null | undefined) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtNum(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('es-MX') : '0';
}

export function fmtPct(v: number) {
  return `${v.toFixed(2)}%`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins}min`;
  return `hace ${Math.floor(mins / 60)}h`;
}

export function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Color class for the bitácora action badge */
export function getAccionColor(accion: string) {
  const a = accion.toUpperCase();
  if (a.includes('CREAR') || a.includes('REGISTRAR') || a.includes('ENTRADA')) return 'dash-action-create';
  if (a.includes('EDITAR') || a.includes('ACTUALIZAR') || a.includes('PATCH')) return 'dash-action-edit';
  if (a.includes('ELIMINAR') || a.includes('DESACTIVAR') || a.includes('SALIDA')) return 'dash-action-delete';
  if (a.includes('APROBAR')) return 'dash-action-approve';
  if (a.includes('RECHAZAR')) return 'dash-action-reject';
  if (a.includes('RESPALDAR')) return 'dash-action-backup';
  if (a.includes('LOGIN') || a.includes('LOGOUT')) return 'dash-action-auth';
  return 'dash-action-default';
}

/** Color for estado */
export function getEstadoColor(estado: string) {
  const e = estado.toUpperCase();
  if (e === 'ACTIVO') return '#22c55e';
  if (e === 'VENDIDO') return '#3b82f6';
  if (e === 'MUERTO') return '#94a3b8';
  return '#64748b';
}

/** Color for evento reproductivo */
export function getReproColor(tipo: string) {
  const t = tipo.toUpperCase();
  if (t === 'PARTO') return '#22c55e';
  if (t === 'CELO') return '#3b82f6';
  if (t === 'MONTA') return '#8b5cf6';
  if (t.includes('PRE')) return '#eab308';
  if (t === 'ABORTO') return '#ef4444';
  return '#64748b';
}

// ─── Error handling ───────────────────────────────────────────────────────────

export function getDashboardErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'No tienes permisos para esta seccion.';
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message;
  }
  return 'Ocurrio un error inesperado.';
}
