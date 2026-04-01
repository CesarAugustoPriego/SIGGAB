const { z } = require('zod');

const createTipoInsumoSchema = z.object({
  nombreTipo: z.string({ required_error: 'El nombre del tipo es obligatorio' }).min(2).max(50),
  descripcion: z.string().max(500).optional(),
});

const updateTipoInsumoSchema = z.object({
  nombreTipo: z.string().min(2).max(50).optional(),
  descripcion: z.string().max(500).optional(),
  activo: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe proporcionar al menos un campo' });

const createInsumoSchema = z.object({
  nombreInsumo: z.string({ required_error: 'El nombre del insumo es obligatorio' }).min(2).max(100),
  idTipoInsumo: z.number({ required_error: 'El tipo de insumo es obligatorio' }).int().positive(),
  unidadMedida: z.string({ required_error: 'La unidad de medida es obligatoria' }).max(20),
  descripcion: z.string().max(500).optional(),
  stockActual: z.number().nonnegative().optional(),
});

const updateInsumoSchema = z.object({
  nombreInsumo: z.string().min(2).max(100).optional(),
  idTipoInsumo: z.number().int().positive().optional(),
  unidadMedida: z.string().max(20).optional(),
  descripcion: z.string().max(500).optional(),
  activo: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe proporcionar al menos un campo' });

module.exports = { createTipoInsumoSchema, updateTipoInsumoSchema, createInsumoSchema, updateInsumoSchema };
