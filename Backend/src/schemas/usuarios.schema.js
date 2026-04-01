const { z } = require('zod');

const createUsuarioSchema = z.object({
  nombreCompleto: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  username: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9._]+$/, 'El usuario solo puede contener letras, números, puntos y guiones bajos'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  idRol: z
    .number({ required_error: 'El rol es obligatorio' })
    .int('El ID del rol debe ser un número entero')
    .positive('El ID del rol debe ser positivo'),
});

const updateUsuarioSchema = z.object({
  nombreCompleto: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9._]+$/, 'El usuario solo puede contener letras, números, puntos y guiones bajos')
    .optional(),
  idRol: z
    .number()
    .int('El ID del rol debe ser un número entero')
    .positive('El ID del rol debe ser positivo')
    .optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

const updateEstadoSchema = z.object({
  activo: z.boolean({ required_error: 'El estado es obligatorio (true/false)' }),
});

module.exports = {
  createUsuarioSchema,
  updateUsuarioSchema,
  updateEstadoSchema,
};
