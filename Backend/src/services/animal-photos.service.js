const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads', 'animales');
const MANAGED_PREFIX = '/uploads/animales/';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function buildValidationError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function sanitizeFragment(value) {
  return String(value || 'animal')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'animal';
}

function parsePhotoDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(String(dataUrl || ''));
  if (!match) {
    throw buildValidationError('La foto debe enviarse como imagen JPG, PNG o WEBP en base64.');
  }

  const mimeType = match[1].toLowerCase();
  const extension = EXTENSIONS_BY_MIME[mimeType];
  const buffer = Buffer.from(match[2], 'base64');

  if (!buffer.length) {
    throw buildValidationError('La foto del animal no contiene datos válidos.');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw buildValidationError('La foto del animal excede el tamaño máximo permitido de 5 MB.');
  }

  return { buffer, extension };
}

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function toManagedFilePath(fotoUrl) {
  if (!fotoUrl) return null;

  const relativePath = String(fotoUrl).replace(/^https?:\/\/[^/]+/i, '');
  if (!relativePath.startsWith(MANAGED_PREFIX)) return null;

  const resolvedPath = path.resolve(ROOT_DIR, relativePath.slice(1));
  if (!resolvedPath.startsWith(UPLOADS_DIR)) return null;

  return resolvedPath;
}

async function removeManagedAnimalPhoto(fotoUrl) {
  const filePath = toManagedFilePath(fotoUrl);
  if (!filePath) return;

  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // Ignorar errores al limpiar archivos ya ausentes.
  }
}

async function persistAnimalPhoto({ fotoBase64, numeroArete, currentFotoUrl = null, eliminarFoto = false }) {
  if (eliminarFoto) {
    await removeManagedAnimalPhoto(currentFotoUrl);
    return null;
  }

  if (!fotoBase64) {
    return currentFotoUrl;
  }

  const { buffer, extension } = parsePhotoDataUrl(fotoBase64);
  await ensureUploadsDir();

  const filename = `${sanitizeFragment(numeroArete)}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(filePath, buffer);
  await removeManagedAnimalPhoto(currentFotoUrl);

  return `${MANAGED_PREFIX}${filename}`;
}

module.exports = {
  persistAnimalPhoto,
  removeManagedAnimalPhoto,
};
