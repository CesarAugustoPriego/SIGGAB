const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.estado) where.estado = filters.estado;
  return prisma.loteValidacionProductiva.findMany({
    where,
    include: { creador: { select: { idUsuario: true, nombreCompleto: true } } },
    orderBy: { fechaCreacion: 'desc' },
  });
}

async function findById(id) {
  return prisma.loteValidacionProductiva.findUnique({
    where: { idLote: id },
    include: {
      creador: { select: { idUsuario: true, nombreCompleto: true } },
      registrosPeso: true,
      produccionesLeche: true,
      eventosReproductivos: true,
    },
  });
}

async function create(data) {
  return prisma.loteValidacionProductiva.create({
    data,
    include: { creador: { select: { idUsuario: true, nombreCompleto: true } } },
  });
}

async function update(id, data) {
  return prisma.loteValidacionProductiva.update({
    where: { idLote: id },
    data,
    include: { creador: { select: { idUsuario: true, nombreCompleto: true } } },
  });
}

module.exports = { findAll, findById, create, update };
