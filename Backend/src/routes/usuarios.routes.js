const { Router } = require('express');
const usuariosController = require('../controllers/usuarios.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createUsuarioSchema,
  updateUsuarioSchema,
  updateEstadoSchema,
} = require('../schemas/usuarios.schema');

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios y roles del sistema
 */

/**
 * @swagger
 * /usuarios/roles:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar todos los roles disponibles
 *     responses:
 *       200:
 *         description: Lista de 6 roles del sistema
 */
router.get('/roles', requireRole('Administrador'), usuariosController.getRoles);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios (solo Admin)
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Sin permisos
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear usuario (solo Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUsuarioRequest'
 *     responses:
 *       201:
 *         description: Usuario creado
 *       409:
 *         description: Username ya en uso
 */
router.get('/', requireRole('Administrador'), usuariosController.getAll);
router.post('/', requireRole('Administrador'), validate(createUsuarioSchema), usuariosController.create);

/**
 * @swagger
 * /usuarios/me/push-token:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualizar el Push Token del dispositivo vinculado al usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Push token actualizado
 */
router.patch('/me/push-token', usuariosController.updatePushToken);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: No encontrado
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualizar datos del usuario
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
 *               nombreCompleto:
 *                 type: string
 *               idRol:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.get('/:id', requireRole('Administrador'), usuariosController.getById);
router.patch('/:id', requireRole('Administrador'), validate(updateUsuarioSchema), usuariosController.update);

/**
 * @swagger
 * /usuarios/{id}/estado:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Activar o desactivar usuario
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
 *             required: [activo]
 *             properties:
 *               activo:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', requireRole('Administrador'), validate(updateEstadoSchema), usuariosController.updateEstado);

module.exports = router;
