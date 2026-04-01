const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');
const { generateAccessToken, generateRefreshToken, verifyToken, getExpirationDate } = require('../utils/jwt');
const { registrarAccion } = require('./bitacora.service');
const env = require('../config/env');

function isUserLocked(usuario) {
  return Boolean(usuario?.bloqueadoHasta && usuario.bloqueadoHasta > new Date());
}

/**
 * Autenticar usuario: verifica credenciales, aplica lockout y genera tokens.
 */
async function login(username, password, { ip, userAgent }) {
  const usuario = await usuariosRepository.findByUsername(username);

  if (!usuario) {
    throw Object.assign(new Error('Credenciales invalidas'), { statusCode: 401 });
  }

  if (!usuario.activo) {
    throw Object.assign(new Error('Cuenta desactivada. Contacte al administrador.'), { statusCode: 401 });
  }

  if (isUserLocked(usuario)) {
    throw Object.assign(
      new Error('Cuenta temporalmente bloqueada por seguridad tras intentos fallidos'),
      { statusCode: 423 }
    );
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValido) {
    const updated = await usuariosRepository.registerFailedLogin(usuario.idUsuario, {
      maxAttempts: env.AUTH_MAX_FAILED_ATTEMPTS,
      lockMinutes: env.AUTH_LOCK_MINUTES,
    });

    await registrarAccion({
      idUsuario: usuario.idUsuario,
      accion: 'LOGIN_FALLIDO',
      tablaAfectada: 'usuarios',
      idRegistro: usuario.idUsuario,
      detalles: {
        username,
        bloqueado: Boolean(updated?.bloqueadoHasta && updated.bloqueadoHasta > new Date()),
      },
    });

    if (updated && isUserLocked(updated)) {
      await registrarAccion({
        idUsuario: usuario.idUsuario,
        accion: 'BLOQUEO_AUTOMATICO',
        tablaAfectada: 'usuarios',
        idRegistro: usuario.idUsuario,
        detalles: { motivo: 'Intentos fallidos consecutivos de autenticacion' },
      });

      throw Object.assign(
        new Error('Cuenta temporalmente bloqueada por seguridad tras intentos fallidos'),
        { statusCode: 423 }
      );
    }

    throw Object.assign(new Error('Credenciales invalidas'), { statusCode: 401 });
  }

  if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
    await usuariosRepository.clearFailedLoginState(usuario.idUsuario);
  }

  const payload = {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    nombreRol: usuario.rol.nombreRol,
    username: usuario.username,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ idUsuario: usuario.idUsuario });

  // Guardar refresh token en BD
  await usuariosRepository.createRefreshToken({
    idUsuario: usuario.idUsuario,
    token: refreshToken,
    fechaExpiracion: getExpirationDate(env.JWT_REFRESH_EXPIRES_IN),
    ipOrigen: ip || null,
    userAgent: userAgent || null,
  });

  await registrarAccion({
    idUsuario: usuario.idUsuario,
    accion: 'LOGIN',
    tablaAfectada: 'usuarios',
    idRegistro: usuario.idUsuario,
  });

  return {
    accessToken,
    refreshToken,
    usuario: {
      idUsuario: usuario.idUsuario,
      nombreCompleto: usuario.nombreCompleto,
      username: usuario.username,
      rol: usuario.rol.nombreRol,
    },
  };
}

/**
 * Refrescar access token usando un refresh token valido.
 */
async function refresh(refreshTokenStr) {
  let decoded;
  try {
    decoded = verifyToken(refreshTokenStr);
  } catch {
    throw Object.assign(new Error('Refresh token invalido o expirado'), { statusCode: 401 });
  }

  const tokenRecord = await usuariosRepository.findRefreshToken(refreshTokenStr);

  if (!tokenRecord || tokenRecord.revocado) {
    throw Object.assign(new Error('Refresh token revocado o inexistente'), { statusCode: 401 });
  }

  if (new Date() > tokenRecord.fechaExpiracion) {
    await usuariosRepository.revokeRefreshToken(refreshTokenStr);
    throw Object.assign(new Error('Refresh token expirado'), { statusCode: 401 });
  }

  const usuario = tokenRecord.usuario;
  if (!usuario.activo) {
    throw Object.assign(new Error('Cuenta desactivada'), { statusCode: 401 });
  }

  if (isUserLocked(usuario)) {
    throw Object.assign(
      new Error('Cuenta temporalmente bloqueada por seguridad tras intentos fallidos'),
      { statusCode: 423 }
    );
  }

  const payload = {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    nombreRol: usuario.rol.nombreRol,
    username: usuario.username,
  };

  const newAccessToken = generateAccessToken(payload);

  await registrarAccion({
    idUsuario: usuario.idUsuario,
    accion: 'REFRESH_TOKEN',
    tablaAfectada: 'refresh_tokens',
    idRegistro: tokenRecord.idRefreshToken,
  });

  return { accessToken: newAccessToken };
}

/**
 * Cerrar sesion: revocar el refresh token.
 */
async function logout(refreshTokenStr, idUsuario) {
  await usuariosRepository.revokeRefreshToken(refreshTokenStr);

  await registrarAccion({
    idUsuario,
    accion: 'LOGOUT',
    tablaAfectada: 'usuarios',
    idRegistro: idUsuario,
  });
}

/**
 * Obtener perfil del usuario autenticado.
 */
async function getProfile(idUsuario) {
  const usuario = await usuariosRepository.findById(idUsuario);
  if (!usuario) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  const { passwordHash, ...perfil } = usuario;
  return perfil;
}

module.exports = { login, refresh, logout, getProfile };
