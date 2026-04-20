const razasRepository = require('../repositories/razas.repository');

async function getAll() {
  return razasRepository.findAll(true);
}

async function create(data, idUsuario) {
  return razasRepository.create({
    nombreRaza: data.nombreRaza,
    activo: true,
  });
}

async function update(id, data, idUsuario) {
  return razasRepository.update(id, data);
}

module.exports = { getAll, create, update };
