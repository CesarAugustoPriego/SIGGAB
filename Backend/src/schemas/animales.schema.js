const { z } = require('zod');

const sexoAnimalSchema = z.enum(['HEMBRA', 'MACHO'], {
  required_error: 'El sexo del animal es obligatorio',
  invalid_type_error: 'Sexo invalido. Valores permitidos: HEMBRA, MACHO',
});

const procedenciaAnimalSchema = z.enum(['NACIDA', 'ADQUIRIDA'], {
  required_error: 'La procedencia es obligatoria',
  invalid_type_error: 'Procedencia invalida. Valores permitidos: NACIDA, ADQUIRIDA',
});

const fotoBase64Schema = z
  .string()
  .regex(
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
    'La foto debe ser una imagen JPG, PNG o WEBP en base64'
  )
  .max(7_000_000, 'La foto del animal es demasiado grande');

const createAnimalSchema = z.object({
  numeroArete: z
    .string({ required_error: 'El numero de arete es obligatorio' })
    .regex(/^27\d{8}$/, 'El arete SINIIGA debe tener 10 digitos numericos y comenzar con 27 (Tabasco). Ejemplo: 2712345678'),
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
  sexo: sexoAnimalSchema,
  procedencia: procedenciaAnimalSchema,
  edadEstimada: z
    .number({ required_error: 'La edad estimada es obligatoria' })
    .int('La edad debe ser un numero entero')
    .min(0, 'La edad no puede ser negativa'),
  estadoSanitarioInicial: z
    .string({ required_error: 'El estado sanitario inicial es obligatorio' })
    .min(1, 'El estado sanitario inicial no puede estar vacio'),
  fotoBase64: fotoBase64Schema.optional(),
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
  sexo: sexoAnimalSchema.optional(),
  procedencia: procedenciaAnimalSchema.optional(),
  edadEstimada: z
    .number()
    .int('La edad debe ser un numero entero')
    .min(0, 'La edad no puede ser negativa')
    .optional(),
  estadoSanitarioInicial: z
    .string()
    .optional(),
  fotoBase64: fotoBase64Schema.optional(),
  eliminarFoto: z.boolean().optional(),
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
