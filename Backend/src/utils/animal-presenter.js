const fs = require('fs');
const { getManagedAnimalPhotoPath } = require('./upload-paths');

function ensureLeadingSlash(value) {
  if (!value) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

function normalizeUploadsPath(value) {
  const normalized = String(value || '').trim().replace(/\\/g, '/');
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const uploadsIndex = lower.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return ensureLeadingSlash(normalized.slice(uploadsIndex));
  }

  if (lower.startsWith('uploads/')) {
    return ensureLeadingSlash(normalized);
  }

  // Legacy records used `animales/...` without `/uploads`.
  if (lower.startsWith('animales/') || lower.startsWith('/animales/')) {
    return `/uploads/${normalized.replace(/^\/?animales\//i, 'animales/')}`;
  }

  return ensureLeadingSlash(normalized);
}

function toAbsolutePhotoUrl(req, fotoUrl) {
  if (!fotoUrl) return null;

  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  const rawValue = String(fotoUrl).trim();
  if (!rawValue) return null;

  const managedPhoto = getManagedAnimalPhotoPath(rawValue);
  if (managedPhoto && !fs.existsSync(managedPhoto.filePath)) {
    return null;
  }

  if (/^https?:\/\//i.test(rawValue)) {
    try {
      const parsed = new URL(rawValue);
      // Rebuild uploads URLs with the current API host so old localhost records still work on mobile.
      if (parsed.pathname.toLowerCase().includes('/uploads/')) {
        const normalizedPath = normalizeUploadsPath(parsed.pathname);
        return `${protocol}://${host}${normalizedPath}${parsed.search || ''}`;
      }
      return rawValue;
    } catch {
      return rawValue;
    }
  }

  const normalizedPath = normalizeUploadsPath(rawValue);
  return `${protocol}://${host}${normalizedPath}`;
}

function presentAnimal(req, animal) {
  if (!animal) return animal;
  return {
    ...animal,
    fotoUrl: toAbsolutePhotoUrl(req, animal.fotoUrl),
  };
}

function presentAnimalCollection(req, animals = []) {
  return animals.map((animal) => presentAnimal(req, animal));
}

function presentAnimalHistorial(req, payload) {
  if (!payload) return payload;
  return {
    ...payload,
    animal: presentAnimal(req, payload.animal),
  };
}

module.exports = {
  presentAnimal,
  presentAnimalCollection,
  presentAnimalHistorial,
};
