const { Router } = require('express');
const ctrl = require('../controllers/reportes.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const loggingMiddleware = require('../middlewares/logging.middleware');
const {
  sanitarioReporteSchema,
  productivoReporteSchema,
  administrativoReporteSchema,
  comparativoReporteSchema,
} = require('../schemas/reportes.schema');

const router = Router();
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Reportes configurables sanitarios, productivos y administrativos
 */

const logReporte = (tipo) => loggingMiddleware({
  accion: 'CONSULTAR_REPORTE',
  tablaAfectada: 'reportes',
  getIdRegistro: () => 0,
  getDetalles: (req) => ({ tipo, filtros: req.query }),
});

/**
 * @swagger
 * /reportes/sanitario:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar reporte sanitario
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: estadoAprobacion
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADO, RECHAZADO]
 *       - in: query
 *         name: idTipoEvento
 *         schema:
 *           type: integer
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Reporte generado (JSON, CSV o PDF)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/sanitario',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario', 'Almacén'),
  validate(sanitarioReporteSchema, 'query'),
  logReporte('sanitario'),
  ctrl.getSanitario
);

/**
 * @swagger
 * /reportes/productivo:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar reporte productivo
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: idAnimal
 *         schema:
 *           type: integer
 *       - in: query
 *         name: idLote
 *         schema:
 *           type: integer
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Reporte generado (JSON, CSV o PDF)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/productivo',
  requireRole('Propietario', 'Administrador', 'Produccion'),
  validate(productivoReporteSchema, 'query'),
  logReporte('productivo'),
  ctrl.getProductivo
);

/**
 * @swagger
 * /reportes/administrativo:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar reporte administrativo
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Reporte generado (JSON, CSV o PDF)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/administrativo',
  requireRole('Propietario', 'Administrador', 'Almacén'),
  validate(administrativoReporteSchema, 'query'),
  logReporte('administrativo'),
  ctrl.getAdministrativo
);

/**
 * @swagger
 * /reportes/comparativo:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar reporte comparativo historico (RF13)
 *     parameters:
 *       - in: query
 *         name: modulo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sanitario, productivo]
 *       - in: query
 *         name: periodoAInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodoAFin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodoBInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodoBFin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Reporte comparativo generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/comparativo',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario', 'Produccion'),
  validate(comparativoReporteSchema, 'query'),
  logReporte('comparativo'),
  ctrl.getComparativo
);

module.exports = router;
