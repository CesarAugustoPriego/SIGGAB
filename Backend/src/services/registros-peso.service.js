const registrosPesoRepository = require('../repositories/registros-peso.repository');
const animalesRepository = require('../repositories/animales.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll(filters = {}) {
  return registrosPesoRepository.findAll(filters);
}

async function getById(id) {
  const registro = await registrosPesoRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de peso no encontrado'), { statusCode: 404 });
  return registro;
}

/**
 * Registrar peso (RN-01: animal ACTIVO, RN-02: peso razonable).
 */
async function create(data, idUsuario) {
  // RN-01: solo animales activos
  const animal = await animalesRepository.findById(data.idAnimal);
  if (!animal) throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  if (animal.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('Solo se puede registrar peso de animales ACTIVOS'), { statusCode: 400 });
  }

  // RN-02: peso razonable (mayor a 50% del peso inicial)
  const pesoMinimo = Number(animal.pesoInicial) * 0.5;
  if (data.peso < pesoMinimo) {
    throw Object.assign(
      new Error(`Peso inválido. El valor mínimo esperado es ${pesoMinimo} kg (50% del peso inicial: ${animal.pesoInicial} kg)`),
      { statusCode: 400 }
    );
  }

  const registro = await registrosPesoRepository.create({
    idAnimal: data.idAnimal,
    peso: data.peso,
    fechaRegistro: new Date(data.fechaRegistro),
    registradoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario, accion: 'CREAR', tablaAfectada: 'registro_peso',
    idRegistro: registro.idRegistroPeso,
    detalles: { arete: animal.numeroArete, peso: data.peso, fecha: data.fechaRegistro },
  });

  return registro;
}

/**
 * Modificar registro de peso (RF15), solo en estado PENDIENTE.
 */
async function update(id, data, idUsuario) {
  const registro = await registrosPesoRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de peso no encontrado'), { statusCode: 404 });

  if (registro.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden modificar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updateData = {};

  if (data.peso !== undefined) {
    const pesoMinimo = Number(registro.animal.pesoInicial) * 0.5;
    if (data.peso < pesoMinimo) {
      throw Object.assign(
        new Error(`Peso inválido. El valor mínimo esperado es ${pesoMinimo} kg (50% del peso inicial: ${registro.animal.pesoInicial} kg)`),
        { statusCode: 400 }
      );
    }
    updateData.peso = data.peso;
  }

  if (data.fechaRegistro) {
    updateData.fechaRegistro = new Date(data.fechaRegistro);
  }

  const updated = await registrosPesoRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'registro_peso',
    idRegistro: id,
    detalles: { antes: { peso: registro.peso, fechaRegistro: registro.fechaRegistro }, despues: data },
  });

  return updated;
}

/**
 * Validar registro de peso (RN-07).
 */
async function validar(id, { estadoValidacion }, idUsuario) {
  const registro = await registrosPesoRepository.findById(id);
  if (!registro) throw Object.assign(new Error('Registro de peso no encontrado'), { statusCode: 404 });

  if (registro.estadoValidacion !== 'PENDIENTE') {
    throw Object.assign(new Error('Solo se pueden validar registros en estado PENDIENTE'), { statusCode: 400 });
  }

  const updated = await registrosPesoRepository.update(id, {
    estadoValidacion,
    validadoPor: idUsuario,
  });

  await registrarAccion({
    idUsuario, accion: estadoValidacion === 'APROBADO' ? 'APROBAR' : 'RECHAZAR',
    tablaAfectada: 'registro_peso', idRegistro: id,
    detalles: { nuevoEstado: estadoValidacion },
  });

  return updated;
}

module.exports = { getAll, getById, create, update, validar };
