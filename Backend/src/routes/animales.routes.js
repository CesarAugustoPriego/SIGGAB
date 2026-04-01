const { Router } = require('express');
const animalesController = require('../controllers/animales.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createAnimalSchema, updateAnimalSchema, bajaAnimalSchema } = require('../schemas/animales.schema');

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Animales
 *   description: Gestión del hato ganadero
 */

/**
 * @swagger
 * /animales:
 *   get:
 *     tags: [Animales]
 *     summary: Listar animales
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ACTIVO, VENDIDO, MUERTO, TRANSFERIDO]
 *         description: Filtrar por estado actual
 *       - in: query
 *         name: raza
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de raza
 *     responses:
 *       200:
 *         description: Lista de animales
 */
router.get('/', animalesController.getAll);

/**
 * @swagger
 * /animales/arete/{numero}/historial:
 *   get:
 *     tags: [Animales]
 *     summary: Historial completo por arete (RF04)
 *     description: Endpoint orientado a escaneo de arete en app movil.
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Animal y su historial sanitario/productivo
 *       404:
 *         description: Animal no encontrado
 */
router.get('/arete/:numero/historial', animalesController.getHistorialByArete);

/**
 * @swagger
 * /animales/arete/{numero}:
 *   get:
 *     tags: [Animales]
 *     summary: Buscar animal por número de arete
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: MX-001-2024
 *     responses:
 *       200:
 *         description: Animal encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Animal'
 *       404:
 *         description: Animal no encontrado
 */
router.get('/arete/:numero', animalesController.getByArete);

/**
 * @swagger
 * /animales/{id}:
 *   get:
 *     tags: [Animales]
 *     summary: Obtener animal por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Animal encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id', animalesController.getById);

/**
 * @swagger
 * /animales:
 *   post:
 *     tags: [Animales]
 *     summary: Registrar nuevo animal
 *     description: Roles permitidos → Administrador, Médico Veterinario, Producción, Campo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnimalRequest'
 *     responses:
 *       201:
 *         description: Animal registrado exitosamente
 *       400:
 *         description: Error de validación o raza inexistente
 *       403:
 *         description: Sin permisos
 */
router.post(
  '/',
  requireRole('Administrador', 'Médico Veterinario', 'Producción', 'Campo'),
  validate(createAnimalSchema),
  animalesController.create
);

/**
 * @swagger
 * /animales/{id}:
 *   patch:
 *     tags: [Animales]
 *     summary: Actualizar datos del animal
 *     description: Solo Administrador. No aplica para baja (usar /baja).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               procedencia:
 *                 type: string
 *               edadEstimada:
 *                 type: integer
 *               idRaza:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Animal actualizado
 *       400:
 *         description: Animal dado de baja o raza inexistente
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: No encontrado
 */
router.patch(
  '/:id',
  requireRole('Administrador'),
  validate(updateAnimalSchema),
  animalesController.update
);

/**
 * @swagger
 * /animales/{id}/baja:
 *   patch:
 *     tags: [Animales]
 *     summary: Dar de baja un animal (RN-08)
 *     description: |
 *       **RN-08:** Registra obligatoriamente el motivo y fecha de baja.
 *       Una vez dado de baja, el animal no puede modificarse ni recibir registros productivos.
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
 *             $ref: '#/components/schemas/BajaAnimalRequest'
 *     responses:
 *       200:
 *         description: Animal dado de baja
 *       400:
 *         description: El animal ya fue dado de baja anteriormente
 *       403:
 *         description: Sin permisos (solo Administrador)
 */
router.patch(
  '/:id/baja',
  requireRole('Administrador'),
  validate(bajaAnimalSchema),
  animalesController.darDeBaja
);

module.exports = router;
