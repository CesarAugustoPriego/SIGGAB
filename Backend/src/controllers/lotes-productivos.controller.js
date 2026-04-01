const lotesService = require('../services/lotes-productivos.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.estado) filters.estado = req.query.estado;
    return sendSuccess(res, await lotesService.getAll(filters), 'Lotes obtenidos');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await lotesService.getById(parseInt(req.params.id, 10)), 'Lote obtenido');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await lotesService.create(req.body, req.user.idUsuario), 'Lote de validación creado');
  } catch (e) { next(e); }
}

async function validar(req, res, next) {
  try {
    return sendSuccess(res, await lotesService.validar(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Lote validado');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, validar };
