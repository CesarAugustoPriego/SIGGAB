const registrosPesoService = require('../services/registros-peso.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.idAnimal) filters.idAnimal = req.query.idAnimal;
    if (req.query.idLote) filters.idLote = req.query.idLote;
    if (req.query.estado) filters.estadoValidacion = req.query.estado;
    return sendSuccess(res, await registrosPesoService.getAll(filters), 'Registros de peso obtenidos');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await registrosPesoService.getById(parseInt(req.params.id, 10)), 'Registro de peso obtenido');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await registrosPesoService.create(req.body, req.user.idUsuario), 'Registro de peso creado');
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    return sendSuccess(
      res,
      await registrosPesoService.update(parseInt(req.params.id, 10), req.body, req.user.idUsuario),
      'Registro de peso modificado'
    );
  } catch (e) { next(e); }
}

async function validar(req, res, next) {
  try {
    return sendSuccess(res, await registrosPesoService.validar(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Registro de peso validado');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, validar };
