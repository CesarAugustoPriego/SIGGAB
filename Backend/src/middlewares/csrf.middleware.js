const env = require('../config/env');
const { sendForbidden } = require('../utils/response');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Política CSRF:
 * - Solo se exige cuando se habilita por entorno y existe cabecera Cookie.
 * - Si el frontend usa Authorization Bearer sin cookies, no bloquea.
 */
function csrfMiddleware(req, res, next) {
  if (!env.ENABLE_CSRF_PROTECTION) return next();
  if (!MUTATING_METHODS.has(req.method)) return next();

  const hasCookieSession = Boolean(req.headers.cookie);
  if (!hasCookieSession) return next();

  if (!env.CSRF_TOKEN) {
    return sendForbidden(res, 'CSRF habilitado sin CSRF_TOKEN configurado en entorno');
  }

  const csrfHeaderName = env.CSRF_HEADER_NAME.toLowerCase();
  const incomingToken = req.headers[csrfHeaderName];

  if (!incomingToken || incomingToken !== env.CSRF_TOKEN) {
    return sendForbidden(res, 'Token CSRF inválido o ausente');
  }

  return next();
}

module.exports = csrfMiddleware;
