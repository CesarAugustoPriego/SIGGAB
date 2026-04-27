import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';
import type { EstadoSolicitud, TipoMovimiento } from './inventario-types';

// ─── Role helpers ─────────────────────────────────────────────────────────────

function norm(v: string | undefined) {
  return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function hasRole(roleName: string | undefined, list: string[]) {
  return list.includes(norm(roleName));
}

/** Puede ver la pantalla de inventario */
export function canViewInventario(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'almacen']);
}

/** Puede crear/editar insumos */
export function canManageInsumos(roleName: string | undefined) {
  return hasRole(roleName, ['administrador', 'almacen']);
}

/** Puede crear/editar tipos de insumo */
export function canManageTipos(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

/** Puede registrar movimientos */
export function canCreateMovimiento(roleName: string | undefined) {
  return hasRole(roleName, ['administrador', 'almacen']);
}

/** Puede crear solicitudes de compra (RN-13) */
export function canCreateSolicitud(roleName: string | undefined) {
  return hasRole(roleName, ['almacen']);
}

/** Puede aprobar/rechazar solicitudes (RN-14) */
export function canAprobarSolicitud(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

/** Puede ver compras realizadas */
export function canViewCompras(roleName: string | undefined) {
  return hasRole(roleName, ['administrador', 'almacen']);
}

/** Puede registrar compras realizadas */
export function canCreateCompra(roleName: string | undefined) {
  return hasRole(roleName, ['almacen']);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function toInputDate(v: string | null | undefined) {
  if (!v) return '';
  return v.slice(0, 10);
}

export function toNum(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function fmtCurrency(v: number | string) {
  return `$${toNum(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getEstadoSolicitudClass(e: EstadoSolicitud) {
  if (e === 'APROBADA') return 'is-approved';
  if (e === 'RECHAZADA') return 'is-rejected';
  return 'is-pending';
}

export function getMovimientoClass(t: TipoMovimiento) {
  return t === 'ENTRADA' ? 'is-entrada' : 'is-salida';
}

export function getStockLevel(stock: number) {
  if (stock <= 0) return 'is-stock-empty';
  if (stock < 10) return 'is-stock-critical';
  if (stock <= 50) return 'is-stock-low';
  return 'is-stock-ok';
}

// ─── Error handling ───────────────────────────────────────────────────────────

export function getInventarioErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = Array.isArray(error.payload?.errors) ? error.payload.errors : [];
    if (error.status === 400 && issues.length > 0) {
      const first = issues[0];
      return String((first as { mensaje?: string }).mensaje || 'Datos invalidos.');
    }
  }
  return getApiErrorMessage(error, {
    badRequest: 'Datos invalidos.',
    forbidden: 'No tienes permisos para esta accion.',
    notFound: 'Registro no encontrado.',
  });
}
