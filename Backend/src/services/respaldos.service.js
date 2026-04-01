const fs = require('fs/promises');
const path = require('path');
const prisma = require('../repositories/prisma');
const env = require('../config/env');

const AUTO_BACKUP_SOURCE = 'AUTO_SCHEDULER';
let backupIntervalHandle = null;

function getBackupDir() {
  return path.resolve(process.cwd(), env.BACKUP_DIR);
}

function buildBackupFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `siggab-backup-${stamp}.json`;
}

async function ensureBackupDir() {
  await fs.mkdir(getBackupDir(), { recursive: true });
}

async function uploadBackupToCloud(filePath, fileName) {
  if (!env.BACKUP_CLOUD_ENABLED) return null;
  if (!env.BACKUP_CLOUD_UPLOAD_URL) {
    throw new Error('BACKUP_CLOUD_ENABLED=true requiere BACKUP_CLOUD_UPLOAD_URL');
  }

  const uploadUrl = env.BACKUP_CLOUD_UPLOAD_URL.replace('{filename}', encodeURIComponent(fileName));
  const content = await fs.readFile(filePath);

  const headers = { 'Content-Type': 'application/json' };
  if (env.BACKUP_CLOUD_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${env.BACKUP_CLOUD_AUTH_TOKEN}`;
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: content,
  });

  if (!response.ok) {
    throw new Error(`Fallo al subir respaldo a nube. status=${response.status}`);
  }

  return {
    uploadUrl,
    status: response.status,
    uploadedAt: new Date().toISOString(),
  };
}

async function collectBackupData() {
  const [
    roles,
    usuarios,
    bitacora,
    razas,
    animales,
    tiposEventoSanitario,
    eventosSanitarios,
    calendarioSanitario,
    lotesProductivos,
    registrosPeso,
    produccionLeche,
    eventosReproductivos,
    tiposInsumo,
    insumos,
    movimientosInventario,
    solicitudesCompra,
    detalleSolicitudCompra,
    comprasRealizadas,
    detalleCompra,
  ] = await Promise.all([
    prisma.rol.findMany(),
    prisma.usuario.findMany(),
    prisma.bitacora.findMany(),
    prisma.raza.findMany(),
    prisma.animal.findMany(),
    prisma.tipoEventoSanitario.findMany(),
    prisma.eventoSanitario.findMany(),
    prisma.calendarioSanitario.findMany(),
    prisma.loteValidacionProductiva.findMany(),
    prisma.registroPeso.findMany(),
    prisma.produccionLeche.findMany(),
    prisma.eventoReproductivo.findMany(),
    prisma.tipoInsumo.findMany(),
    prisma.insumo.findMany(),
    prisma.movimientoInventario.findMany(),
    prisma.solicitudCompra.findMany(),
    prisma.detalleSolicitudCompra.findMany(),
    prisma.compraRealizada.findMany(),
    prisma.detalleCompra.findMany(),
  ]);

  return {
    roles,
    usuarios,
    bitacora,
    razas,
    animales,
    tiposEventoSanitario,
    eventosSanitarios,
    calendarioSanitario,
    lotesProductivos,
    registrosPeso,
    produccionLeche,
    eventosReproductivos,
    tiposInsumo,
    insumos,
    movimientosInventario,
    solicitudesCompra,
    detalleSolicitudCompra,
    comprasRealizadas,
    detalleCompra,
  };
}

async function pruneBackupFiles() {
  const files = await listBackups();
  if (files.length <= env.BACKUP_MAX_FILES) return;

  const filesToDelete = files.slice(env.BACKUP_MAX_FILES);
  await Promise.all(filesToDelete.map((file) => fs.unlink(path.join(getBackupDir(), file.fileName))));
}

async function runBackup({ executedBy = null, source = 'MANUAL' } = {}) {
  await ensureBackupDir();

  const payload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source,
      executedBy,
      version: '1.0.0',
    },
    data: await collectBackupData(),
  };

  const fileName = buildBackupFilename();
  const filePath = path.join(getBackupDir(), fileName);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  await pruneBackupFiles();
  const cloud = await uploadBackupToCloud(filePath, fileName);

  return {
    fileName,
    filePath,
    generatedAt: payload.metadata.generatedAt,
    source,
    executedBy,
    cloud,
  };
}

async function listBackups() {
  await ensureBackupDir();
  const entries = await fs.readdir(getBackupDir(), { withFileTypes: true });
  const backupEntries = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('siggab-backup-') && entry.name.endsWith('.json'))
    .map((entry) => entry.name);

  const filesWithStats = await Promise.all(backupEntries.map(async (name) => {
    const fullPath = path.join(getBackupDir(), name);
    const stats = await fs.stat(fullPath);
    return {
      fileName: name,
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
    };
  }));

  return filesWithStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function triggerManualBackup(idUsuario) {
  return runBackup({ executedBy: idUsuario, source: 'MANUAL' });
}

function startAutoBackupScheduler() {
  if (process.env.NODE_ENV === 'test') return;
  if (!env.AUTO_BACKUP_ENABLED) return;
  if (backupIntervalHandle) return;

  const intervalMs = env.BACKUP_INTERVAL_MINUTES * 60 * 1000;

  backupIntervalHandle = setInterval(() => {
    void runBackup({ source: AUTO_BACKUP_SOURCE }).catch((error) => {
      console.error('❌ Error en respaldo automático:', error.message);
    });
  }, intervalMs);

  backupIntervalHandle.unref();
  console.log(`🗃️  Respaldo automático habilitado cada ${env.BACKUP_INTERVAL_MINUTES} minuto(s)`);
}

function stopAutoBackupScheduler() {
  if (!backupIntervalHandle) return;
  clearInterval(backupIntervalHandle);
  backupIntervalHandle = null;
}

module.exports = {
  runBackup,
  triggerManualBackup,
  listBackups,
  startAutoBackupScheduler,
  stopAutoBackupScheduler,
};
