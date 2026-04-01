const { z } = require('zod');

const detalleSchema = z.object({
  idInsumo: z.number({ required_error: 'El insumo es obligatorio' }).int().positive(),
  cantidad: z.number({ required_error: 'La cantidad es obligatoria' }).positive(),
  precioEstimado: z.number({ required_error: 'El precio estimado es obligatorio' }).positive(),
});

const createSolicitudSchema = z.object({
  fechaSolicitud: z
    .string({ required_error: 'La fecha de solicitud es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  observaciones: z.string().max(500).optional(),
  detalles: z
    .array(detalleSchema, { required_error: 'Debe incluir al menos un insumo' })
    .min(1, 'La solicitud debe tener al menos un detalle'),
});

const aprobarSolicitudSchema = z.object({
  estadoSolicitud: z.enum(['APROBADA', 'RECHAZADA'], {
    required_error: 'El estado es obligatorio',
    invalid_type_error: 'Debe ser APROBADA o RECHAZADA',
  }),
  observaciones: z.string().max(500).optional(),
});

module.exports = { createSolicitudSchema, aprobarSolicitudSchema };
