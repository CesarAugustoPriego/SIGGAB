const { Router } = require('express');
const ctrl = require('../controllers/compras-realizadas.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createCompraSchema } = require('../schemas/compras-realizadas.schema');

const router = Router();
router.use(auth);

/**
 * @swagger
 * /compras-realizadas:
 *   get:
 *     tags: [Compras]
 *     summary: Listar compras realizadas
 *     responses:
 *       200:
 *         description: Lista de compras con detalles y movimientos generados
 *   post:
 *     tags: [Compras]
 *     summary: Registrar compra realizada (RN-16 — genera entradas de inventario)
 *     description: |
 *       **RN-16:** Al confirmar la compra, el sistema ejecuta una **transacción atómica** que:
 *       1. Crea la compra y sus detalles
 *       2. Genera un `MovimientoInventario` ENTRADA por cada detalle
 *       3. Actualiza `stockActual` de cada insumo
 *
 *       **RN-17:** La solicitud asociada debe estar en estado `APROBADA`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idSolicitud, fechaCompra, detalles]
 *             properties:
 *               idSolicitud:
 *                 type: integer
 *               fechaCompra:
 *                 type: string
 *                 format: date
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idInsumo:
 *                       type: integer
 *                     cantidadReal:
 *                       type: number
 *                     precioUnitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Compra registrada y stock actualizado automáticamente
 *       400:
 *         description: Solicitud no aprobada o ya tiene compra (RN-17)
 */
router.get('/', requireRole('Administrador', 'Propietario'), ctrl.getAll);
router.post('/', requireRole('Administrador'), validate(createCompraSchema), ctrl.create);

/**
 * @swagger
 * /compras-realizadas/{id}:
 *   get:
 *     tags: [Compras]
 *     summary: Obtener compra por ID con detalles y movimientos generados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra con detalles y movimientos de inventario
 */
router.get('/:id', requireRole('Administrador', 'Propietario'), ctrl.getById);

module.exports = router;
