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

/**
 * @swagger
 * /respaldos/{fileName}/descargar:
 *   get:
 *     tags: [Respaldos]
 *     summary: Descargar archivo de respaldo
 *     description: |
 *       Descarga un respaldo existente por nombre de archivo.
 *       **Nota:** la restauracion de respaldos se mantiene como operacion de soporte via CLI.
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *           example: siggab-backup-2026-04-04T16-20-10-120Z.json
 *     responses:
 *       200:
 *         description: Archivo de respaldo descargado
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Nombre de archivo invalido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Archivo no encontrado
 */
router.get(
  '/:fileName/descargar',
  loggingMiddleware({
    accion: 'DESCARGAR_RESPALDO',
    tablaAfectada: 'respaldos',
    getIdRegistro: () => 0,
    getDetalles: (req) => ({ fileName: req.params.fileName || null }),
  }),
  ctrl.descargar
);

module.exports = router;
