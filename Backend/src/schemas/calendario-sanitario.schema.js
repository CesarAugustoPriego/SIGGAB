const { z } = require('zod');

const createCalendarioSchema = z.object({
  idAnimal: z
    .number({ required_error: 'El ID del animal es obligatorio' })
    .int()
    .positive(),
  idTipoEvento: z
    .number({ required_error: 'El tipo de evento es obligatorio' })
    .int()
    .positive(),
  fechaProgramada: z
    .string({ required_error: 'La fecha programada es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
  fechaAlerta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de alerta debe estar en formato YYYY-MM-DD')
    .optional(),
});

const updateCalendarioSchema = z.object({
  idTipoEvento: z
    .number()
    .int()
    .positive()
    .optional(),
  fechaProgramada: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
    .optional(),
  fechaAlerta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de alerta debe estar en formato YYYY-MM-DD')
    .optional()
    .nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

const completarCalendarioSchema = z.object({
  estado: z.enum(['COMPLETADO', 'CANCELADO'], {
    required_error: 'El estado es obligatorio',
    invalid_type_error: 'Estado inválido. Valores permitidos: COMPLETADO, CANCELADO',
  }),
});

module.exports = {
  createCalendarioSchema,
  updateCalendarioSchema,
  completarCalendarioSchema,
};
