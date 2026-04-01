const { z } = require('zod');

const createEventoSanitarioSchema = z.object({
  idAnimal: z
    .number({ required_error: 'El ID del animal es obligatorio' })
    .int()
    .positive(),
  idTipoEvento: z
    .number({ required_error: 'El tipo de evento es obligatorio' })
    .int()
    .positive(),
  fechaEvento: z
    .string({ required_error: 'La fecha del evento es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
  diagnostico: z
    .string()
    .optional(),
  medicamento: z
    .string()
    .max(100, 'El medicamento no puede exceder 100 caracteres')
    .optional(),
  dosis: z
    .string()
    .max(50, 'La dosis no puede exceder 50 caracteres')
    .optional(),
});

const updateEventoSanitarioSchema = z.object({
  idTipoEvento: z
    .number()
    .int()
    .positive()
    .optional(),
  fechaEvento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
    .optional(),
  diagnostico: z
    .string()
    .optional(),
  medicamento: z
    .string()
    .max(100, 'El medicamento no puede exceder 100 caracteres')
    .optional(),
  dosis: z
    .string()
    .max(50, 'La dosis no puede exceder 50 caracteres')
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

const aprobarEventoSchema = z.object({
  estadoAprobacion: z.enum(['APROBADO', 'RECHAZADO'], {
    required_error: 'El estado de aprobación es obligatorio',
    invalid_type_error: 'Estado inválido. Valores permitidos: APROBADO, RECHAZADO',
  }),
});

module.exports = {
  createEventoSanitarioSchema,
  updateEventoSanitarioSchema,
  aprobarEventoSchema,
};
