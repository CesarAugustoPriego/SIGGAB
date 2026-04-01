const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.idAnimal) where.idAnimal = Number(filters.idAnimal);
  if (filters.idLote) where.idLote = Number(filters.idLote);
  if (filters.estadoValidacion) where.estadoValidacion = filters.estadoValidacion;
  return prisma.registroPeso.findMany({
    where,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      lote: true,
      registrador: { select: { idUsuario: true, nombreCompleto: true } },
      validador: { select: { idUsuario: true, nombreCompleto: true } },
    },
    orderBy: { fechaRegistro: 'desc' },
  });
}

async function findById(id) {
  return prisma.registroPeso.findUnique({
    where: { idRegistroPeso: id },
    include: {
      animal: true,
      lote: true,
      registrador: { select: { idUsuario: true, nombreCompleto: true } },
      validador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function create(data) {
  return prisma.registroPeso.create({
    data,
    include: { animal: { select: { idAnimal: true, numeroArete: true } }, lote: true },
  });
}

async function update(id, data) {
  return prisma.registroPeso.update({
    where: { idRegistroPeso: id },
    data,
    include: { animal: { select: { idAnimal: true, numeroArete: true } }, lote: true },
  });
}

module.exports = { findAll, findById, create, update };
