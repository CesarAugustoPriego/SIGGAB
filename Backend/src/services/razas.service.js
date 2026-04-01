const razasRepository = require('../repositories/razas.repository');
const { registrarAccion } = require('./bitacora.service');

async function getAll() {
  return razasRepository.findAll(true);
}

async function create(data, idUsuario) {
  const raza = await razasRepository.create(data);

  await registrarAccion({
    idUsuario,
    accion: 'CREAR',
    tablaAfectada: 'razas',
    idRegistro: raza.idRaza,
    detalles: { nombreRaza: raza.nombreRaza },
  });

  return raza;
}

async function update(id, data, idUsuario) {
  const existente = await razasRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Raza no encontrada'), { statusCode: 404 });
  }

  const raza = await razasRepository.update(id, data);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'razas',
    idRegistro: id,
    detalles: { antes: existente, despues: data },
  });

  return raza;
}

module.exports = { getAll, create, update };
