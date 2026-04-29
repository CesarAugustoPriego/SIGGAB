const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const ANIMAL_UPLOADS_DIR = path.join(UPLOADS_DIR, 'animales');
const MANAGED_ANIMAL_PREFIX = '/uploads/animales/';

function isPathInside(parentDir, targetPath) {
  const relativePath = path.relative(parentDir, targetPath);
  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function normalizeAnimalPhotoUrl(value) {
  const rawValue = String(value || '').trim().replace(/\\/g, '/');
  if (!rawValue) return null;

  let pathname = rawValue;
  if (/^https?:\/\//i.test(rawValue)) {
    try {
      pathname = new URL(rawValue).pathname;
    } catch {
      return null;
    }
  }

  pathname = pathname.split('?')[0].split('#')[0];
  const lowerPathname = pathname.toLowerCase();

  const uploadsIndex = lowerPathname.indexOf('/uploads/animales/');
  if (uploadsIndex >= 0) {
    return pathname.slice(uploadsIndex);
  }

  if (lowerPathname.startsWith('uploads/animales/')) {
    return `/${pathname}`;
  }

  if (lowerPathname.startsWith('animales/') || lowerPathname.startsWith('/animales/')) {
    return `/uploads/${pathname.replace(/^\/?animales\//i, 'animales/')}`;
  }

  return null;
}

function getManagedAnimalPhotoPath(value) {
  const relativeUrl = normalizeAnimalPhotoUrl(value);
  if (!relativeUrl) return null;

  const filePath = path.resolve(ROOT_DIR, relativeUrl.slice(1));
  if (!isPathInside(ANIMAL_UPLOADS_DIR, filePath)) return null;

  return { relativeUrl, filePath };
}

module.exports = {
  ROOT_DIR,
  UPLOADS_DIR,
  ANIMAL_UPLOADS_DIR,
  MANAGED_ANIMAL_PREFIX,
  getManagedAnimalPhotoPath,
  normalizeAnimalPhotoUrl,
};
