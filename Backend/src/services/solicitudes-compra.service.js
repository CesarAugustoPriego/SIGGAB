const solicitudesRepository = require('../repositories/solicitudes-compra.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll(filters = {}) {
  return solicitudesRepository.findAll(filters);
}

async function getById(id) {
  const solicitud = await solicitudesRepository.findById(id);
  if (!solicitud) throw Object.assign(new Error('Solicitud de compra no encontrada'), { statusCode: 404 });
  return solicitud;
}

/**
 * Crear solicitud con detalles (RN-13: solo Almacén).
 */
async function create(body, idUsuario) {
  const { fechaSolicitud, observaciones, detalles } = body;

  // Calcular subtotales
  const detallesConSubtotal = detalles.map((d) => ({
    idInsumo: d.idInsumo,
    cantidad: d.cantidad,
    precioEstimado: d.precioEstimado,
    subtotalEstimado: d.cantidad * d.precioEstimado,
  }));

  const solicitud = await solicitudesRepository.create(
    { fechaSolicitud: new Date(fechaSolicitud), solicitadaPor: idUsuario, observaciones },
    detallesConSubtotal
  );

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'solicitudes_compra',
    idRegistro: solicitud.idSolicitud,
    detalles: { fecha: fechaSolicitud, numDetalles: detalles.length },
  });

  return solicitud;
}

/**
 * Aprobar o rechazar solicitud (RN-14: solo Admin, RN-15: no reabrir rechazadas).
 */
async function aprobar(id, { estadoSolicitud, observaciones }, idUsuario) {
  const solicitud = await solicitudesRepository.findById(id);
  if (!solicitud) throw Object.assign(new Error('Solicitud de compra no encontrada'), { statusCode: 404 });

  // RN-15: no procesar si ya fue rechazada
  if (solicitud.estadoSolicitud === 'RECHAZADA') {
    throw Object.assign(new Error('La solicitud ya fue rechazada y no puede modificarse'), { statusCode: 400 });
  }

  // RN-17: no aprobar si ya tiene compra realizada
  if (solicitud.comprasRealizadas?.length > 0) {
    throw Object.assign(new Error('Esta solicitud ya tiene una compra realizada'), { statusCode: 400 });
  }

  if (solicitud.estadoSolicitud !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden aprobar/rechazar solicitudes en estado PENDIENTE'), { statusCode: 400 });
  }

  const updated = await solicitudesRepository.update(id, {
    estadoSolicitud,
    aprobadaPor: idUsuario,
    fechaAprobacion: new Date(),
    ...(observaciones && { observaciones }),
  });

  await registrarAccion({
    idUsuario, accion: estadoSolicitud === 'APROBADA' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'solicitudes_compra', idRegistro: id,
    detalles: { estadoAnterior: 'PENDIENTE', nuevoEstado: estadoSolicitud },
  });

  return updated;
}

module.exports = { getAll, getById, create, aprobar };
