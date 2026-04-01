const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.idAnimal) where.idAnimal = filters.idAnimal;
  if (filters.idTipoEvento) where.idTipoEvento = filters.idTipoEvento;
  if (filters.estadoAprobacion) where.estadoAprobacion = filters.estadoAprobacion;

  return prisma.eventoSanitario.findMany({
    where,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      autorizador: { select: { idUsuario: true, nombreCompleto: true } },
    },
    orderBy: { fechaEvento: 'desc' },
  });
}

async function findById(id) {
  return prisma.eventoSanitario.findUnique({
    where: { idEvento: id },
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      autorizador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function create(data) {
  return prisma.eventoSanitario.create({
    data,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
    },
  });
}

async function update(id, data) {
  return prisma.eventoSanitario.update({
    where: { idEvento: id },
    data,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      autorizador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function findTiposEvento(onlyActive = true) {
  const where = onlyActive ? { activo: true } : {};
  return prisma.tipoEventoSanitario.findMany({ where, orderBy: { nombreTipo: 'asc' } });
}

module.exports = { findAll, findById, create, update, findTiposEvento };
