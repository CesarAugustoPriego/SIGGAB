const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');

async function getResumen(req, res, next) {
  try {
    return sendSuccess(res, await dashboardService.getResumen(), 'Resumen del sistema obtenido');
  } catch (e) { next(e); }
}

async function getGanado(req, res, next) {
  try {
    return sendSuccess(res, await dashboardService.getGanado(), 'Indicadores de ganado obtenidos');
  } catch (e) { next(e); }
}

async function getProduccion(req, res, next) {
  try {
    return sendSuccess(res, await dashboardService.getProduccion(), 'Indicadores de producción obtenidos');
  } catch (e) { next(e); }
}

async function getSanitario(req, res, next) {
  try {
    return sendSuccess(res, await dashboardService.getSanitario(), 'Estado sanitario obtenido');
  } catch (e) { next(e); }
}

async function getInventario(req, res, next) {
  try {
    return sendSuccess(res, await dashboardService.getInventario(), 'Estado de inventario obtenido');
  } catch (e) { next(e); }
}

async function getBitacora(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    return sendSuccess(res, await dashboardService.getBitacora(limit), 'Bitácora obtenida');
  } catch (e) { next(e); }
}

async function getStream(req, res, next) {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendSnapshot = async () => {
      const payload = await dashboardService.getResumen();
      res.write(`event: dashboard-resumen\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    await sendSnapshot();
    const interval = setInterval(() => {
      void sendSnapshot();
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getResumen, getGanado, getProduccion, getSanitario, getInventario, getBitacora, getStream };
