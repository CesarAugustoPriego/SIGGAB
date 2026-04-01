const prisma = require('./prisma');

async function findAll(onlyActive = true) {
  const where = onlyActive ? { activo: true } : {};
  return prisma.raza.findMany({ where, orderBy: { nombreRaza: 'asc' } });
}

async function findById(id) {
  return prisma.raza.findUnique({ where: { idRaza: id } });
}

async function create(data) {
  return prisma.raza.create({ data });
}

async function update(id, data) {
  return prisma.raza.update({ where: { idRaza: id }, data });
}

module.exports = { findAll, findById, create, update };
