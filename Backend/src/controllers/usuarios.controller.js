const usuariosService = require('../services/usuarios.service');
const { sendSuccess, sendCreated } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const usuarios = await usuariosService.getAll();
    return sendSuccess(res, usuarios, 'Usuarios obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const usuario = await usuariosService.getById(id);
    return sendSuccess(res, usuario, 'Usuario obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const usuario = await usuariosService.create(req.body, req.user.idUsuario);
    return sendCreated(res, usuario, 'Usuario creado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const usuario = await usuariosService.update(id, req.body, req.user.idUsuario);
    return sendSuccess(res, usuario, 'Usuario actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

async function updateEstado(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { activo } = req.body;
    const usuario = await usuariosService.updateEstado(id, activo, req.user.idUsuario);
    return sendSuccess(res, usuario, `Cuenta ${activo ? 'activada' : 'desactivada'} exitosamente`);
  } catch (error) {
    next(error);
  }
}

async function getRoles(req, res, next) {
  try {
    const roles = await usuariosService.getRoles();
    return sendSuccess(res, roles, 'Roles obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

async function updatePushToken(req, res, next) {
  try {
    const { token } = req.body;
    await usuariosService.updatePushToken(req.user.idUsuario, token);
    return sendSuccess(res, { token }, 'Push token actualizado');
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, updateEstado, getRoles, updatePushToken };
