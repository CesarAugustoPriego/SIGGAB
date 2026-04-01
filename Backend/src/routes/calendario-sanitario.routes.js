const { Router } = require('express');
const calendarioController = require('../controllers/calendario-sanitario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createCalendarioSchema,
  updateCalendarioSchema,
  completarCalendarioSchema,
} = require('../schemas/calendario-sanitario.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CalendarioSanitario
 *   description: Programacion y alertas sanitarias
 */

router.use(authMiddleware);

/**
 * @swagger
 * /calendario-sanitario/alertas:
 *   get:
 *     tags: [CalendarioSanitario]
 *     summary: Obtener alertas sanitarias proximas (RF06)
 *     description: Retorna eventos con alerta activa. El backend aplica regla minima de 3 dias de anticipacion.
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 7
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/alertas',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario'),
  calendarioController.getAlertas
);

/**
 * @swagger
 * /calendario-sanitario:
 *   get:
 *     tags: [CalendarioSanitario]
 *     summary: Listar eventos del calendario sanitario
 *     parameters:
 *       - in: query
 *         name: animal
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, COMPLETADO, CANCELADO]
 *     responses:
 *       200:
 *         description: Eventos obtenidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *   post:
 *     tags: [CalendarioSanitario]
 *     summary: Programar evento sanitario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idAnimal, idTipoEvento, fechaProgramada]
 *             properties:
 *               idAnimal:
 *                 type: integer
 *               idTipoEvento:
 *                 type: integer
 *               fechaProgramada:
 *                 type: string
 *                 format: date
 *               fechaAlerta:
 *                 type: string
 *                 format: date
 *                 description: Opcional. Si no se envia, backend calcula automaticamente 3 dias antes.
 *     responses:
 *       201:
 *         description: Evento programado
 *       400:
 *         description: Error de validacion o regla de negocio
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario'),
  calendarioController.getAll
);
router.post(
  '/',
  requireRole('Medico Veterinario'),
  validate(createCalendarioSchema),
  calendarioController.create
);

/**
 * @swagger
 * /calendario-sanitario/{id}:
 *   get:
 *     tags: [CalendarioSanitario]
 *     summary: Obtener evento de calendario por ID
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
 *     tags: [CalendarioSanitario]
 *     summary: Actualizar evento programado
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
 *               fechaProgramada:
 *                 type: string
 *                 format: date
 *               fechaAlerta:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Evento actualizado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Evento no encontrado
 */
router.get(
  '/:id',
  requireRole('Propietario', 'Administrador', 'Medico Veterinario'),
  calendarioController.getById
);
router.patch(
  '/:id',
  requireRole('Medico Veterinario'),
  validate(updateCalendarioSchema),
  calendarioController.update
);

/**
 * @swagger
 * /calendario-sanitario/{id}/completar:
 *   patch:
 *     tags: [CalendarioSanitario]
 *     summary: Marcar evento como completado o cancelado
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
 *                 enum: [COMPLETADO, CANCELADO]
 *     responses:
 *       200:
 *         description: Evento procesado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Evento no encontrado
 */
router.patch(
  '/:id/completar',
  requireRole('Medico Veterinario'),
  validate(completarCalendarioSchema),
  calendarioController.completar
);

module.exports = router;
