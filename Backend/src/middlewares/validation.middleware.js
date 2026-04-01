const { sendBadRequest } = require('../utils/response');

/**
 * Factory middleware para validación con Zod.
 * @param {import('zod').ZodSchema} schema - Schema Zod a aplicar.
 * @param {'body'|'query'|'params'} source - Parte de la request a validar.
 * @returns {Function} Express middleware
 *
 * Uso: validate(loginSchema) o validate(querySchema, 'query')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error?.issues?.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message,
      })) || result.error?.errors?.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message,
      })) || [{ campo: 'body', mensaje: result.error?.message || 'Error de validación' }];

      return sendBadRequest(res, 'Error de validación', errors);
    }

    // Reemplazar con datos parseados (limpia datos extra y aplica defaults)
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
