const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const baseReporteSchema = z.object({
  fechaInicio: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido').optional(),
  fechaFin: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido').optional(),
  formato: z.enum(['json', 'csv', 'pdf']).default('json'),
}).refine((data) => {
  if (!data.fechaInicio || !data.fechaFin) return true;
  return new Date(data.fechaFin) >= new Date(data.fechaInicio);
}, {
  message: 'fechaFin debe ser mayor o igual a fechaInicio',
  path: ['fechaFin'],
});

const sanitarioReporteSchema = baseReporteSchema.extend({
  estadoAprobacion: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO']).optional(),
  idTipoEvento: z.coerce.number().int().positive().optional(),
});

const productivoReporteSchema = baseReporteSchema.extend({
  idAnimal: z.coerce.number().int().positive().optional(),
});

const administrativoReporteSchema = baseReporteSchema;

const inventarioReporteSchema = baseReporteSchema.extend({
  categoria: z.string().trim().min(1).optional(),
});

const sanitarioHatoReporteSchema = baseReporteSchema.extend({
  estado: z.enum(['SANO', 'EN_TRATAMIENTO', 'ENFERMO']).optional(),
});

const productividadReporteSchema = baseReporteSchema.extend({
  edadMinimaMeses: z.coerce.number().int().min(0).default(0),
});

const comparativoReporteSchema = z.object({
  modulo: z.enum(['sanitario', 'productivo']),
  periodoAInicio: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoAFin: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoBInicio: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoBFin: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  formato: z.enum(['json', 'csv', 'pdf']).default('json'),
}).refine((data) => new Date(data.periodoAFin) >= new Date(data.periodoAInicio), {
  message: 'periodoAFin debe ser mayor o igual a periodoAInicio',
  path: ['periodoAFin'],
}).refine((data) => new Date(data.periodoBFin) >= new Date(data.periodoBInicio), {
  message: 'periodoBFin debe ser mayor o igual a periodoBInicio',
  path: ['periodoBFin'],
});

const comparativoPeriodosBaseSchema = z.object({
  modulo: z.enum(['productividad', 'sanitario', 'perdidas']).default('productividad'),
  periodoAInicio: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoAFin: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoBInicio: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  periodoBFin: z.string().regex(dateRegex, 'Formato YYYY-MM-DD requerido'),
  edadMinimaMeses: z.coerce.number().int().min(0).default(0),
  formato: z.enum(['json', 'csv', 'pdf']).default('json'),
});

const comparativoFechasReporteSchema = comparativoPeriodosBaseSchema.refine((data) => new Date(data.periodoAFin) >= new Date(data.periodoAInicio), {
  message: 'periodoAFin debe ser mayor o igual a periodoAInicio',
  path: ['periodoAFin'],
}).refine((data) => new Date(data.periodoBFin) >= new Date(data.periodoBInicio), {
  message: 'periodoBFin debe ser mayor o igual a periodoBInicio',
  path: ['periodoBFin'],
});

const sanitarioComparativoReporteSchema = comparativoPeriodosBaseSchema.omit({ modulo: true, edadMinimaMeses: true }).refine((data) => new Date(data.periodoAFin) >= new Date(data.periodoAInicio), {
  message: 'periodoAFin debe ser mayor o igual a periodoAInicio',
  path: ['periodoAFin'],
}).refine((data) => new Date(data.periodoBFin) >= new Date(data.periodoBInicio), {
  message: 'periodoBFin debe ser mayor o igual a periodoBInicio',
  path: ['periodoBFin'],
});

const perdidasReporteSchema = baseReporteSchema.extend({
  motivo: z.string().trim().min(1).optional(),
});

const perdidasComparativoReporteSchema = comparativoPeriodosBaseSchema.omit({ modulo: true, edadMinimaMeses: true }).refine((data) => new Date(data.periodoAFin) >= new Date(data.periodoAInicio), {
  message: 'periodoAFin debe ser mayor o igual a periodoAInicio',
  path: ['periodoAFin'],
}).refine((data) => new Date(data.periodoBFin) >= new Date(data.periodoBInicio), {
  message: 'periodoBFin debe ser mayor o igual a periodoBInicio',
  path: ['periodoBFin'],
});

module.exports = {
  sanitarioReporteSchema,
  productivoReporteSchema,
  administrativoReporteSchema,
  comparativoReporteSchema,
  inventarioReporteSchema,
  sanitarioHatoReporteSchema,
  sanitarioComparativoReporteSchema,
  productividadReporteSchema,
  comparativoFechasReporteSchema,
  perdidasReporteSchema,
  perdidasComparativoReporteSchema,
};
