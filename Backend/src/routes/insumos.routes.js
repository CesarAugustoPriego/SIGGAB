const { Router } = require('express');
const ctrl = require('../controllers/insumos.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createTipoInsumoSchema, updateTipoInsumoSchema,
  createInsumoSchema, updateInsumoSchema,
} = require('../schemas/insumos.schema');
const { createMovimientoSchema } = require('../schemas/movimientos-inventario.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventario
 *   description: Gestion de insumos, tipos y movimientos de inventario
 */

router.use(auth);

/**
 * @swagger
 * /insumos/tipos:
 *   get:
 *     tags: [Inventario]
 *     summary: Listar tipos de insumo
 *     responses:
 *       200:
 *         description: Tipos obtenidos
 *   post:
 *     tags: [Inventario]
 *     summary: Crear tipo de insumo
 *     description: Solo Administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombreTipo]
 *             properties:
 *               nombreTipo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo creado
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Sin permisos
 */
router.get('/tipos', ctrl.getAllTipos);
router.post('/tipos', requireRole('Administrador'), validate(createTipoInsumoSchema), ctrl.createTipo);

/**
 * @swagger
 * /insumos/tipos/{id}:
 *   patch:
 *     tags: [Inventario]
 *     summary: Modificar tipo de insumo
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
 *               nombreTipo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo actualizado
 *       404:
 *         description: Tipo no encontrado
 */
router.patch('/tipos/:id', requireRole('Administrador'), validate(updateTipoInsumoSchema), ctrl.updateTipo);

/**
 * @swagger
 * /insumos/movimientos:
 *   get:
 *     tags: [Inventario]
 *     summary: Listar movimientos de inventario
 *     parameters:
 *       - in: query
 *         name: idInsumo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ENTRADA, SALIDA]
 *     responses:
 *       200:
 *         description: Movimientos obtenidos
 *   post:
 *     tags: [Inventario]
 *     summary: Registrar movimiento manual de inventario
 *     description: Flujo operativo solo para salida manual; entradas suelen originarse en compras realizadas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idInsumo, tipoMovimiento, cantidad, fechaMovimiento]
 *             properties:
 *               idInsumo:
 *                 type: integer
 *               tipoMovimiento:
 *                 type: string
 *                 enum: [ENTRADA, SALIDA]
 *               cantidad:
 *                 type: number
 *               fechaMovimiento:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Movimiento registrado y stock actualizado
 *       400:
 *         description: Error de validacion o stock insuficiente
 */
router.get('/movimientos', requireRole('Administrador', 'Almacén', 'Propietario'), ctrl.getAllMovimientos);
router.post('/movimientos', requireRole('Administrador', 'Almacén'), validate(createMovimientoSchema), ctrl.registrarSalida);

/**
 * @swagger
 * /insumos/movimientos/{id}:
 *   get:
 *     tags: [Inventario]
 *     summary: Obtener movimiento por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimiento obtenido
 *       404:
 *         description: Movimiento no encontrado
 */
router.get('/movimientos/:id', requireRole('Administrador', 'Almacén', 'Propietario'), ctrl.getMovimientoById);

/**
 * @swagger
 * /insumos:
 *   get:
 *     tags: [Inventario]
 *     summary: Listar insumos
 *     parameters:
 *       - in: query
 *         name: idTipoInsumo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumos obtenidos
 *   post:
 *     tags: [Inventario]
 *     summary: Crear insumo
 *     description: Roles permitidos Administrador y Almacen.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombreInsumo, idTipoInsumo, unidadMedida]
 *             properties:
 *               nombreInsumo:
 *                 type: string
 *               idTipoInsumo:
 *                 type: integer
 *               unidadMedida:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               stockActual:
 *                 type: number
 *     responses:
 *       201:
 *         description: Insumo creado
 *       400:
 *         description: Error de validacion
 */
router.get('/', ctrl.getAll);
router.post('/', requireRole('Administrador', 'Almacén'), validate(createInsumoSchema), ctrl.create);

/**
 * @swagger
 * /insumos/{id}:
 *   get:
 *     tags: [Inventario]
 *     summary: Obtener insumo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo obtenido
 *       404:
 *         description: Insumo no encontrado
 *   patch:
 *     tags: [Inventario]
 *     summary: Modificar insumo
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
 *               nombreInsumo:
 *                 type: string
 *               idTipoInsumo:
 *                 type: integer
 *               unidadMedida:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Insumo actualizado
 *       400:
 *         description: Error de validacion
 *       404:
 *         description: Insumo no encontrado
 */
router.get('/:id', ctrl.getById);
router.patch('/:id', requireRole('Administrador', 'Almacén'), validate(updateInsumoSchema), ctrl.update);

module.exports = router;
