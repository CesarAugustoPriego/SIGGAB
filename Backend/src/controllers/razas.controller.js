const razasService = require('../services/razas.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const razas = await razasService.getAll();
    return sendSuccess(res, razas, 'Razas obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const raza = await razasService.create(req.body, req.user.idUsuario);
    return sendCreated(res, raza, 'Raza creada exitosamente');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const raza = await razasService.update(id, req.body, req.user.idUsuario);
    return sendSuccess(res, raza, 'Raza actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, create, update };
