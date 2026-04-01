const { Router } = require('express');
const ctrl = require('../controllers/solicitudes-compra.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createSolicitudSchema, aprobarSolicitudSchema } = require('../schemas/solicitudes-compra.schema');

const router = Router();
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Compras
 *   description: Solicitudes de compra y compras realizadas (flujo de adquisición)
 */

/**
 * @swagger
 * /solicitudes-compra:
 *   get:
 *     tags: [Compras]
 *     summary: Listar solicitudes de compra
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, APROBADA, RECHAZADA]
 *     responses:
 *       200:
 *         description: Lista de solicitudes con sus detalles
 *   post:
 *     tags: [Compras]
 *     summary: Crear solicitud de compra (solo Almacén — RN-13)
 *     description: |
 *       **RN-13:** Solo el rol **Almacén** puede crear solicitudes.
 *       Incluye detalles con insumos, cantidades y precios estimados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SolicitudCompra'
 *           example:
 *             fechaSolicitud: "2024-07-01"
 *             observaciones: "Reposición mensual de medicamentos"
 *             detalles:
 *               - idInsumo: 1
 *                 cantidad: 50
 *                 precioEstimado: 12.5
 *     responses:
 *       201:
 *         description: Solicitud creada con detalles
 *       403:
 *         description: Solo Almacén puede crear solicitudes (RN-13)
 */
router.get('/', requireRole('Administrador', 'Almacén', 'Propietario'), ctrl.getAll);
router.post('/', requireRole('Almacén'), validate(createSolicitudSchema), ctrl.create);

/**
 * @swagger
 * /solicitudes-compra/{id}:
 *   get:
 *     tags: [Compras]
 *     summary: Obtener solicitud por ID con detalles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud con detalles e historial de compras
 *       404:
 *         description: No encontrada
 */
router.get('/:id', requireRole('Administrador', 'Almacén', 'Propietario'), ctrl.getById);

/**
 * @swagger
 * /solicitudes-compra/{id}/aprobar:
 *   patch:
 *     tags: [Compras]
 *     summary: Aprobar o rechazar solicitud (solo Admin — RN-14)
 *     description: |
 *       **RN-14:** Solo el **Administrador** puede aprobar/rechazar.
 *       **RN-15:** Una solicitud RECHAZADA no puede reabrirse.
 *       **RN-17:** Una solicitud con compra ya generada no puede cambiarse.
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
 *             required: [estadoSolicitud]
 *             properties:
 *               estadoSolicitud:
 *                 type: string
 *                 enum: [APROBADA, RECHAZADA]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitud procesada
 *       400:
 *         description: Ya fue rechazada o ya tiene compra (RN-15, RN-17)
 *       403:
 *         description: Solo Administrador (RN-14)
 */
router.patch('/:id/aprobar', requireRole('Administrador'), validate(aprobarSolicitudSchema), ctrl.aprobar);

module.exports = router;
