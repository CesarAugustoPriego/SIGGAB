import { getApiErrorMessage } from '../../shared/errors/api-error-messages';
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
  return getApiErrorMessage(error, {
    forbidden: 'No tienes permisos para administrar respaldos.',
    fallback: 'No fue posible completar la operacion de respaldo.',
  });
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
