const { sendError } = require('../utils/response');

/**
 * Middleware global de captura de errores.
 * Formato estandarizado. No expone stack traces en producción.
 */
function errorMiddleware(err, req, res, _next) {
  console.error('❌ Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Errores de Prisma
  if (err.code === 'P2002') {
    const campo = err.meta?.target?.join(', ') || 'campo único';
    return sendError(res, `Ya existe un registro con ese valor en: ${campo}`, 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'Registro no encontrado', 404);
  }

  if (err.code === 'P2003') {
    return sendError(res, 'Referencia a un registro que no existe (FK inválida)', 400);
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  return sendError(res, message, statusCode);
}

module.exports = errorMiddleware;
