const calendarioRepository = require('../repositories/calendario-sanitario.repository');
const prisma = require('../repositories/prisma');
const { registrarAccion } = require('./bitacora.service');

const MIN_ALERT_DAYS = 3;

function buildDefaultAlertDate(fechaProgramada) {
  const alert = new Date(fechaProgramada);
  alert.setDate(alert.getDate() - MIN_ALERT_DAYS);
  return alert;
}

function validateAlertWindow(fechaProgramada, fechaAlerta) {
  const maxAllowed = buildDefaultAlertDate(fechaProgramada);
  if (fechaAlerta > maxAllowed) {
    throw Object.assign(
      new Error('La fecha de alerta debe ser al menos 3 dias antes de la fecha programada'),
      { statusCode: 400 }
    );
  }
}

/**
 * Listar calendario sanitario con filtros.
 */
async function getAll(filters = {}) {
  return calendarioRepository.findAll(filters);
}

/**
 * Obtener un evento del calendario por ID.
 */
async function getById(id) {
  const calendario = await calendarioRepository.findById(id);
  if (!calendario) {
    throw Object.assign(new Error('Evento del calendario no encontrado'), { statusCode: 404 });
  }
  return calendario;
}

/**
 * Obtener alertas de eventos proximos.
 */
async function getAlertas(dias = 3) {
  return calendarioRepository.findProximos(dias);
}

/**
 * Crear un evento en el calendario sanitario.
 */
async function create(data, idUsuario) {
  const animal = await prisma.animal.findUnique({ where: { idAnimal: data.idAnimal } });
  if (!animal) {
    throw Object.assign(new Error('El animal no existe'), { statusCode: 400 });
  }
  if (animal.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('No se pueden programar eventos para un animal dado de baja'), { statusCode: 400 });
  }

  const tipo = await prisma.tipoEventoSanitario.findUnique({
    where: { idTipoEvento: data.idTipoEvento },
  });
  if (!tipo || !tipo.activo) {
    throw Object.assign(new Error('El tipo de evento sanitario no existe o esta inactivo'), { statusCode: 400 });
  }

  const fechaProgramada = new Date(data.fechaProgramada);
  const fechaAlerta = data.fechaAlerta ? new Date(data.fechaAlerta) : buildDefaultAlertDate(fechaProgramada);
  validateAlertWindow(fechaProgramada, fechaAlerta);

  const calendario = await calendarioRepository.create({
    idAnimal: data.idAnimal,
    idTipoEvento: data.idTipoEvento,
    fechaProgramada,
    fechaAlerta,
    programadoPor: idUsuario,
    estado: 'PENDIENTE',
  });

  await registrarAccion({
    idUsuario,
    accion: 'CREAR',
    tablaAfectada: 'calendario_sanitario',
    idRegistro: calendario.idCalendario,
    detalles: { animal: animal.numeroArete, tipo: tipo.nombreTipo, fecha: data.fechaProgramada, fechaAlerta },
  });

  return calendario;
}

/**
 * Actualizar un evento del calendario (solo si esta PENDIENTE).
 */
async function update(id, data, idUsuario) {
  const existente = await calendarioRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Evento del calendario no encontrado'), { statusCode: 404 });
  }

  if (existente.estado !== 'PENDIENTE') {
    throw Object.assign(
      new Error('Solo se pueden modificar eventos en estado PENDIENTE'),
      { statusCode: 400 }
    );
  }

  const updateData = { ...data };
  const fechaProgramada = data.fechaProgramada
    ? new Date(data.fechaProgramada)
    : new Date(existente.fechaProgramada);

  if (data.fechaProgramada) updateData.fechaProgramada = fechaProgramada;

  let fechaAlertaFinal;
  if (Object.prototype.hasOwnProperty.call(data, 'fechaAlerta')) {
    fechaAlertaFinal = data.fechaAlerta
      ? new Date(data.fechaAlerta)
      : buildDefaultAlertDate(fechaProgramada);
  } else if (existente.fechaAlerta) {
    fechaAlertaFinal = new Date(existente.fechaAlerta);
  } else {
    fechaAlertaFinal = buildDefaultAlertDate(fechaProgramada);
  }

  validateAlertWindow(fechaProgramada, fechaAlertaFinal);
  updateData.fechaAlerta = fechaAlertaFinal;

  const calendario = await calendarioRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'calendario_sanitario',
    idRegistro: id,
    detalles: { antes: existente, despues: data },
  });

  return calendario;
}

/**
 * Completar o cancelar un evento del calendario.
 */
async function completar(id, estado, idUsuario) {
  const existente = await calendarioRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Evento del calendario no encontrado'), { statusCode: 404 });
  }

  if (existente.estado !== 'PENDIENTE') {
    throw Object.assign(
      new Error('Solo se pueden completar/cancelar eventos en estado PENDIENTE'),
      { statusCode: 400 }
    );
  }

  const calendario = await calendarioRepository.update(id, { estado });

  await registrarAccion({
    idUsuario,
    accion: estado === 'COMPLETADO' ? 'COMPLETAR' : 'CANCELAR',
    tablaAfectada: 'calendario_sanitario',
    idRegistro: id,
    detalles: { estadoAnterior: 'PENDIENTE', nuevoEstado: estado },
  });

  return calendario;
}

module.exports = { getAll, getById, getAlertas, create, update, completar };
