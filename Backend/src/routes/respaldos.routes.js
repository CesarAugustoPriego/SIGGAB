const { Router } = require('express');
const ctrl = require('../controllers/respaldos.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const loggingMiddleware = require('../middlewares/logging.middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Respaldos
 *   description: Respaldo automatico y manual de datos criticos
 */

router.use(auth);
router.use(requireRole('Administrador'));

/**
 * @swagger
 * /respaldos:
 *   get:
 *     tags: [Respaldos]
 *     summary: Listar respaldos registrados
 *     responses:
 *       200:
 *         description: Lista de respaldos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/',
  loggingMiddleware({
    accion: 'CONSULTAR_RESPALDOS',
    tablaAfectada: 'respaldos',
    getIdRegistro: () => 0,
  }),
  ctrl.list
);

/**
 * @swagger
 * /respaldos/ejecutar:
 *   post:
 *     tags: [Respaldos]
 *     summary: Ejecutar respaldo manual
 *     responses:
 *       200:
 *         description: Respaldo ejecutado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error de ejecucion
 */
router.post(
  '/ejecutar',
  loggingMiddleware({
    accion: 'RESPALDAR',
    tablaAfectada: 'respaldos',
    getIdRegistro: () => 0,
    getDetalles: () => ({ manual: true }),
  }),
  ctrl.ejecutar
);

module.exports = router;
