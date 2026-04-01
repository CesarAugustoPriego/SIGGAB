const { z } = require('zod');

const loginSchema = z.object({
  username: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El refresh token es obligatorio' })
    .min(1, 'El refresh token no puede estar vacío'),
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
};
