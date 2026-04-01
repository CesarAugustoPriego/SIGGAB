const prisma = require('./prisma');

async function findByUsername(username) {
  return prisma.usuario.findUnique({
    where: { username },
    include: { rol: true },
  });
}

async function findById(id) {
  return prisma.usuario.findUnique({
    where: { idUsuario: id },
    include: { rol: true },
  });
}

async function findAll() {
  return prisma.usuario.findMany({
    include: { rol: true },
    orderBy: { idUsuario: 'asc' },
  });
}

async function create(data) {
  return prisma.usuario.create({
    data,
    include: { rol: true },
  });
}

async function update(id, data) {
  return prisma.usuario.update({
    where: { idUsuario: id },
    data,
    include: { rol: true },
  });
}

async function registerFailedLogin(idUsuario, { maxAttempts, lockMinutes }) {
  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({ where: { idUsuario } });
    if (!usuario) return null;

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      return tx.usuario.findUnique({
        where: { idUsuario },
        include: { rol: true },
      });
    }

    const nuevosIntentos = (usuario.intentosFallidos || 0) + 1;
    const shouldLock = nuevosIntentos >= maxAttempts;
    const bloqueadoHasta = shouldLock
      ? new Date(Date.now() + lockMinutes * 60 * 1000)
      : null;

    return tx.usuario.update({
      where: { idUsuario },
      data: {
        intentosFallidos: shouldLock ? 0 : nuevosIntentos,
        bloqueadoHasta,
      },
      include: { rol: true },
    });
  });
}

async function clearFailedLoginState(idUsuario) {
  return prisma.usuario.update({
    where: { idUsuario },
    data: {
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
    include: { rol: true },
  });
}

// ─── Refresh Tokens ───

async function createRefreshToken(data) {
  return prisma.refreshToken.create({ data });
}

async function findRefreshToken(token) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { usuario: { include: { rol: true } } },
  });
}

async function revokeRefreshToken(token) {
  return prisma.refreshToken.update({
    where: { token },
    data: { revocado: true },
  });
}

async function revokeAllUserTokens(idUsuario) {
  return prisma.refreshToken.updateMany({
    where: { idUsuario, revocado: false },
    data: { revocado: true },
  });
}

module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  update,
  registerFailedLogin,
  clearFailedLoginState,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
