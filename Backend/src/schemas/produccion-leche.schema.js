const { z } = require('zod');

const createProduccionLecheSchema = z.object({
  idAnimal: z.number({ required_error: 'El animal es obligatorio' }).int().positive(),
  idLote: z.number({ required_error: 'El lote es obligatorio' }).int().positive(),
  litrosProducidos: z
    .number({ required_error: 'Los litros producidos son obligatorios' })
    .positive('Los litros deben ser un valor positivo'),
  fechaRegistro: z
    .string({ required_error: 'La fecha de registro es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
});

const validarProduccionSchema = z.object({
  estadoValidacion: z.enum(['APROBADO', 'RECHAZADO'], {
    required_error: 'El estado de validación es obligatorio',
  }),
});

const updateProduccionLecheSchema = z.object({
  litrosProducidos: z
    .number()
    .positive('Los litros deben ser un valor positivo')
    .optional(),
  fechaRegistro: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')
    .optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

module.exports = { createProduccionLecheSchema, validarProduccionSchema, updateProduccionLecheSchema };
