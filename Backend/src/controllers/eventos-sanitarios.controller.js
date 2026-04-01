const eventosSanitariosService = require('../services/eventos-sanitarios.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.animal) filters.idAnimal = parseInt(req.query.animal, 10);
    if (req.query.tipo) filters.idTipoEvento = parseInt(req.query.tipo, 10);
    if (req.query.estado) filters.estadoAprobacion = req.query.estado;

    const eventos = await eventosSanitariosService.getAll(filters);
    return sendSuccess(res, eventos, 'Eventos sanitarios obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const evento = await eventosSanitariosService.getById(id);
    return sendSuccess(res, evento, 'Evento sanitario obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const evento = await eventosSanitariosService.create(req.body, req.user.idUsuario);
    return sendCreated(res, evento, 'Evento sanitario registrado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const evento = await eventosSanitariosService.update(id, req.body, req.user.idUsuario);
    return sendSuccess(res, evento, 'Evento sanitario actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function aprobar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { estadoAprobacion } = req.body;
    const evento = await eventosSanitariosService.aprobar(id, estadoAprobacion, req.user.idUsuario);
    return sendSuccess(res, evento, `Evento ${estadoAprobacion.toLowerCase()} exitosamente`);
  } catch (error) {
    next(error);
  }
}

async function getTiposEvento(req, res, next) {
  try {
    const tipos = await eventosSanitariosService.getTiposEvento();
    return sendSuccess(res, tipos, 'Tipos de evento obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, aprobar, getTiposEvento };
