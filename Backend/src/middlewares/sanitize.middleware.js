const { sanitizeValue } = require('../utils/sanitize');

/**
 * Sanitiza strings de entrada para mitigar payloads XSS.
 * Se ejecuta antes de validaciones de Zod para normalizar datos.
 */
function sanitizeMiddleware(req, _res, next) {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
}

module.exports = sanitizeMiddleware;
