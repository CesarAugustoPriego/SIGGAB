const { Router } = require('express');
const eventosSanitariosController = require('../controllers/eventos-sanitarios.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createEventoSanitarioSchema,
  updateEventoSanitarioSchema,
  aprobarEventoSchema,
} = require('../schemas/eventos-sanitarios.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: EventosSanitarios
 *   description: Registro y autorizacion de eventos sanitarios (RF05, RF11)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /eventos-sanitarios/tipos:
 *   get:
 *     tags: [EventosSanitarios]
 *     summary: Listar tipos de evento sanitario
 *     responses:
 *       200:
 *         description: Catalogo de tipos sanitarios
 *       401:
 *         description: No autenticado
 */
router.get('/tipos', eventosSanitariosController.getTiposEvento);

/**
 * @swagger
 * /eventos-sanitarios:
 *   get:
 *     tags: [EventosSanitarios]
 *     summary: Listar eventos sanitarios
 *     parameters:
 *       - in: query
 *         name: animal
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Eventos sanitarios obtenidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *   post:
 *     tags: [EventosSanitarios]
 *     summary: Registrar evento sanitario
 *     description: El registro queda en estado PENDIENTE hasta su autorizacion oficial.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idAnimal, idTipoEvento, fechaEvento]
 *             properties:
 *               idAnimal:
 *                 type: integer
 *               idTipoEvento:
 *                 type: integer
 *               fechaEvento:
 *                 type: string
 *                 format: date
 *               diagnostico:
 *                 type: string
 *               medicamento:
 *                 type: string
 *               dosis:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evento sanitario creado
 *       400:
 *         description: Error de validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario'),
  eventosSanitariosController.getAll
);
router.post(
  '/',
  requireRole('Medico Veterinario', 'Campo'),
  validate(createEventoSanitarioSchema),
  eventosSanitariosController.create
);

/**
 * @swagger
 * /eventos-sanitarios/{id}:
 *   get:
 *     tags: [EventosSanitarios]
 *     summary: Obtener evento sanitario por ID
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
 *     tags: [EventosSanitarios]
 *     summary: Modificar evento sanitario
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
 *               idTipoEvento:
 *                 type: integer
 *               fechaEvento:
 *                 type: string
 *                 format: date
 *               diagnostico:
 *                 type: string
 *               medicamento:
 *                 type: string
 *               dosis:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evento modificado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Evento no encontrado
 */
router.get(
  '/:id',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario'),
  eventosSanitariosController.getById
);
router.patch(
  '/:id',
  requireRole('Medico Veterinario'),
  validate(updateEventoSanitarioSchema),
  eventosSanitariosController.update
);

/**
 * @swagger
 * /eventos-sanitarios/{id}/aprobar:
 *   patch:
 *     tags: [EventosSanitarios]
 *     summary: Autorizar o rechazar evento sanitario (RF11)
 *     description: Autorizacion oficial permitida solo para Medico Veterinario.
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
 *             required: [estadoAprobacion]
 *             properties:
 *               estadoAprobacion:
 *                 type: string
 *                 enum: [APROBADO, RECHAZADO]
 *     responses:
 *       200:
 *         description: Evento autorizado o rechazado
 *       400:
 *         description: Error de validacion o regla de negocio
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Evento no encontrado
 */
router.patch(
  '/:id/aprobar',
  requireRole('Medico Veterinario'),
  validate(aprobarEventoSchema),
  eventosSanitariosController.aprobar
);

module.exports = router;
