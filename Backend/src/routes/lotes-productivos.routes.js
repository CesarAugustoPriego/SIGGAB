const { Router } = require('express');
const ctrl = require('../controllers/lotes-productivos.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createLoteSchema, validarLoteSchema } = require('../schemas/lotes-productivos.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ProductivoLotes
 *   description: Lotes semanales para validacion productiva
 */

router.use(auth);

/**
 * @swagger
 * /lotes-productivos:
 *   get:
 *     tags: [ProductivoLotes]
 *     summary: Listar lotes productivos
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Lotes obtenidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *   post:
 *     tags: [ProductivoLotes]
 *     summary: Crear lote productivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fechaInicio, fechaFin]
 *             properties:
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Lote creado
 *       400:
 *         description: Error de validacion
 */
router.get('/', requireRole('Propietario', 'Administrador', 'Produccion'), ctrl.getAll);
router.post('/', requireRole('Produccion', 'Administrador'), validate(createLoteSchema), ctrl.create);

/**
 * @swagger
 * /lotes-productivos/{id}:
 *   get:
 *     tags: [ProductivoLotes]
 *     summary: Obtener lote por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lote obtenido
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id', requireRole('Propietario', 'Administrador', 'Produccion'), ctrl.getById);

/**
 * @swagger
 * /lotes-productivos/{id}/validar:
 *   patch:
 *     tags: [ProductivoLotes]
 *     summary: Validar lote productivo
 *     description: Solo Administrador puede aprobar o rechazar lotes.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Lote validado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Lote no encontrado
 */
router.patch('/:id/validar', requireRole('Administrador'), validate(validarLoteSchema), ctrl.validar);

module.exports = router;
