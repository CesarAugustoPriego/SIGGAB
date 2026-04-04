const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = Router();
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: KPIs y reportes del sistema
 */

/**
 * @swagger
 * /dashboard/resumen:
 *   get:
 *     tags: [Dashboard]
 *     summary: KPIs generales del rancho
 *     description: Retorna totales rápidos del sistema — animales activos, alertas próximas, solicitudes pendientes, stock agotado.
 *     responses:
 *       200:
 *         description: KPIs generales
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardResumen'
 */
router.get('/resumen', requireRole('Propietario', 'Administrador'), ctrl.getResumen);

/**
 * @swagger
 * /dashboard/ganado:
 *   get:
 *     tags: [Dashboard]
 *     summary: Distribución del hato (por raza y estado)
 *     responses:
 *       200:
 *         description: Agrupaciones del hato ganadero
 */
router.get('/ganado', requireRole('Propietario', 'Administrador'), ctrl.getGanado);

/**
 * @swagger
 * /dashboard/produccion:
 *   get:
 *     tags: [Dashboard]
 *     summary: Indicadores productivos (últimos 30 días)
 *     description: Promedio de peso, total litros de leche y eventos reproductivos agrupados por tipo.
 *     responses:
 *       200:
 *         description: Métricas productivas
 */
router.get('/produccion', requireRole('Propietario', 'Administrador', 'Producción'), ctrl.getProduccion);

/**
 * @swagger
 * /dashboard/sanitario:
 *   get:
 *     tags: [Dashboard]
 *     summary: Estado sanitario — próximos eventos y pendientes por aprobar
 *     responses:
 *       200:
 *         description: Panel sanitario
 */
router.get('/sanitario', requireRole('Propietario', 'Administrador', 'Médico Veterinario'), ctrl.getSanitario);

/**
 * @swagger
 * /dashboard/inventario:
 *   get:
 *     tags: [Dashboard]
 *     summary: Estado del inventario — insumos agotados y bajo stock
 *     responses:
 *       200:
 *         description: Panel de inventario
 */
router.get('/inventario', requireRole('Propietario', 'Administrador', 'Almacén'), ctrl.getInventario);

/**
 * @swagger
 * /dashboard/stream:
 *   get:
 *     tags: [Dashboard]
 *     summary: Stream SSE de KPIs de resumen en tiempo real
 *     description: Envía un snapshot de /dashboard/resumen cada 15 segundos.
 *     responses:
 *       200:
 *         description: Stream abierto
 */
router.get('/stream', requireRole('Propietario', 'Administrador'), ctrl.getStream);

/**
 * @swagger
 * /dashboard/bitacora:
 *   get:
 *     tags: [Dashboard]
 *     summary: Bitácora de auditoría (Administrador y Propietario)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 500
 *         description: Número de registros a retornar
 *     responses:
 *       200:
 *         description: Últimas acciones registradas en el sistema
 *       403:
 *         description: Solo accesible por Administrador o Propietario
 */
router.get('/bitacora', requireRole('Administrador', 'Propietario'), ctrl.getBitacora);

module.exports = router;
