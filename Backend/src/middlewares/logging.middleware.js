const { registrarAccion } = require('../services/bitacora.service');

function defaultGetIdRegistro(resPayload) {
  if (!resPayload || typeof resPayload !== 'object') return 0;
  const data = resPayload.data;
  if (!data || typeof data !== 'object') return 0;

  const idKey = Object.keys(data).find((key) => /^id[A-Z_]/.test(key) || key === 'id');
  if (!idKey) return 0;

  const rawId = data[idKey];
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Middleware de bitácora para trazabilidad transversal.
 * Útil para endpoints que no registran acción en services.
 */
function loggingMiddleware(config) {
  const {
    accion,
    tablaAfectada,
    getIdRegistro = (_req, _res, payload) => defaultGetIdRegistro(payload),
    shouldLog = (_req, res) => res.statusCode < 400,
    getDetalles,
  } = config;

  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    let responsePayload = null;

    res.json = (payload) => {
      responsePayload = payload;
      return originalJson(payload);
    };

    res.once('finish', () => {
      if (!req.user?.idUsuario) return;
      if (!shouldLog(req, res, responsePayload)) return;

      const idRegistro = getIdRegistro(req, res, responsePayload);
      const detalles = getDetalles ? getDetalles(req, res, responsePayload) : null;

      void registrarAccion({
        idUsuario: req.user.idUsuario,
        accion,
        tablaAfectada,
        idRegistro: Number.isFinite(Number(idRegistro)) ? Number(idRegistro) : 0,
        detalles,
      });
    });

    next();
  };
}

module.exports = loggingMiddleware;
