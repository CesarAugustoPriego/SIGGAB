const { z } = require('zod');

const detalleCompraSchema = z.object({
  idInsumo: z.number({ required_error: 'El insumo es obligatorio' }).int().positive(),
  cantidadReal: z.number({ required_error: 'La cantidad real es obligatoria' }).positive(),
  precioUnitario: z.number({ required_error: 'El precio unitario es obligatorio' }).positive(),
});

const createCompraSchema = z.object({
  idSolicitud: z.number({ required_error: 'La solicitud de compra es obligatoria' }).int().positive(),
  fechaCompra: z
    .string({ required_error: 'La fecha de compra es obligatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  detalles: z
    .array(detalleCompraSchema, { required_error: 'Debe incluir al menos un detalle' })
    .min(1, 'La compra debe tener al menos un detalle'),
});

module.exports = { createCompraSchema };
