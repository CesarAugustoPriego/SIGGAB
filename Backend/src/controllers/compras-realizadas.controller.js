const comprasService = require('../services/compras-realizadas.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    return sendSuccess(res, await comprasService.getAll(), 'Compras obtenidas');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await comprasService.getById(parseInt(req.params.id, 10)), 'Compra obtenida');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await comprasService.create(req.body, req.user.idUsuario), 'Compra registrada y entradas de inventario generadas');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create };
