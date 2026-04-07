const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginSchema, refreshTokenSchema } = require('../schemas/auth.schema');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticacion y gestion de sesion
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion
 *     description: Retorna accessToken y refreshToken. Tras 5 intentos fallidos consecutivos, responde 423 por bloqueo temporal.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Error de validacion
 *       401:
 *         description: Credenciales invalidas o cuenta desactivada
 *       423:
 *         description: Cuenta bloqueada temporalmente por seguridad
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token y rotar refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Nuevo accessToken y refreshToken rotado
 *       401:
 *         description: Refresh token revocado o expirado
 *       423:
 *         description: Cuenta bloqueada temporalmente por seguridad
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesion (revoca refreshToken)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Sesion cerrada
 *       401:
 *         description: No autenticado
 */
router.post('/logout', authMiddleware, validate(refreshTokenSchema), authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Perfil del usuario autenticado
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autenticado
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /auth/cambiar-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Cambiar contraseña del usuario autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual, nuevaPassword]
 *             properties:
 *               passwordActual:
 *                 type: string
 *               nuevaPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.patch('/cambiar-password', authMiddleware, authController.cambiarPassword);

module.exports = router;
