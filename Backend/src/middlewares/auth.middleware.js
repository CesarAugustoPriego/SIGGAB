const { verifyToken } = require('../utils/jwt');
const { sendUnauthorized } = require('../utils/response');
const prisma = require('../repositories/prisma');

/**
 * Middleware de autenticación.
 * Verifica el JWT del header Authorization: Bearer <token>.
 * Inyecta req.user = { idUsuario, idRol, nombreRol, username } en la request.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Token de autenticación no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verificar que el usuario aún existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: decoded.idUsuario },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      return sendUnauthorized(res, 'Usuario inactivo o inexistente');
    }

    req.user = {
      idUsuario: usuario.idUsuario,
      idRol: usuario.idRol,
      nombreRol: usuario.rol.nombreRol,
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Token inválido');
    }
    return sendUnauthorized(res, 'Error de autenticación');
  }
}

module.exports = authMiddleware;
