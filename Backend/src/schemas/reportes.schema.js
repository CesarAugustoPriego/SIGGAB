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

module.exports = {
  sanitarioReporteSchema,
  productivoReporteSchema,
  administrativoReporteSchema,
  comparativoReporteSchema,
};
