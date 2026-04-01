const { z } = require('zod');

const createMovimientoSchema = z.object({
  idInsumo: z.number({ required_error: 'El insumo es obligatorio' }).int().positive(),
  tipoMovimiento: z.enum(['ENTRADA', 'SALIDA'], {
    required_error: 'El tipo de movimiento es obligatorio',
    invalid_type_error: 'Debe ser ENTRADA o SALIDA',
  }),
  cantidad: z.number({ required_error: 'La cantidad es obligatoria' }).positive('La cantidad debe ser mayor a cero'),
  fechaMovimiento: z
    .string({ required_error: 'La fecha es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
});

module.exports = { createMovimientoSchema };
