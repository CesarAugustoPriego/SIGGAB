const insumosService = require('../services/insumos.service');
const { sendSuccess, sendCreated } = require('../utils/response');

// ─── TIPOS DE INSUMO ───
async function getAllTipos(req, res, next) {
  try {
    return sendSuccess(res, await insumosService.getAllTipos(), 'Tipos de insumo obtenidos');
  } catch (e) { next(e); }
}

async function createTipo(req, res, next) {
  try {
    return sendCreated(res, await insumosService.createTipo(req.body, req.user.idUsuario), 'Tipo de insumo creado');
  } catch (e) { next(e); }
}

async function updateTipo(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    return sendSuccess(res, await insumosService.updateTipo(id, req.body, req.user.idUsuario), 'Tipo de insumo actualizado');
  } catch (e) { next(e); }
}

// ─── INSUMOS ───
async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.idTipoInsumo) filters.idTipoInsumo = parseInt(req.query.idTipoInsumo, 10);
    return sendSuccess(res, await insumosService.getAll(filters), 'Insumos obtenidos');
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    return sendSuccess(res, await insumosService.getById(parseInt(req.params.id, 10)), 'Insumo obtenido');
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    return sendCreated(res, await insumosService.create(req.body, req.user.idUsuario), 'Insumo creado');
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    return sendSuccess(res, await insumosService.update(parseInt(req.params.id, 10), req.body, req.user.idUsuario), 'Insumo actualizado');
  } catch (e) { next(e); }
}

// ─── MOVIMIENTOS ───
async function getAllMovimientos(req, res, next) {
  try {
    const filters = {};
    if (req.query.idInsumo) filters.idInsumo = parseInt(req.query.idInsumo, 10);
    if (req.query.tipo) filters.tipoMovimiento = req.query.tipo;
    return sendSuccess(res, await insumosService.getAllMovimientos(filters), 'Movimientos obtenidos');
  } catch (e) { next(e); }
}

async function getMovimientoById(req, res, next) {
  try {
    return sendSuccess(res, await insumosService.getMovimientoById(parseInt(req.params.id, 10)), 'Movimiento obtenido');
  } catch (e) { next(e); }
}

async function registrarSalida(req, res, next) {
  try {
    return sendCreated(res, await insumosService.registrarSalida(req.body, req.user.idUsuario), 'Salida de inventario registrada');
  } catch (e) { next(e); }
}

module.exports = { getAllTipos, createTipo, updateTipo, getAll, getById, create, update, getAllMovimientos, getMovimientoById, registrarSalida };
