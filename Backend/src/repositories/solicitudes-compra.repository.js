const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.estadoSolicitud) where.estadoSolicitud = filters.estadoSolicitud;
  return prisma.solicitudCompra.findMany({
    where,
    include: {
      solicitante: { select: { idUsuario: true, nombreCompleto: true } },
      aprobador: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
      comprasRealizadas: { select: { idCompra: true } },
    },
    orderBy: { fechaSolicitud: 'desc' },
  });
}

async function findById(id) {
  return prisma.solicitudCompra.findUnique({
    where: { idSolicitud: id },
    include: {
      solicitante: { select: { idUsuario: true, nombreCompleto: true } },
      aprobador: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
      comprasRealizadas: true,
    },
  });
}

async function create(solicitudData, detallesData) {
  return prisma.solicitudCompra.create({
    data: {
      ...solicitudData,
      detalles: { create: detallesData },
    },
    include: {
      solicitante: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
      comprasRealizadas: { select: { idCompra: true } },
    },
  });
}

async function update(id, data) {
  return prisma.solicitudCompra.update({
    where: { idSolicitud: id },
    data,
    include: {
      solicitante: { select: { idUsuario: true, nombreCompleto: true } },
      aprobador: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
      comprasRealizadas: { select: { idCompra: true } },
    },
  });
}

module.exports = { findAll, findById, create, update };
