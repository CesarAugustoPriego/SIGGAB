const { Router } = require('express');
const ctrl = require('../controllers/eventos-reproductivos.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createEventoReproductivoSchema,
  validarEventoReproductivoSchema,
  updateEventoReproductivoSchema,
} = require('../schemas/eventos-reproductivos.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ProductivoReproductivo
 *   description: Eventos reproductivos por animal
 */

router.use(auth);

/**
 * @swagger
 * /eventos-reproductivos:
 *   get:
 *     tags: [ProductivoReproductivo]
 *     summary: Listar eventos reproductivos
 *     parameters:
 *       - in: query
 *         name: idAnimal
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [CELO, MONTA, PRENEZ, PARTO, ABORTO]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Eventos obtenidos
 *   post:
 *     tags: [ProductivoReproductivo]
 *     summary: Registrar evento reproductivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idAnimal, tipoEvento, fechaEvento]
 *             properties:
 *               idAnimal:
 *                 type: integer
 *               tipoEvento:
 *                 type: string
 *                 enum: [CELO, MONTA, PRENEZ, PARTO, ABORTO]
 *               fechaEvento:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evento creado
 *       400:
 *         description: Error de validacion
 */
router.get('/', requireRole('Propietario', 'Administrador', 'Produccion', 'Medico Veterinario'), ctrl.getAll);
router.post(
  '/',
  requireRole('Produccion', 'Campo', 'Administrador', 'Medico Veterinario'),
  validate(createEventoReproductivoSchema),
  ctrl.create
);

/**
 * @swagger
 * /eventos-reproductivos/{id}:
 *   get:
 *     tags: [ProductivoReproductivo]
 *     summary: Obtener evento reproductivo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento encontrado
 *       404:
 *         description: Evento no encontrado
 *   patch:
 *     tags: [ProductivoReproductivo]
 *     summary: Modificar evento reproductivo
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
 *               tipoEvento:
 *                 type: string
 *                 enum: [CELO, MONTA, PRENEZ, PARTO, ABORTO]
 *               fechaEvento:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evento actualizado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Evento no encontrado
 */
router.get('/:id', requireRole('Propietario', 'Administrador', 'Produccion', 'Medico Veterinario'), ctrl.getById);
router.patch(
  '/:id',
  requireRole('Produccion', 'Campo', 'Administrador', 'Medico Veterinario'),
  validate(updateEventoReproductivoSchema),
  ctrl.update
);

/**
 * @swagger
 * /eventos-reproductivos/{id}/validar:
 *   patch:
 *     tags: [ProductivoReproductivo]
 *     summary: Validar evento reproductivo
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
 *         description: Evento validado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Evento no encontrado
 */
router.patch('/:id/validar', requireRole('Administrador'), validate(validarEventoReproductivoSchema), ctrl.validar);

module.exports = router;
