const { Router } = require('express');
const ctrl = require('../controllers/registros-peso.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createRegistroPesoSchema,
  validarRegistroSchema,
  updateRegistroPesoSchema,
} = require('../schemas/registros-peso.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ProductivoPeso
 *   description: Registros de peso por animal
 */

router.use(auth);

/**
 * @swagger
 * /registros-peso:
 *   get:
 *     tags: [ProductivoPeso]
 *     summary: Listar registros de peso
 *     parameters:
 *       - in: query
 *         name: idAnimal
 *         schema:
 *           type: integer
 *       - in: query
 *         name: idLote
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Registros obtenidos
 *   post:
 *     tags: [ProductivoPeso]
 *     summary: Crear registro de peso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idAnimal, idLote, peso, fechaRegistro]
 *             properties:
 *               idAnimal:
 *                 type: integer
 *               idLote:
 *                 type: integer
 *               peso:
 *                 type: number
 *               fechaRegistro:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Registro creado
 *       400:
 *         description: Error de validacion
 */
router.get('/', requireRole('Propietario', 'Administrador', 'Produccion'), ctrl.getAll);
router.post('/', requireRole('Produccion', 'Campo', 'Administrador'), validate(createRegistroPesoSchema), ctrl.create);

/**
 * @swagger
 * /registros-peso/{id}:
 *   get:
 *     tags: [ProductivoPeso]
 *     summary: Obtener registro de peso por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro encontrado
 *       404:
 *         description: Registro no encontrado
 *   patch:
 *     tags: [ProductivoPeso]
 *     summary: Modificar registro de peso
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
 *               peso:
 *                 type: number
 *               fechaRegistro:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Registro actualizado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Registro no encontrado
 */
router.get('/:id', requireRole('Propietario', 'Administrador', 'Produccion'), ctrl.getById);
router.patch('/:id', requireRole('Produccion'), validate(updateRegistroPesoSchema), ctrl.update);

/**
 * @swagger
 * /registros-peso/{id}/validar:
 *   patch:
 *     tags: [ProductivoPeso]
 *     summary: Validar registro de peso
 *     description: Flujo RF11, validacion oficial por Administrador.
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
 *             required: [estadoValidacion]
 *             properties:
 *               estadoValidacion:
 *                 type: string
 *                 enum: [APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Registro validado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Registro no encontrado
 */
router.patch('/:id/validar', requireRole('Administrador'), validate(validarRegistroSchema), ctrl.validar);

module.exports = router;
