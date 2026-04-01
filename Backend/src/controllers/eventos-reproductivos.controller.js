const eventosReproService = require('../services/eventos-reproductivos.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.idAnimal) filters.idAnimal = req.query.idAnimal;
    if (req.query.idLote) filters.idLote = req.query.idLote;
    if (req.query.tipo) filters.tipoEvento = req.query.tipo;
    if (req.query.estado) filters.estadoValidacion = req.query.estado;
    return sendSuccess(res, await eventosReproService.getAll(filters), 'Eventos reproductivos obtenidos');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await eventosReproService.getById(parseInt(req.params.id, 10)), 'Evento reproductivo obtenido');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await eventosReproService.create(req.body, req.user.idUsuario), 'Evento reproductivo registrado');
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    return sendSuccess(
      res,
      await eventosReproService.update(parseInt(req.params.id, 10), req.body, req.user.idUsuario),
      'Evento reproductivo modificado'
    );
  } catch (e) { next(e); }
}

async function validar(req, res, next) {
  try {
    return sendSuccess(res, await eventosReproService.validar(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Evento reproductivo validado');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, validar };
