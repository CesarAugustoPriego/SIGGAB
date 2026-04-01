const prisma = require('./prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.idInsumo) where.idInsumo = filters.idInsumo;
  if (filters.tipoMovimiento) where.tipoMovimiento = filters.tipoMovimiento;
  return prisma.movimientoInventario.findMany({
    where,
    include: { insumo: { include: { tipoInsumo: true } }, registrador: { select: { idUsuario: true, nombreCompleto: true } } },
    orderBy: { fechaMovimiento: 'desc' },
  });
}

async function findById(id) {
  return prisma.movimientoInventario.findUnique({
    where: { idMovimiento: id },
    include: { insumo: { include: { tipoInsumo: true } }, registrador: { select: { idUsuario: true, nombreCompleto: true } } },
  });
}

async function create(data) {
  return prisma.movimientoInventario.create({
    data,
    include: { insumo: true },
  });
}

module.exports = { findAll, findById, create };
