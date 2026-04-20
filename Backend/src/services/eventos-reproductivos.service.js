const eventosReproRepository = require('../repositories/eventos-reproductivos.repository');
const animalesRepository = require('../repositories/animales.repository');
const lotesRepository = require('../repositories/lotes-productivos.repository');
const { registrarAccion } = require('./bitacora.service');

function isNullConstraintError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();
  return code === 'P2011' || message.includes('null constraint violation');
}

async function resolveFallbackLoteId(idUsuario, fechaEvento) {
  const lotesPendientes = await lotesRepository.findAll({ estado: 'PENDIENTE' });
  if (lotesPendientes.length > 0) return lotesPendientes[0].idLote;

  const fechaBase = new Date(fechaEvento);
  const loteCreado = await lotesRepository.create({
    fechaInicio: fechaBase,
    fechaFin: fechaBase,
    creadoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario,
    accion: 'CREAR',
    tablaAfectada: 'lote_validacion_productiva',
    idRegistro: loteCreado.idLote,
    detalles: {
      fechaInicio: fechaEvento,
      fechaFin: fechaEvento,
      origen: 'fallback_evento_reproductivo',
    },
  });

  return loteCreado.idLote;
}

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
  if (animal.sexo !== 'HEMBRA') {
    throw Object.assign(new Error('Solo se pueden registrar eventos reproductivos en hembras.'), { statusCode: 400 });
  }

  if (data.idLote !== undefined && data.idLote !== null) {
    const lote = await lotesRepository.findById(data.idLote);
    if (!lote) throw Object.assign(new Error('Lote de validacion no encontrado'), { statusCode: 400 });
  }

  const createPayload = {
    idAnimal: data.idAnimal,
    idLote: data.idLote ?? null,
    tipoEvento: data.tipoEvento,
    fechaEvento: new Date(data.fechaEvento),
    observaciones: data.observaciones,
    registradoPor: idUsuario,
  };

  let evento;
  try {
    evento = await eventosReproRepository.create(createPayload);
  } catch (error) {
    if ((data.idLote === undefined || data.idLote === null) && isNullConstraintError(error)) {
      const fallbackLoteId = await resolveFallbackLoteId(idUsuario, data.fechaEvento);
      evento = await eventosReproRepository.create({ ...createPayload, idLote: fallbackLoteId });
    } else {
      throw error;
    }
  }

  await registrarAccion({
    idUsuario,
    accion: 'CREAR',
    tablaAfectada: 'eventos_reproductivos',
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
    idUsuario,
    accion: estadoValidacion === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'eventos_reproductivos',
    idRegistro: id,
    detalles: { nuevoEstado: estadoValidacion },
  });

  return updated;
}

module.exports = { getAll, getById, create, update, validar };
