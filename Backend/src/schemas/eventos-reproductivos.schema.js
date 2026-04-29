const { z } = require('zod');

const createEventoReproductivoSchema = z.object({
  idAnimal: z.number({ required_error: 'El animal es obligatorio' }).int().positive(),
  tipoEvento: z.enum(['CELO', 'MONTA', 'PREÑEZ', 'PARTO', 'ABORTO'], {
    required_error: 'El tipo de evento reproductivo es obligatorio',
    invalid_type_error: 'Tipo inválido. Valores: CELO, MONTA, PREÑEZ, PARTO, ABORTO',
  }),
  fechaEvento: z
    .string({ required_error: 'La fecha del evento es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  observaciones: z.string().max(1000).optional(),
});

const validarEventoReproductivoSchema = z.object({
  estadoValidacion: z.enum(['APROBADO', 'RECHAZADO'], {
    required_error: 'El estado de validación es obligatorio',
  }),
});

const updateEventoReproductivoSchema = z.object({
  tipoEvento: z.enum(['CELO', 'MONTA', 'PREÑEZ', 'PARTO', 'ABORTO']).optional(),
  fechaEvento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')
    .optional(),
  observaciones: z.string().max(1000).optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

module.exports = {
  createEventoReproductivoSchema,
  validarEventoReproductivoSchema,
  updateEventoReproductivoSchema,
};
