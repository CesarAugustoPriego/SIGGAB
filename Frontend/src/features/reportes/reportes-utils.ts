import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';

function normalizeRole(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasRole(roleName: string | undefined, allowedRoles: string[]) {
  return allowedRoles.includes(normalizeRole(roleName));
}

export function canViewReportes(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'produccion',
    'almacen',
  ]);
}

export function canViewReporteSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'almacen',
  ]);
}

export function canViewReporteProductivo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'produccion',
  ]);
}

export function canViewReporteAdministrativo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'almacen',
  ]);
}

export function canViewReporteComparativo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'produccion',
  ]);
}

function toInputDateFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getTodayInputDate() {
  return toInputDateFromDate(new Date());
}

export function getDaysAgoInputDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toInputDateFromDate(date);
}

export function isValidDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return false;
  return endDate >= startDate;
}

export function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return '--';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatNumber(value: number | string | null | undefined) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0';
  return numericValue.toLocaleString('es-MX');
}

export function formatDecimal(value: number | string | null | undefined, digits = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return `0.${'0'.repeat(digits)}`;
  return numericValue.toLocaleString('es-MX', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercentage(value: number | string | null | undefined) {
  return `${formatDecimal(value, 2)}%`;
}

export function getEstadoClass(estado: string) {
  if (estado === 'APROBADO' || estado === 'APROBADA') return 'is-approved';
  if (estado === 'RECHAZADO' || estado === 'RECHAZADA') return 'is-rejected';
  return 'is-pending';
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'reporte-siggab';
}

export function saveBlobAsFile(blob: Blob, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = blobUrl;
  anchor.download = safeName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

export function getReportesErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return 'No se encontraron datos para el reporte solicitado.';
  }
  return getApiErrorMessage(error, {
    badRequest: 'Filtros invalidos para generar el reporte.',
    forbidden: 'No tienes permisos para consultar este reporte.',
    notFound: 'No se encontraron datos para el reporte solicitado.',
    fallback: 'Ocurrio un error inesperado al consultar reportes.',
  });
}
