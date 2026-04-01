const { Router } = require('express');
const ctrl = require('../controllers/produccion-leche.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createProduccionLecheSchema,
  validarProduccionSchema,
  updateProduccionLecheSchema,
} = require('../schemas/produccion-leche.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ProductivoLeche
 *   description: Registros de produccion de leche por animal
 */

router.use(auth);

/**
 * @swagger
 * /produccion-leche:
 *   get:
 *     tags: [ProductivoLeche]
 *     summary: Listar registros de produccion de leche
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
 *     tags: [ProductivoLeche]
 *     summary: Registrar produccion de leche
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idAnimal, idLote, litrosProducidos, fechaRegistro]
 *             properties:
 *               idAnimal:
 *                 type: integer
 *               idLote:
 *                 type: integer
 *               litrosProducidos:
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
router.post('/', requireRole('Produccion', 'Campo', 'Administrador'), validate(createProduccionLecheSchema), ctrl.create);

/**
 * @swagger
 * /produccion-leche/{id}:
 *   get:
 *     tags: [ProductivoLeche]
 *     summary: Obtener registro de produccion por ID
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
 *     tags: [ProductivoLeche]
 *     summary: Modificar registro de produccion de leche
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
 *               litrosProducidos:
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
router.patch('/:id', requireRole('Produccion'), validate(updateProduccionLecheSchema), ctrl.update);

/**
 * @swagger
 * /produccion-leche/{id}/validar:
 *   patch:
 *     tags: [ProductivoLeche]
 *     summary: Validar registro de produccion de leche
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
router.patch('/:id/validar', requireRole('Administrador'), validate(validarProduccionSchema), ctrl.validar);

module.exports = router;
