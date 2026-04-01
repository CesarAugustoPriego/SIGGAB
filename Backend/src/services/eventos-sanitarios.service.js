const eventosSanitariosRepository = require('../repositories/eventos-sanitarios.repository');
const prisma = require('../repositories/prisma');
const { registrarAccion } = require('./bitacora.service');

/**
 * Listar eventos sanitarios con filtros opcionales.
 */
async function getAll(filters = {}) {
  return eventosSanitariosRepository.findAll(filters);
}

/**
 * Obtener un evento sanitario por ID.
 */
async function getById(id) {
  const evento = await eventosSanitariosRepository.findById(id);
  if (!evento) {
    throw Object.assign(new Error('Evento sanitario no encontrado'), { statusCode: 404 });
  }
  return evento;
}

/**
 * Crear un nuevo evento sanitario (RN-05: Registro obligatorio).
 */
async function create(data, idUsuario) {
  // Verificar que el animal exista y esté activo
  const animal = await prisma.animal.findUnique({ where: { idAnimal: data.idAnimal } });
  if (!animal) {
    throw Object.assign(new Error('El animal no existe'), { statusCode: 400 });
  }
  if (animal.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('No se pueden registrar eventos en un animal dado de baja'), { statusCode: 400 });
  }

  // Verificar tipo de evento
  const tipo = await prisma.tipoEventoSanitario.findUnique({
    where: { idTipoEvento: data.idTipoEvento },
  });
  if (!tipo || !tipo.activo) {
    throw Object.assign(new Error('El tipo de evento sanitario no existe o está inactivo'), { statusCode: 400 });
  }

  const evento = await eventosSanitariosRepository.create({
    ...data,
    fechaEvento: new Date(data.fechaEvento),
    estadoAprobacion: 'PENDIENTE',
  });

  await registrarAccion({
    idUsuario,
    accion: 'CREAR',
    tablaAfectada: 'eventos_sanitarios',
    idRegistro: evento.idEvento,
    detalles: { animal: animal.numeroArete, tipo: tipo.nombreTipo },
  });

  return evento;
}

/**
 * Actualizar un evento sanitario (solo si está PENDIENTE).
 */
async function update(id, data, idUsuario) {
  const existente = await eventosSanitariosRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Evento sanitario no encontrado'), { statusCode: 404 });
  }

  if (existente.estadoAprobacion !== 'PENDIENTE') {
    throw Object.assign(
      new Error('Solo se pueden modificar eventos en estado PENDIENTE'),
      { statusCode: 400 }
    );
  }

  const updateData = { ...data };
  if (data.fechaEvento) updateData.fechaEvento = new Date(data.fechaEvento);

  const evento = await eventosSanitariosRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'eventos_sanitarios',
    idRegistro: id,
    detalles: { antes: existente, despues: data },
  });

  return evento;
}

/**
 * Aprobar o rechazar un evento sanitario (RN-04: validación sanitaria obligatoria).
 */
async function aprobar(id, estadoAprobacion, idUsuario) {
  const existente = await eventosSanitariosRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Evento sanitario no encontrado'), { statusCode: 404 });
  }

  if (existente.estadoAprobacion !== 'PENDIENTE') {
    throw Object.assign(
      new Error('Solo se pueden aprobar/rechazar eventos en estado PENDIENTE'),
      { statusCode: 400 }
    );
  }

  const evento = await eventosSanitariosRepository.update(id, {
    estadoAprobacion,
    autorizadoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario,
    accion: estadoAprobacion === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'eventos_sanitarios',
    idRegistro: id,
    detalles: { estadoAnterior: 'PENDIENTE', nuevoEstado: estadoAprobacion },
  });

  return evento;
}

/**
 * Obtener catálogo de tipos de evento sanitario.
 */
async function getTiposEvento() {
  return eventosSanitariosRepository.findTiposEvento(true);
}

module.exports = { getAll, getById, create, update, aprobar, getTiposEvento };
