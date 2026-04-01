const calendarioService = require('../services/calendario-sanitario.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.animal) filters.idAnimal = parseInt(req.query.animal, 10);
    if (req.query.estado) filters.estado = req.query.estado;

    const calendario = await calendarioService.getAll(filters);
    return sendSuccess(res, calendario, 'Calendario sanitario obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const evento = await calendarioService.getById(id);
    return sendSuccess(res, evento, 'Evento del calendario obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getAlertas(req, res, next) {
  try {
    const dias = parseInt(req.query.dias || '7', 10);
    const alertas = await calendarioService.getAlertas(dias);
    return sendSuccess(res, alertas, 'Alertas obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const evento = await calendarioService.create(req.body, req.user.idUsuario);
    return sendCreated(res, evento, 'Evento programado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const evento = await calendarioService.update(id, req.body, req.user.idUsuario);
    return sendSuccess(res, evento, 'Evento del calendario actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function completar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;
    const evento = await calendarioService.completar(id, estado, req.user.idUsuario);
    return sendSuccess(res, evento, `Evento ${estado.toLowerCase()} exitosamente`);
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, getAlertas, create, update, completar };
