const prisma = require('./prisma');

async function findAllTipos() {
  return prisma.tipoInsumo.findMany({ where: { activo: true }, orderBy: { nombreTipo: 'asc' } });
}

async function findTipoById(id) {
  return prisma.tipoInsumo.findUnique({ where: { idTipoInsumo: id } });
}

async function createTipo(data) {
  return prisma.tipoInsumo.create({ data });
}

async function updateTipo(id, data) {
  return prisma.tipoInsumo.update({ where: { idTipoInsumo: id }, data });
}

async function findAll(filters = {}) {
  const where = {};
  if (filters.idTipoInsumo) where.idTipoInsumo = filters.idTipoInsumo;
  if (filters.activo !== undefined) where.activo = filters.activo;
  return prisma.insumo.findMany({
    where,
    include: { tipoInsumo: true },
    orderBy: { nombreInsumo: 'asc' },
  });
}

async function findById(id) {
  return prisma.insumo.findUnique({
    where: { idInsumo: id },
    include: { tipoInsumo: true },
  });
}

async function create(data) {
  return prisma.insumo.create({ data, include: { tipoInsumo: true } });
}

async function update(id, data) {
  return prisma.insumo.update({ where: { idInsumo: id }, data, include: { tipoInsumo: true } });
}

module.exports = { findAllTipos, findTipoById, createTipo, updateTipo, findAll, findById, create, update };
