const respaldosService = require('../services/respaldos.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function list(req, res, next) {
  try {
    const data = await respaldosService.listBackups();
    return sendSuccess(res, data, 'Listado de respaldos obtenido');
  } catch (error) {
    return next(error);
  }
}

async function ejecutar(req, res, next) {
  try {
    const data = await respaldosService.triggerManualBackup(req.user.idUsuario);
    return sendCreated(res, data, 'Respaldo generado correctamente');
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, ejecutar };
