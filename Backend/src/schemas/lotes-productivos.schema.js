const { z } = require('zod');

const createLoteSchema = z.object({
  fechaInicio: z
    .string({ required_error: 'La fecha de inicio es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  fechaFin: z
    .string({ required_error: 'La fecha de fin es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
}).refine((d) => new Date(d.fechaFin) >= new Date(d.fechaInicio), {
  message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio',
  path: ['fechaFin'],
});

const validarLoteSchema = z.object({
  estado: z.enum(['APROBADO', 'RECHAZADO'], {
    required_error: 'El estado es obligatorio',
    invalid_type_error: 'Debe ser APROBADO o RECHAZADO',
  }),
});

module.exports = { createLoteSchema, validarLoteSchema };
