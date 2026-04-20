const eventosReproRepository = require('../repositories/eventos-reproductivos.repository');
const animalesRepository = require('../repositories/animales.repository');
const lotesRepository = require('../repositories/lotes-productivos.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll(filters = {}) {
  return eventosReproRepository.findAll(filters);
}

async function getById(id) {
  const evento = await eventosReproRepository.findById(id);
  if (!evento) throw Object.assign(new Error('Evento reproductivo no encontrado'), { statusCode: 404 });
  return evento;
}

async function create(data, idUsuario) {
  // RN-01: solo animales activos
  const animal = await animalesRepository.findById(data.idAnimal);
  if (!animal) throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  if (animal.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('Solo se puede registrar eventos de animales ACTIVOS'), { statusCode: 400 });
  }
  if (animal.sexo === 'MACHO') {
    throw Object.assign(new Error('Solo se pueden registrar eventos reproductivos en hembras.'), { statusCode: 400 });
  }

  const lote = await lotesRepository.findById(data.idLote);
  if (!lote) throw Object.assign(new Error('Lote de validación no encontrado'), { statusCode: 400 });

  const evento = await eventosReproRepository.create({
    idAnimal: data.idAnimal,
    idLote: data.idLote,
    tipoEvento: data.tipoEvento,
    fechaEvento: new Date(data.fechaEvento),
    observaciones: data.observaciones,
    registradoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'eventos_reproductivos',
    idRegistro: evento.idEventoReproductivo,
    detalles: { arete: animal.numeroArete, tipoEvento: data.tipoEvento, fecha: data.fechaEvento },
  });

  return evento;
}

/**
 * Modificar evento reproductivo (RF15), solo en estado PENDIENTE.
 */
async function update(id, data, idUsuario) {
  const evento = await eventosReproRepository.findById(id);
  if (!evento) throw Object.assign(new Error('Evento reproductivo no encontrado'), { statusCode: 404 });

  if (evento.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden modificar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updateData = { ...data };
  if (data.fechaEvento) updateData.fechaEvento = new Date(data.fechaEvento);

  const updated = await eventosReproRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'eventos_reproductivos',
    idRegistro: id,
    detalles: { antes: { tipoEvento: evento.tipoEvento, fechaEvento: evento.fechaEvento }, despues: data },
  });

  return updated;
}

async function validar(id, { estadoValidacion }, idUsuario) {
  const evento = await eventosReproRepository.findById(id);
  if (!evento) throw Object.assign(new Error('Evento reproductivo no encontrado'), { statusCode: 404 });

  if (evento.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden validar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updated = await eventosReproRepository.update(id, { estadoValidacion, validadoPor: idUsuario });

  await registrarAccion({
    idUsuario, accion: estadoValidacion === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'eventos_reproductivos', idRegistro: id, detalles: { nuevoEstado: estadoValidacion },
  });

  return updated;
}

module.exports = { getAll, getById, create, update, validar };
