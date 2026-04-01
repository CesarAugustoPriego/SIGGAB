const { Router } = require('express');
const razasController = require('../controllers/razas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createRazaSchema, updateRazaSchema } = require('../schemas/razas.schema');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Razas
 *   description: Catalogo de razas bovinas
 */

/**
 * @swagger
 * /razas:
 *   get:
 *     tags: [Razas]
 *     summary: Listar razas
 *     responses:
 *       200:
 *         description: Razas obtenidas
 *   post:
 *     tags: [Razas]
 *     summary: Crear raza
 *     description: Solo Administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombreRaza]
 *             properties:
 *               nombreRaza:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Raza creada
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Sin permisos
 */
router.get('/', razasController.getAll);
router.post(
  '/',
  requireRole('Administrador'),
  validate(createRazaSchema),
  razasController.create
);

/**
 * @swagger
 * /razas/{id}:
 *   patch:
 *     tags: [Razas]
 *     summary: Modificar raza
 *     description: Solo Administrador.
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
 *             properties:
 *               nombreRaza:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Raza actualizada
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Raza no encontrada
 */
router.patch(
  '/:id',
  requireRole('Administrador'),
  validate(updateRazaSchema),
  razasController.update
);

module.exports = router;
