const { z } = require('zod');

const createRazaSchema = z.object({
  nombreRaza: z
    .string({ required_error: 'El nombre de la raza es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
});

const updateRazaSchema = z.object({
  nombreRaza: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .optional(),
  activo: z
    .boolean()
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

module.exports = {
  createRazaSchema,
  updateRazaSchema,
};
