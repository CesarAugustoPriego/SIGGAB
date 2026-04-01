const produccionLecheRepository = require('../repositories/produccion-leche.repository');
const animalesRepository = require('../repositories/animales.repository');
const lotesRepository = require('../repositories/lotes-productivos.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll(filters = {}) {
  return produccionLecheRepository.findAll(filters);
}

async function getById(id) {
  const registro = await produccionLecheRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de producción no encontrado'), { statusCode: 404 });
  return registro;
}

async function create(data, idUsuario) {
  // RN-01: solo animales activos
  const animal = await animalesRepository.findById(data.idAnimal);
  if (!animal) throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  if (animal.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('Solo se puede registrar producción de animales ACTIVOS'), { statusCode: 400 });
  }

  const lote = await lotesRepository.findById(data.idLote);
  if (!lote) throw Object.assign(new Error('Lote de validación no encontrado'), { statusCode: 400 });

  const registro = await produccionLecheRepository.create({
    idAnimal: data.idAnimal,
    idLote: data.idLote,
    litrosProducidos: data.litrosProducidos,
    fechaRegistro: new Date(data.fechaRegistro),
    registradoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'produccion_leche',
    idRegistro: registro.idProduccion,
    detalles: { arete: animal.numeroArete, litros: data.litrosProducidos, fecha: data.fechaRegistro },
  });

  return registro;
}

/**
 * Modificar registro de producción (RF15), solo en estado PENDIENTE.
 */
async function update(id, data, idUsuario) {
  const registro = await produccionLecheRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de producción no encontrado'), { statusCode: 404 });

  if (registro.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden modificar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updateData = {};
  if (data.litrosProducidos !== undefined) updateData.litrosProducidos = data.litrosProducidos;
  if (data.fechaRegistro) updateData.fechaRegistro = new Date(data.fechaRegistro);

  const updated = await produccionLecheRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'produccion_leche',
    idRegistro: id,
    detalles: { antes: { litrosProducidos: registro.litrosProducidos, fechaRegistro: registro.fechaRegistro }, despues: data },
  });

  return updated;
}

async function validar(id, { estadoValidacion }, idUsuario) {
  const registro = await produccionLecheRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de producción no encontrado'), { statusCode: 404 });

  if (registro.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden validar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updated = await produccionLecheRepository.update(id, { estadoValidacion, validadoPor: idUsuario });

  await registrarAccion({
    idUsuario, accion: estadoValidacion === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'produccion_leche', idRegistro: id, detalles: { nuevoEstado: estadoValidacion },
  });

  return updated;
}

module.exports = { getAll, getById, create, update, validar };
