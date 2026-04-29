const { z } = require('zod');

const createRegistroPesoSchema = z.object({
  idAnimal: z.number({ required_error: 'El animal es obligatorio' }).int().positive(),
  peso: z.number({ required_error: 'El peso es obligatorio' }).positive('El peso debe ser un valor positivo'),
  fechaRegistro: z
    .string({ required_error: 'La fecha de registro es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
});

const validarRegistroSchema = z.object({
  estadoValidacion: z.enum(['APROBADO', 'RECHAZADO'], {
    required_error: 'El estado de validación es obligatorio',
    invalid_type_error: 'Debe ser APROBADO o RECHAZADO',
  }),
});

const updateRegistroPesoSchema = z.object({
  peso: z.number().positive('El peso debe ser un valor positivo').optional(),
  fechaRegistro: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')
    .optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

module.exports = { createRegistroPesoSchema, validarRegistroSchema, updateRegistroPesoSchema };
