const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const env = require('../config/env');

/**
 * Genera un Access Token JWT con los datos del usuario.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Genera un Refresh Token JWT con mayor duración.
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    { ...payload, tokenId: randomUUID() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Verifica y decodifica un token JWT.
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token es inválido o expirado
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Calcula la fecha de expiración basada en el string de duración (ej: '7d', '15m').
 */
function getExpirationDate(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Formato de duración inválido: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 's': now.setSeconds(now.getSeconds() + value); break;
    case 'm': now.setMinutes(now.getMinutes() + value); break;
    case 'h': now.setHours(now.getHours() + value); break;
    case 'd': now.setDate(now.getDate() + value); break;
  }

  return now;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getExpirationDate,
};
