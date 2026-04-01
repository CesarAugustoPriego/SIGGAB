const comprasRepository = require('../repositories/compras-realizadas.repository');
const solicitudesRepository = require('../repositories/solicitudes-compra.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll() {
  return comprasRepository.findAll();
}

async function getById(id) {
  const compra = await comprasRepository.findById(id);
  if (!compra) throw Object.assign(new Error('Compra no encontrada'), { statusCode: 404 });
  return compra;
}

/**
 * Registrar compra realizada (RN-16: genera entradas de inventario automáticamente).
 */
async function create(body, idUsuario) {
  const { idSolicitud, fechaCompra, detalles } = body;

  // Verificar que la solicitud exista y esté aprobada
  const solicitud = await solicitudesRepository.findById(idSolicitud);
  if (!solicitud) throw Object.assign(new Error('Solicitud de compra no encontrada'), { statusCode: 404 });

  if (solicitud.estadoSolicitud !== 'APROBADA') {
    throw Object.assign(
      new Error(`La solicitud debe estar APROBADA para ejecutar la compra (estado actual: ${solicitud.estadoSolicitud})`),
      { statusCode: 400 }
    );
  }

  // RN-17: verificar que no tenga ya una compra
  if (solicitud.comprasRealizadas?.length > 0) {
    throw Object.assign(new Error('Esta solicitud ya tiene una compra registrada'), { statusCode: 400 });
  }

  const totalReal = detalles.reduce((sum, d) => sum + d.cantidadReal * d.precioUnitario, 0);

  // RN-16: transacción atómica — crea compra + detalles + entradas de inventario + actualiza stock
  const compra = await comprasRepository.createWithTransaction(
    { idSolicitud, fechaCompra: new Date(fechaCompra), realizadaPor: idUsuario, totalReal },
    detalles,
    idUsuario
  );

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'compras_realizadas',
    idRegistro: compra.idCompra,
    detalles: { idSolicitud, totalReal, numDetalles: detalles.length },
  });

  return compra;
}

module.exports = { getAll, getById, create };
