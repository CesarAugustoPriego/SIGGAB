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

async function descargar(req, res, next) {
  try {
    let fileName;
    try {
      fileName = decodeURIComponent(req.params.fileName || '');
    } catch (_error) {
      throw Object.assign(new Error('Nombre de archivo de respaldo invalido'), { statusCode: 400 });
    }
    const backup = await respaldosService.getBackupForDownload(fileName);

    return res.download(backup.filePath, backup.fileName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, ejecutar, descargar };
