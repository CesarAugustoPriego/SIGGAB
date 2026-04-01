const { z } = require('zod');

const createAnimalSchema = z.object({
  numeroArete: z
    .string({ required_error: 'El numero de arete es obligatorio' })
    .min(1, 'El numero de arete no puede estar vacio')
    .max(50, 'El numero de arete no puede exceder 50 caracteres'),
  fechaIngreso: z
    .string({ required_error: 'La fecha de ingreso es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
  pesoInicial: z
    .number({ required_error: 'El peso inicial es obligatorio' })
    .positive('El peso debe ser un numero positivo'),
  idRaza: z
    .number({ required_error: 'La raza es obligatoria' })
    .int('El ID de raza debe ser un numero entero')
    .positive('El ID de raza debe ser positivo'),
  procedencia: z
    .string({ required_error: 'La procedencia es obligatoria' })
    .min(1, 'La procedencia no puede estar vacia')
    .max(100, 'La procedencia no puede exceder 100 caracteres'),
  edadEstimada: z
    .number({ required_error: 'La edad estimada es obligatoria' })
    .int('La edad debe ser un numero entero')
    .min(0, 'La edad no puede ser negativa'),
  estadoSanitarioInicial: z
    .string({ required_error: 'El estado sanitario inicial es obligatorio' })
    .min(1, 'El estado sanitario inicial no puede estar vacio'),
});

const updateAnimalSchema = z.object({
  fechaIngreso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
    .optional(),
  pesoInicial: z
    .number()
    .positive('El peso debe ser un numero positivo')
    .optional(),
  idRaza: z
    .number()
    .int('El ID de raza debe ser un numero entero')
    .positive('El ID de raza debe ser positivo')
    .optional(),
  procedencia: z
    .string()
    .max(100, 'La procedencia no puede exceder 100 caracteres')
    .optional(),
  edadEstimada: z
    .number()
    .int('La edad debe ser un numero entero')
    .min(0, 'La edad no puede ser negativa')
    .optional(),
  estadoSanitarioInicial: z
    .string()
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

const bajaAnimalSchema = z.object({
  estadoActual: z.enum(['VENDIDO', 'MUERTO', 'TRANSFERIDO'], {
    required_error: 'El estado de baja es obligatorio',
    invalid_type_error: 'Estado invalido. Valores permitidos: VENDIDO, MUERTO, TRANSFERIDO',
  }),
  motivoBaja: z
    .string({ required_error: 'El motivo de baja es obligatorio (RN-08)' })
    .min(5, 'El motivo de baja debe tener al menos 5 caracteres'),
  fechaBaja: z
    .string({ required_error: 'La fecha de baja es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
});

module.exports = {
  createAnimalSchema,
  updateAnimalSchema,
  bajaAnimalSchema,
};
