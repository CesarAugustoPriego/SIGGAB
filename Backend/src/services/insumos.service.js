const insumosRepository = require('../repositories/insumos.repository');
const movimientosRepository = require('../repositories/movimientos-inventario.repository');
const { registrarAccion } = require('./bitacora.service');

// ─── TIPOS DE INSUMO ───

async function getAllTipos() {
  return insumosRepository.findAllTipos();
}

async function createTipo(data, idUsuario) {
  const tipo = await insumosRepository.createTipo(data);
  await registrarAccion({ idUsuario, accion: 'CREAR', tablaAfectada: 'tipos_insumo', idRegistro: tipo.idTipoInsumo, detalles: data });
  return tipo;
}

async function updateTipo(id, data, idUsuario) {
  const existente = await insumosRepository.findTipoById(id);
  if (!existente) throw Object.assign(new Error('Tipo de insumo no encontrado'), { statusCode: 404 });
  const tipo = await insumosRepository.updateTipo(id, data);
  await registrarAccion({ idUsuario, accion: 'MODIFICAR', tablaAfectada: 'tipos_insumo', idRegistro: id, detalles: data });
  return tipo;
}

// ─── INSUMOS ───

async function getAll(filters = {}) {
  // Por defecto solo activos
  if (filters.activo === undefined) filters.activo = true;
  return insumosRepository.findAll(filters);
}

async function getById(id) {
  const insumo = await insumosRepository.findById(id);
  if (!insumo) throw Object.assign(new Error('Insumo no encontrado'), { statusCode: 404 });
  return insumo;
}

async function create(data, idUsuario) {
  const tipo = await insumosRepository.findTipoById(data.idTipoInsumo);
  if (!tipo) throw Object.assign(new Error('Tipo de insumo no existe'), { statusCode: 400 });

  const insumo = await insumosRepository.create(data);
  await registrarAccion({ idUsuario, accion: 'CREAR', tablaAfectada: 'insumos', idRegistro: insumo.idInsumo, detalles: { nombre: insumo.nombreInsumo } });
  return insumo;
}

async function update(id, data, idUsuario) {
  const existente = await insumosRepository.findById(id);
  if (!existente) throw Object.assign(new Error('Insumo no encontrado'), { statusCode: 404 });

  if (data.idTipoInsumo) {
    const tipo = await insumosRepository.findTipoById(data.idTipoInsumo);
    if (!tipo) throw Object.assign(new Error('Tipo de insumo no existe'), { statusCode: 400 });
  }

  const insumo = await insumosRepository.update(id, data);
  await registrarAccion({ idUsuario, accion: 'MODIFICAR', tablaAfectada: 'insumos', idRegistro: id, detalles: data });
  return insumo;
}

// ─── MOVIMIENTOS ───

async function getAllMovimientos(filters = {}) {
  return movimientosRepository.findAll(filters);
}

async function getMovimientoById(id) {
  const mov = await movimientosRepository.findById(id);
  if (!mov) throw Object.assign(new Error('Movimiento no encontrado'), { statusCode: 404 });
  return mov;
}

/**
 * Registrar movimiento manual de inventario (ENTRADA o SALIDA) (RN-09, RN-10).
 */
async function registrarSalida(data, idUsuario) {
  const insumo = await insumosRepository.findById(data.idInsumo);
  if (!insumo) throw Object.assign(new Error('Insumo no encontrado'), { statusCode: 404 });

  // RN-09: la salida no puede superar el stock actual
  if (data.tipoMovimiento === 'SALIDA' && Number(insumo.stockActual) < data.cantidad) {
    throw Object.assign(
      new Error(`Stock insuficiente. Disponible: ${insumo.stockActual} ${insumo.unidadMedida}`),
      { statusCode: 400 }
    );
  }

  // RN-10: actualizar stock atómicamente usando transacción en el repositorio
  const prisma = require('../repositories/prisma');
  const movimiento = await prisma.$transaction(async (tx) => {
    const mov = await tx.movimientoInventario.create({
      data: {
        idInsumo: data.idInsumo,
        tipoMovimiento: data.tipoMovimiento,
        cantidad: data.cantidad,
        fechaMovimiento: new Date(data.fechaMovimiento),
        registradoPor: idUsuario,
      },
      include: { insumo: true },
    });
    
    // Si es entrada se suma, si es salida se resta
    const operation = data.tipoMovimiento === 'ENTRADA' ? { increment: data.cantidad } : { decrement: data.cantidad };
    
    await tx.insumo.update({
      where: { idInsumo: data.idInsumo },
      data: { stockActual: operation },
    });
    return mov;
  });

  await registrarAccion({
    idUsuario, accion: data.tipoMovimiento === 'ENTRADA' ? 'ENTRADA_INVENTARIO' : 'SALIDA_INVENTARIO', tablaAfectada: 'movimientos_inventario',
    idRegistro: movimiento.idMovimiento,
    detalles: { insumo: insumo.nombreInsumo, cantidad: data.cantidad, stockAntes: Number(insumo.stockActual) },
  });

  return movimiento;
}

module.exports = { getAllTipos, createTipo, updateTipo, getAll, getById, create, update, getAllMovimientos, getMovimientoById, registrarSalida };
