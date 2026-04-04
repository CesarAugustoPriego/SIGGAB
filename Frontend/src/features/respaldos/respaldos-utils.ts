import { ApiClientError } from '../../types/api';
import type { BackupSource } from './respaldos-types';

function normalizeRole(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function canViewRespaldos(roleName: string | undefined) {
  return normalizeRole(roleName) === 'administrador';
}

export function formatBackupDateTime(value: string | null | undefined) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number | null | undefined) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value.toFixed(0)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatBackupSource(source: BackupSource | null | undefined) {
  if (source === 'MANUAL') return 'Manual';
  if (source === 'AUTO_SCHEDULER') return 'Automatico';
  if (!source) return 'Desconocido';
  return String(source);
}

export function getRespaldosErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'No tienes permisos para administrar respaldos.';
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message || 'No fue posible completar la operacion de respaldo.';
  }
  return 'Ocurrio un error inesperado en el modulo de respaldos.';
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'respaldo-siggab.json';
}

export function saveBackupBlob(blob: Blob, fileName: string) {
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
