const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.idAnimal) where.idAnimal = filters.idAnimal;
  if (filters.estado) where.estado = filters.estado;

  return prisma.calendarioSanitario.findMany({
    where,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      programador: { select: { idUsuario: true, nombreCompleto: true } },
    },
    orderBy: { fechaProgramada: 'asc' },
  });
}

async function findById(id) {
  return prisma.calendarioSanitario.findUnique({
    where: { idCalendario: id },
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      programador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function create(data) {
  return prisma.calendarioSanitario.create({
    data,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      programador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

async function update(id, data) {
  return prisma.calendarioSanitario.update({
    where: { idCalendario: id },
    data,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
      programador: { select: { idUsuario: true, nombreCompleto: true } },
    },
  });
}

// Alertas: eventos pendientes cuya fecha de alerta vence en los proximos N dias.
async function findProximos(dias = 3) {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + dias);

  return prisma.calendarioSanitario.findMany({
    where: {
      estado: 'PENDIENTE',
      fechaProgramada: { gte: hoy },
      fechaAlerta: { lte: limite },
    },
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: true,
    },
    orderBy: { fechaProgramada: 'asc' },
  });
}

module.exports = { findAll, findById, create, update, findProximos };
