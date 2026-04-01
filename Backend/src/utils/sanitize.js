const EXCLUDED_KEYS = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'accessToken',
  'token',
]);

function sanitizeString(value) {
  return value
    // scripts embebidos
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // etiquetas HTML
    .replace(/<\/?[^>]+(>|$)/g, '')
    // caracteres de control
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function sanitizeValue(value, key = '') {
  if (typeof value === 'string') {
    if (EXCLUDED_KEYS.has(key)) return value;
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [objKey, objValue] of Object.entries(value)) {
      sanitized[objKey] = sanitizeValue(objValue, objKey);
    }
    return sanitized;
  }

  return value;
}

module.exports = { sanitizeValue };
