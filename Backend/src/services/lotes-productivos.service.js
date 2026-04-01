const lotesRepository = require('../repositories/lotes-productivos.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll(filters = {}) {
  return lotesRepository.findAll(filters);
}

async function getById(id) {
  const lote = await lotesRepository.findById(id);
  if (!lote) throw Object.assign(new Error('Lote no encontrado'), { statusCode: 404 });
  return lote;
}

async function create(data, idUsuario) {
  const lote = await lotesRepository.create({
    fechaInicio: new Date(data.fechaInicio),
    fechaFin: new Date(data.fechaFin),
    creadoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'lote_validacion_productiva',
    idRegistro: lote.idLote,
    detalles: { fechaInicio: data.fechaInicio, fechaFin: data.fechaFin },
  });

  return lote;
}

/**
 * Validar (aprobar/rechazar) un lote completo (RN-03).
 */
async function validar(id, { estado }, idUsuario) {
  const lote = await lotesRepository.findById(id);
  if (!lote) throw Object.assign(new Error('Lote no encontrado'), { statusCode: 404 });

  if (lote.estado !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden validar lotes en estado PENDIENTE'), { statusCode: 400 });
  }

  const updated = await lotesRepository.update(id, { estado });

  await registrarAccion({
    idUsuario, accion: estado === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'lote_validacion_productiva', idRegistro: id,
    detalles: { estadoAnterior: 'PENDIENTE', nuevoEstado: estado },
  });

  return updated;
}

module.exports = { getAll, getById, create, validar };
