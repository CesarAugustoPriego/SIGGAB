/**
 * Helpers de respuesta estandarizada para la API SIGGAB.
 * Formato: { success, data, message, errors }
 */

function sendSuccess(res, data = null, message = 'Operación exitosa', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    errors: null,
  });
}

function sendCreated(res, data = null, message = 'Recurso creado exitosamente') {
  return sendSuccess(res, data, message, 201);
}

function sendError(res, message = 'Error interno del servidor', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors,
  });
}

function sendBadRequest(res, message = 'Datos inválidos', errors = null) {
  return sendError(res, message, 400, errors);
}

function sendUnauthorized(res, message = 'No autorizado') {
  return sendError(res, message, 401);
}

function sendForbidden(res, message = 'Acceso denegado. No tienes permisos para esta acción.') {
  return sendError(res, message, 403);
}

function sendNotFound(res, message = 'Recurso no encontrado') {
  return sendError(res, message, 404);
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
};
