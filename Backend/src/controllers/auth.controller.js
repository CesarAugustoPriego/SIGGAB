const authService = require('../services/auth.service');
const bcrypt = require('bcrypt');
const prisma = require('../repositories/prisma');
const { sendSuccess } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return sendSuccess(res, result, 'Inicio de sesión exitoso');
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return sendSuccess(res, result, 'Token renovado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken, req.user.idUsuario, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return sendSuccess(res, null, 'Sesión cerrada exitosamente');
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const perfil = await authService.getProfile(req.user.idUsuario);
    return sendSuccess(res, perfil, 'Perfil obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function cambiarPassword(req, res, next) {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    const idUsuario = req.user.idUsuario;

    const usuario = await prisma.usuario.findUnique({ where: { idUsuario } });
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!coincide) return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });

    const nuevaHash = await bcrypt.hash(nuevaPassword, 12);
    await prisma.usuario.update({ where: { idUsuario }, data: { passwordHash: nuevaHash } });

    return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, refresh, logout, me, cambiarPassword };
