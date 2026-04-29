const produccionLecheService = require('../services/produccion-leche.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.idAnimal) filters.idAnimal = req.query.idAnimal;
    if (req.query.estado) filters.estadoValidacion = req.query.estado;
    return sendSuccess(res, await produccionLecheService.getAll(filters), 'Registros de producción obtenidos');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await produccionLecheService.getById(parseInt(req.params.id, 10)), 'Registro de producción obtenido');
  } catch (e) { next(e); }
}

const { notifyAdmins } = require('../services/notifications.service');

async function create(req, res, next) {
  try {
    const registro = await produccionLecheService.create(req.body, req.user.idUsuario);
    notifyAdmins(
      'Nuevos Datos: Ordeña', 
      `Se reportó una ordeña de ${registro.litrosProducidos}L para validar.`,
      { recordType: 'LECHE', id: registro.idProduccion }
    );
    return sendCreated(res, registro, 'Producción de leche registrada');
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    return sendSuccess(
      res,
      await produccionLecheService.update(parseInt(req.params.id, 10), req.body, req.user.idUsuario),
      'Registro de producción modificado'
    );
  } catch (e) { next(e); }
}

async function validar(req, res, next) {
  try {
    return sendSuccess(res, await produccionLecheService.validar(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Registro de producción validado');
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, validar };
