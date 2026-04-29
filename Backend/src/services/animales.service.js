const animalesRepository = require('../repositories/animales.repository');
const prisma = require('../repositories/prisma');
const { registrarAccion } = require('./bitacora.service');
const { persistAnimalPhoto, removeManagedAnimalPhoto } = require('./animal-photos.service');

async function validateRaza(idRaza) {
  const raza = await prisma.raza.findUnique({ where: { idRaza } });
  if (!raza || !raza.activo) {
    throw Object.assign(new Error('La raza seleccionada no existe o no está activa.'), { statusCode: 400 });
  }
  return raza;
}

/**
 * Listar todos los animales, con filtros opcionales.
 */
async function getAll(filters = {}) {
  return animalesRepository.findAll(filters);
}

/**
 * Obtener un animal por ID.
 */
async function getById(id) {
  const animal = await animalesRepository.findById(id);
  if (!animal) {
    throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  }
  return animal;
}

/**
 * Buscar un animal por numero de arete.
 */
async function getByArete(numeroArete) {
  const animal = await animalesRepository.findByArete(numeroArete);
  if (!animal) {
    throw Object.assign(new Error('Animal no encontrado con ese numero de arete'), { statusCode: 404 });
  }
  return animal;
}

/**
 * Obtener historial completo por arete para escaneo en campo (RF04).
 */
async function getHistorialByArete(numeroArete) {
  const animal = await animalesRepository.findByArete(numeroArete);
  if (!animal) {
    throw Object.assign(new Error('Animal no encontrado con ese numero de arete'), { statusCode: 404 });
  }

  const [eventosSanitarios, calendarioSanitario, registrosPeso, produccionesLeche, eventosReproductivos] = await Promise.all([
    prisma.eventoSanitario.findMany({
      where: { idAnimal: animal.idAnimal },
      include: {
        tipoEvento: true,
        autorizador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaEvento: 'desc' },
    }),
    prisma.calendarioSanitario.findMany({
      where: { idAnimal: animal.idAnimal },
      include: {
        tipoEvento: true,
        programador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaProgramada: 'desc' },
    }),
    prisma.registroPeso.findMany({
      where: { idAnimal: animal.idAnimal },
      include: {
        registrador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    }),
    prisma.produccionLeche.findMany({
      where: { idAnimal: animal.idAnimal },
      include: {
        registrador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    }),
    prisma.eventoReproductivo.findMany({
      where: { idAnimal: animal.idAnimal },
      include: {
        registrador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaEvento: 'desc' },
    }),
  ]);

  return {
    animal,
    historial: {
      sanitario: {
        eventos: eventosSanitarios,
        calendario: calendarioSanitario,
      },
      productivo: {
        registrosPeso,
        produccionesLeche,
        eventosReproductivos,
      },
      resumen: {
        totalEventosSanitarios: eventosSanitarios.length,
        totalRegistrosPeso: registrosPeso.length,
        totalRegistrosLeche: produccionesLeche.length,
        totalEventosReproductivos: eventosReproductivos.length,
      },
    },
  };
}

/**
 * Crear un nuevo animal.
 */
async function create(data, idUsuario) {
  const raza = await validateRaza(data.idRaza);
  let fotoUrl = null;

  try {
    fotoUrl = await persistAnimalPhoto({
      fotoBase64: data.fotoBase64,
      numeroArete: data.numeroArete,
    });

    const animal = await animalesRepository.create({
      numeroArete: data.numeroArete,
      fechaIngreso: new Date(data.fechaIngreso),
      pesoInicial: data.pesoInicial,
      idRaza: raza.idRaza,
      sexo: data.sexo,
      procedencia: data.procedencia,
      edadEstimada: data.edadEstimada,
      estadoSanitarioInicial: data.estadoSanitarioInicial,
      fotoUrl,
    });

    await registrarAccion({
      idUsuario,
      accion: 'CREAR',
      tablaAfectada: 'animales',
      idRegistro: animal.idAnimal,
      detalles: {
        numeroArete: animal.numeroArete,
        raza: raza.nombreRaza,
        sexo: animal.sexo,
        procedencia: animal.procedencia,
        foto: Boolean(animal.fotoUrl),
      },
    });

    return animal;
  } catch (error) {
    if (fotoUrl) {
      await removeManagedAnimalPhoto(fotoUrl);
    }
    throw error;
  }
}

/**
 * Actualizar datos de un animal (no incluye baja).
 */
async function update(id, data, idUsuario) {
  const existente = await animalesRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  }

  if (existente.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('No se puede modificar un animal dado de baja'), { statusCode: 400 });
  }

  if (data.idRaza !== undefined) {
    await validateRaza(data.idRaza);
  }

  const updateData = { ...data };
  delete updateData.fotoBase64;
  delete updateData.eliminarFoto;

  if (data.fechaIngreso) updateData.fechaIngreso = new Date(data.fechaIngreso);

  if (data.fotoBase64 !== undefined || data.eliminarFoto === true) {
    updateData.fotoUrl = await persistAnimalPhoto({
      fotoBase64: data.fotoBase64,
      numeroArete: existente.numeroArete,
      currentFotoUrl: existente.fotoUrl,
      eliminarFoto: data.eliminarFoto === true,
    });
  }

  const animal = await animalesRepository.update(id, updateData);

  await registrarAccion({
    idUsuario,
    accion: 'MODIFICAR',
    tablaAfectada: 'animales',
    idRegistro: id,
    detalles: { antes: { ...existente, raza: undefined }, despues: data },
  });

  return animal;
}

/**
 * Dar de baja un animal (RN-08: registrar causa y fecha).
 */
async function darDeBaja(id, { estadoActual, motivoBaja, fechaBaja }, idUsuario) {
  const existente = await animalesRepository.findById(id);
  if (!existente) {
    throw Object.assign(new Error('Animal no encontrado'), { statusCode: 404 });
  }

  if (existente.estadoActual !== 'ACTIVO') {
    throw Object.assign(new Error('El animal ya fue dado de baja'), { statusCode: 400 });
  }

  const animal = await animalesRepository.update(id, {
    estadoActual,
    motivoBaja,
    fechaBaja: new Date(fechaBaja),
  });

  await registrarAccion({
    idUsuario,
    accion: 'BAJA',
    tablaAfectada: 'animales',
    idRegistro: id,
    detalles: {
      numeroArete: existente.numeroArete,
      estadoAnterior: existente.estadoActual,
      nuevoEstado: estadoActual,
      motivoBaja,
      fechaBaja,
    },
  });

  return animal;
}

module.exports = { getAll, getById, getByArete, getHistorialByArete, create, update, darDeBaja };
