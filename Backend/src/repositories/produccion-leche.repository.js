const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.idAnimal) where.idAnimal = Number(filters.idAnimal);
  if (filters.estadoValidacion) where.estadoValidacion = filters.estadoValidacion;
  return prisma.produccionLeche.findMany({
    where,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      registrador: { select: { idUsuario: true, nombreCompleto: true } },
      validador: { select: { idUsuario: true, nombreCompleto: true } },
    },
    orderBy: { fechaRegistro: 'desc' },
  });
}

async function findById(id) {
  return prisma.produccionLeche.findUnique({
    where: { idProduccion: id },
    include: {
      animal: true,
      registrador: { select: { idUsuario: true, nombreCompleto: true } },
      validador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function create(data) {
  return prisma.produccionLeche.create({
    data,
    include: { animal: { select: { idAnimal: true, numeroArete: true } } },
  });
}

async function update(id, data) {
  return prisma.produccionLeche.update({
    where: { idProduccion: id },
    data,
    include: { animal: { select: { idAnimal: true, numeroArete: true } } },
  });
}

module.exports = { findAll, findById, create, update };
