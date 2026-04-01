const bcrypt = require('bcrypt');
const prisma = require('../repositories/prisma');
const usuariosRepository = require('../repositories/usuarios.repository');
const { registrarAccion } = require('./bitacora.service');

const BCRYPT_ROUNDS = 12;

/**
 * Listar todos los usuarios (sin passwordHash).
 */
async function getAll() {
  const usuarios = await usuariosRepository.findAll();
  return usuarios.map(({ passwordHash, ...u }) => u);
}

/**
 * Obtener un usuario por ID (sin passwordHash).
 */
async function getById(id) {
  const usuario = await usuariosRepository.findById(id);
  if (!usuario) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }
  const { passwordHash, ...data } = usuario;
  return data;
}

/**
 * Crear un nuevo usuario.
 */
async function create(data, idUsuarioCreador) {
  // Verificar que el rol existe
  const rol = await prisma.rol.findUnique({ where: { idRol: data.idRol } });
  if (!rol) {
    throw Object.assign(new Error('El rol especificado no existe'), { statusCode: 400 });
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const usuario = await usuariosRepository.create({
    nombreCompleto: data.nombreCompleto,
    username: data.username,
    passwordHash,
    idRol: data.idRol,
  });

  await registrarAccion({
    idUsuario: idUsuarioCreador,
    accion: 'CREAR',
    tablaAfectada: 'usuarios',
    idRegistro: usuario.idUsuario,
    detalles: { nombreCompleto: data.nombreCompleto, username: data.username, rol: rol.nombreRol },
  });

  const { passwordHash: _, ...result } = usuario;
  return result;
}

/**
 * Actualizar un usuario existente.
 */
async function update(id, data, idUsuarioModificador) {
  // Verificar que el usuario existe
  const existente = await usuariosRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  const updateData = { ...data };

  // Si se cambia el rol, verificar que exista
  if (data.idRol) {
    const rol = await prisma.rol.findUnique({ where: { idRol: data.idRol } });
    if (!rol) {
      throw Object.assign(new Error('El rol especificado no existe'), { statusCode: 400 });
    }
  }

  // Si se cambia la contraseña, hashear
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    delete updateData.password;
  }

  const usuario = await usuariosRepository.update(id, updateData);

  await registrarAccion({
    idUsuario: idUsuarioModificador,
    accion: 'MODIFICAR',
    tablaAfectada: 'usuarios',
    idRegistro: id,
    detalles: {
      antes: { nombreCompleto: existente.nombreCompleto, username: existente.username, idRol: existente.idRol },
      despues: { ...data, password: data.password ? '********' : undefined },
    },
  });

  const { passwordHash, ...result } = usuario;
  return result;
}

/**
 * Activar o desactivar una cuenta de usuario.
 */
async function updateEstado(id, activo, idUsuarioModificador) {
  const existente = await usuariosRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  // No permitir desactivarse a sí mismo
  if (id === idUsuarioModificador && !activo) {
    throw Object.assign(new Error('No puedes desactivar tu propia cuenta'), { statusCode: 400 });
  }

  const usuario = await usuariosRepository.update(id, {
    activo,
    ...(activo ? { intentosFallidos: 0, bloqueadoHasta: null } : {}),
  });

  await registrarAccion({
    idUsuario: idUsuarioModificador,
    accion: activo ? 'ACTIVAR' : 'DESACTIVAR',
    tablaAfectada: 'usuarios',
    idRegistro: id,
    detalles: {
      antes: {
        activo: existente.activo,
        intentosFallidos: existente.intentosFallidos,
        bloqueadoHasta: existente.bloqueadoHasta,
      },
      despues: {
        activo,
        intentosFallidos: activo ? 0 : existente.intentosFallidos,
        bloqueadoHasta: activo ? null : existente.bloqueadoHasta,
      },
    },
  });

  const { passwordHash, ...result } = usuario;
  return result;
}

/**
 * Obtener todos los roles del sistema.
 */
async function getRoles() {
  return prisma.rol.findMany({ orderBy: { idRol: 'asc' } });
}

module.exports = { getAll, getById, create, update, updateEstado, getRoles };
