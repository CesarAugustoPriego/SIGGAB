const animalesService = require('../services/animales.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.estado) filters.estadoActual = req.query.estado;
    if (req.query.raza) filters.idRaza = parseInt(req.query.raza, 10);

    const animales = await animalesService.getAll(filters);
    return sendSuccess(res, animales, 'Animales obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const animal = await animalesService.getById(id);
    return sendSuccess(res, animal, 'Animal obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getByArete(req, res, next) {
  try {
    const animal = await animalesService.getByArete(req.params.numero);
    return sendSuccess(res, animal, 'Animal obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getHistorialByArete(req, res, next) {
  try {
    const historial = await animalesService.getHistorialByArete(req.params.numero);
    return sendSuccess(res, historial, 'Historial del animal obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const animal = await animalesService.create(req.body, req.user.idUsuario);
    return sendCreated(res, animal, 'Animal registrado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const animal = await animalesService.update(id, req.body, req.user.idUsuario);
    return sendSuccess(res, animal, 'Animal actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function darDeBaja(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const animal = await animalesService.darDeBaja(id, req.body, req.user.idUsuario);
    return sendSuccess(res, animal, 'Animal dado de baja exitosamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, getByArete, getHistorialByArete, create, update, darDeBaja };
