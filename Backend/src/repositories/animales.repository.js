const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.estadoActual) where.estadoActual = filters.estadoActual;
  if (filters.idRaza) where.idRaza = filters.idRaza;

  return prisma.animal.findMany({
    where,
    include: { raza: true },
    orderBy: { idAnimal: 'desc' },
  });
}

async function findById(id) {
  return prisma.animal.findUnique({
    where: { idAnimal: id },
    include: { raza: true },
  });
}

async function findByArete(numeroArete) {
  return prisma.animal.findUnique({
    where: { numeroArete },
    include: { raza: true },
  });
}

async function create(data) {
  return prisma.animal.create({
    data,
    include: { raza: true },
  });
}

async function update(id, data) {
  return prisma.animal.update({
    where: { idAnimal: id },
    data,
    include: { raza: true },
  });
}

module.exports = { findAll, findById, findByArete, create, update };
