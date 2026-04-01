const solicitudesService = require('../services/solicitudes-compra.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.estado) filters.estadoSolicitud = req.query.estado;
    return sendSuccess(res, await solicitudesService.getAll(filters), 'Solicitudes obtenidas');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await solicitudesService.getById(parseInt(req.params.id, 10)), 'Solicitud obtenida');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await solicitudesService.create(req.body, req.user.idUsuario), 'Solicitud de compra creada');
  } catch (e) { next(e); }
}

async function aprobar(req, res, next) {
  try {
    return sendSuccess(res, await solicitudesService.aprobar(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Solicitud procesada');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, aprobar };
