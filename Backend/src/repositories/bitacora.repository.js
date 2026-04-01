const prisma = require('./prisma');

async function findAll() {
  return prisma.bitacora.findMany({
    include: {
      usuario: { select: { idUsuario: true, nombreCompleto: true, username: true } },
    },
    orderBy: { fechaHora: 'desc' },
    take: 500,
  });
}

module.exports = { findAll };
