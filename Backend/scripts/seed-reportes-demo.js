const prisma = require('../src/repositories/prisma');

const DEMO_ARETES = [
  'REP-1001',
  'REP-1002',
  'REP-1003',
  'REP-1004',
  'REP-1005',
  'REP-1006',
  'REP-1007',
  'REP-1008',
  'REP-1009',
  'REP-1010',
  'REP-1011',
  'REP-1012',
  'REP-2001',
  'REP-2002',
  'REP-2003',
  'REP-2004',
  'REP-2005',
  'REP-2006',
  'REP-2007',
  'REP-2008',
];

function date(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function getOrCreateUser() {
  const existing = await prisma.usuario.findFirst({
    where: { activo: true },
    orderBy: { idUsuario: 'asc' },
  });

  if (existing) return existing;

  let role = await prisma.rol.findFirst({ where: { nombreRol: 'Administrador' } });
  if (!role) {
    role = await prisma.rol.create({
      data: {
        nombreRol: 'Administrador',
        descripcion: 'Rol creado para sembrar datos demo de reportes.',
      },
    });
  }

  return prisma.usuario.create({
    data: {
      nombreCompleto: 'Usuario Demo Reportes',
      username: 'reportes_demo',
      passwordHash: 'demo-no-login',
      idRol: role.idRol,
      activo: true,
    },
  });
}

async function getOrCreateRaza(nombreRaza) {
  const existing = await prisma.raza.findFirst({ where: { nombreRaza } });
  if (existing) {
    return prisma.raza.update({
      where: { idRaza: existing.idRaza },
      data: { activo: true },
    });
  }

  return prisma.raza.create({ data: { nombreRaza, activo: true } });
}

async function getOrCreateTipoEvento(nombreTipo) {
  const existing = await prisma.tipoEventoSanitario.findFirst({ where: { nombreTipo } });
  if (existing) {
    return prisma.tipoEventoSanitario.update({
      where: { idTipoEvento: existing.idTipoEvento },
      data: { activo: true },
    });
  }

  return prisma.tipoEventoSanitario.create({ data: { nombreTipo, activo: true } });
}

async function getOrCreateTipoInsumo(nombreTipo, descripcion) {
  const existing = await prisma.tipoInsumo.findFirst({ where: { nombreTipo } });
  if (existing) {
    return prisma.tipoInsumo.update({
      where: { idTipoInsumo: existing.idTipoInsumo },
      data: { descripcion, activo: true },
    });
  }

  return prisma.tipoInsumo.create({
    data: { nombreTipo, descripcion, activo: true },
  });
}

async function upsertInsumo(input) {
  const existing = await prisma.insumo.findFirst({ where: { nombreInsumo: input.nombreInsumo } });
  const data = {
    nombreInsumo: input.nombreInsumo,
    idTipoInsumo: input.idTipoInsumo,
    unidadMedida: input.unidadMedida,
    descripcion: input.descripcion,
    stockActual: input.stockActual,
    activo: true,
  };

  if (existing) {
    return prisma.insumo.update({ where: { idInsumo: existing.idInsumo }, data });
  }

  return prisma.insumo.create({ data });
}

async function upsertAnimal(input) {
  return prisma.animal.upsert({
    where: { numeroArete: input.numeroArete },
    update: input,
    create: input,
  });
}

async function seedInventory(user) {
  const tipos = {
    alimentos: await getOrCreateTipoInsumo('Demo Reportes - Alimentos', 'Insumos demo para graficas de reportes.'),
    medicinas: await getOrCreateTipoInsumo('Demo Reportes - Medicinas', 'Insumos demo para graficas de reportes.'),
    sales: await getOrCreateTipoInsumo('Demo Reportes - Sales', 'Insumos demo para graficas de reportes.'),
    suplementos: await getOrCreateTipoInsumo('Demo Reportes - Suplementos', 'Insumos demo para graficas de reportes.'),
  };

  const insumos = [
    {
      nombreInsumo: 'Demo Reportes - Alimento Engorda',
      idTipoInsumo: tipos.alimentos.idTipoInsumo,
      unidadMedida: 'bultos',
      descripcion: 'Inventario demo optimo.',
      stockActual: 160,
    },
    {
      nombreInsumo: 'Demo Reportes - Pastura Premium',
      idTipoInsumo: tipos.alimentos.idTipoInsumo,
      unidadMedida: 'pacas',
      descripcion: 'Inventario demo optimo.',
      stockActual: 82,
    },
    {
      nombreInsumo: 'Demo Reportes - Vacuna Derriengue',
      idTipoInsumo: tipos.medicinas.idTipoInsumo,
      unidadMedida: 'dosis',
      descripcion: 'Inventario demo bajo.',
      stockActual: 8,
    },
    {
      nombreInsumo: 'Demo Reportes - Antibiotico Respiratorio',
      idTipoInsumo: tipos.medicinas.idTipoInsumo,
      unidadMedida: 'frascos',
      descripcion: 'Inventario demo optimo.',
      stockActual: 24,
    },
    {
      nombreInsumo: 'Demo Reportes - Sal Mineral',
      idTipoInsumo: tipos.sales.idTipoInsumo,
      unidadMedida: 'kg',
      descripcion: 'Inventario demo critico.',
      stockActual: 0,
    },
    {
      nombreInsumo: 'Demo Reportes - Suplemento Clima',
      idTipoInsumo: tipos.suplementos.idTipoInsumo,
      unidadMedida: 'kg',
      descripcion: 'Inventario demo bajo.',
      stockActual: 6,
    },
    {
      nombreInsumo: 'Demo Reportes - Electrolitos',
      idTipoInsumo: tipos.suplementos.idTipoInsumo,
      unidadMedida: 'sobres',
      descripcion: 'Inventario demo optimo.',
      stockActual: 35,
    },
  ];

  const created = [];
  for (const insumo of insumos) {
    created.push(await upsertInsumo(insumo));
  }

  await prisma.movimientoInventario.deleteMany({
    where: { idInsumo: { in: created.map((item) => item.idInsumo) } },
  });

  for (const insumo of created) {
    await prisma.movimientoInventario.create({
      data: {
        idInsumo: insumo.idInsumo,
        tipoMovimiento: 'ENTRADA',
        cantidad: Number(insumo.stockActual),
        fechaMovimiento: date('2026-04-01'),
        registradoPor: user.idUsuario,
      },
    });
  }

  return created.length;
}

async function seedAnimals(user) {
  const razas = {
    cebu: await getOrCreateRaza('Demo Reportes - Cebu'),
    brahman: await getOrCreateRaza('Demo Reportes - Brahman'),
    angus: await getOrCreateRaza('Demo Reportes - Angus'),
    suizo: await getOrCreateRaza('Demo Reportes - Suizo Europeo'),
  };

  const eventos = {
    vacuna: await getOrCreateTipoEvento('Demo Reportes - Vacuna preventiva'),
    desparasitacion: await getOrCreateTipoEvento('Demo Reportes - Tratamiento desparasitante'),
    padecimiento: await getOrCreateTipoEvento('Demo Reportes - Padecimiento respiratorio'),
    revision: await getOrCreateTipoEvento('Demo Reportes - Revision general'),
  };

  const activeAnimals = [
    { numeroArete: 'REP-1001', raza: razas.cebu, sexo: 'MACHO', edadEstimada: 28, pesoInicial: 360, estadoSanitarioInicial: 'Sano', weights: [410, 426, 448], p1: 'sano', p2: 'sano' },
    { numeroArete: 'REP-1002', raza: razas.brahman, sexo: 'HEMBRA', edadEstimada: 34, pesoInicial: 340, estadoSanitarioInicial: 'Sano', weights: [390, 407, 431], p1: 'tratamiento', p2: 'sano' },
    { numeroArete: 'REP-1003', raza: razas.angus, sexo: 'MACHO', edadEstimada: 22, pesoInicial: 300, estadoSanitarioInicial: 'En tratamiento', weights: [346, 360, 376], p1: 'tratamiento', p2: 'tratamiento' },
    { numeroArete: 'REP-1004', raza: razas.suizo, sexo: 'HEMBRA', edadEstimada: 42, pesoInicial: 420, estadoSanitarioInicial: 'Sano', weights: [462, 479, 498], p1: 'enfermo', p2: 'tratamiento' },
    { numeroArete: 'REP-1005', raza: razas.cebu, sexo: 'MACHO', edadEstimada: 18, pesoInicial: 250, estadoSanitarioInicial: 'Sano', weights: [292, 307, 324], p1: 'sano', p2: 'sano' },
    { numeroArete: 'REP-1006', raza: razas.brahman, sexo: 'HEMBRA', edadEstimada: 30, pesoInicial: 315, estadoSanitarioInicial: 'Sano', weights: [366, 379, 392], p1: 'sano', p2: 'enfermo' },
    { numeroArete: 'REP-1007', raza: razas.angus, sexo: 'MACHO', edadEstimada: 15, pesoInicial: 210, estadoSanitarioInicial: 'Sano', weights: [246, 259, 274], p1: 'tratamiento', p2: 'sano' },
    { numeroArete: 'REP-1008', raza: razas.suizo, sexo: 'HEMBRA', edadEstimada: 26, pesoInicial: 330, estadoSanitarioInicial: 'Sano', weights: [377, 390, 409], p1: 'sano', p2: 'sano' },
    { numeroArete: 'REP-1009', raza: razas.cebu, sexo: 'MACHO', edadEstimada: 38, pesoInicial: 390, estadoSanitarioInicial: 'Cojera leve', weights: [431, 437, 450], p1: 'enfermo', p2: 'sano' },
    { numeroArete: 'REP-1010', raza: razas.brahman, sexo: 'HEMBRA', edadEstimada: 20, pesoInicial: 285, estadoSanitarioInicial: 'Sano', weights: [318, 333, 349], p1: 'sano', p2: 'tratamiento' },
    { numeroArete: 'REP-1011', raza: razas.angus, sexo: 'MACHO', edadEstimada: 48, pesoInicial: 460, estadoSanitarioInicial: 'Sano', weights: [506, 522, 540], p1: 'sano', p2: 'sano' },
    { numeroArete: 'REP-1012', raza: razas.suizo, sexo: 'HEMBRA', edadEstimada: 12, pesoInicial: 190, estadoSanitarioInicial: 'Sano', weights: [225, 237, 252], p1: 'tratamiento', p2: 'sano' },
  ];

  const bajas = [
    { numeroArete: 'REP-2001', raza: razas.cebu, sexo: 'MACHO', edadEstimada: 40, pesoInicial: 390, estadoActual: 'MUERTO', fechaBaja: '2026-03-08', motivoBaja: 'Enfermedad respiratoria severa', weights: [425, 438] },
    { numeroArete: 'REP-2002', raza: razas.brahman, sexo: 'HEMBRA', edadEstimada: 31, pesoInicial: 335, estadoActual: 'VENDIDO', fechaBaja: '2026-03-14', motivoBaja: 'Venta por bajo rendimiento', weights: [360, 372] },
    { numeroArete: 'REP-2003', raza: razas.angus, sexo: 'MACHO', edadEstimada: 18, pesoInicial: 260, estadoActual: 'MUERTO', fechaBaja: '2026-03-22', motivoBaja: 'Accidente en corral', weights: [288, 294] },
    { numeroArete: 'REP-2004', raza: razas.suizo, sexo: 'HEMBRA', edadEstimada: 52, pesoInicial: 445, estadoActual: 'TRANSFERIDO', fechaBaja: '2026-03-29', motivoBaja: 'Transferencia administrativa', weights: [480, 492] },
    { numeroArete: 'REP-2005', raza: razas.cebu, sexo: 'MACHO', edadEstimada: 36, pesoInicial: 375, estadoActual: 'MUERTO', fechaBaja: '2026-04-05', motivoBaja: 'Muerte por infeccion avanzada', weights: [405, 418] },
    { numeroArete: 'REP-2006', raza: razas.brahman, sexo: 'HEMBRA', edadEstimada: 24, pesoInicial: 300, estadoActual: 'VENDIDO', fechaBaja: '2026-04-12', motivoBaja: 'Venta forzada por baja ganancia', weights: [332, 344] },
    { numeroArete: 'REP-2007', raza: razas.angus, sexo: 'MACHO', edadEstimada: 29, pesoInicial: 320, estadoActual: 'MUERTO', fechaBaja: '2026-04-20', motivoBaja: 'Accidente por resbalon en corral', weights: [351, 358] },
    { numeroArete: 'REP-2008', raza: razas.suizo, sexo: 'HEMBRA', edadEstimada: 45, pesoInicial: 410, estadoActual: 'MUERTO', fechaBaja: '2026-04-27', motivoBaja: 'Enfermedad digestiva critica', weights: [449, 463] },
  ];

  const animals = [];

  for (const animal of activeAnimals) {
    animals.push(await upsertAnimal({
      numeroArete: animal.numeroArete,
      fechaIngreso: date('2025-10-15'),
      pesoInicial: animal.pesoInicial,
      idRaza: animal.raza.idRaza,
      sexo: animal.sexo,
      procedencia: 'ADQUIRIDA',
      edadEstimada: animal.edadEstimada,
      estadoSanitarioInicial: animal.estadoSanitarioInicial,
      fotoUrl: null,
      estadoActual: 'ACTIVO',
      motivoBaja: null,
      fechaBaja: null,
    }));
  }

  for (const animal of bajas) {
    animals.push(await upsertAnimal({
      numeroArete: animal.numeroArete,
      fechaIngreso: date('2025-08-15'),
      pesoInicial: animal.pesoInicial,
      idRaza: animal.raza.idRaza,
      sexo: animal.sexo,
      procedencia: 'ADQUIRIDA',
      edadEstimada: animal.edadEstimada,
      estadoSanitarioInicial: 'Sano',
      fotoUrl: null,
      estadoActual: animal.estadoActual,
      motivoBaja: animal.motivoBaja,
      fechaBaja: date(animal.fechaBaja),
    }));
  }

  const animalIds = animals.map((animal) => animal.idAnimal);
  await prisma.eventoSanitario.deleteMany({ where: { idAnimal: { in: animalIds } } });
  await prisma.registroPeso.deleteMany({ where: { idAnimal: { in: animalIds } } });
  await prisma.produccionLeche.deleteMany({ where: { idAnimal: { in: animalIds } } });
  await prisma.eventoReproductivo.deleteMany({ where: { idAnimal: { in: animalIds } } });

  const animalByArete = new Map(animals.map((animal) => [animal.numeroArete, animal]));

  function eventPayload(idAnimal, status, fechaEvento) {
    if (status === 'enfermo') {
      return {
        idAnimal,
        idTipoEvento: eventos.padecimiento.idTipoEvento,
        fechaEvento: date(fechaEvento),
        diagnostico: 'Enfermedad respiratoria con seguimiento veterinario',
        medicamento: 'Antibiotico respiratorio',
        dosis: '2 aplicaciones',
        estadoAprobacion: 'APROBADO',
        autorizadoPor: user.idUsuario,
      };
    }

    if (status === 'tratamiento') {
      return {
        idAnimal,
        idTipoEvento: eventos.desparasitacion.idTipoEvento,
        fechaEvento: date(fechaEvento),
        diagnostico: 'Tratamiento preventivo',
        medicamento: 'Desparasitante',
        dosis: '1 dosis',
        estadoAprobacion: 'APROBADO',
        autorizadoPor: user.idUsuario,
      };
    }

    return {
      idAnimal,
      idTipoEvento: eventos.vacuna.idTipoEvento,
      fechaEvento: date(fechaEvento),
      diagnostico: 'Revision sin hallazgos',
      medicamento: null,
      dosis: null,
      estadoAprobacion: 'APROBADO',
      autorizadoPor: user.idUsuario,
    };
  }

  for (const animal of activeAnimals) {
    const saved = animalByArete.get(animal.numeroArete);
    await prisma.registroPeso.createMany({
      data: [
        {
          idAnimal: saved.idAnimal,
          peso: animal.weights[0],
          fechaRegistro: date('2026-03-01'),
          registradoPor: user.idUsuario,
          estadoValidacion: 'APROBADO',
          validadoPor: user.idUsuario,
        },
        {
          idAnimal: saved.idAnimal,
          peso: animal.weights[1],
          fechaRegistro: date('2026-03-24'),
          registradoPor: user.idUsuario,
          estadoValidacion: 'APROBADO',
          validadoPor: user.idUsuario,
        },
        {
          idAnimal: saved.idAnimal,
          peso: animal.weights[2],
          fechaRegistro: date('2026-04-25'),
          registradoPor: user.idUsuario,
          estadoValidacion: 'APROBADO',
          validadoPor: user.idUsuario,
        },
      ],
    });

    await prisma.eventoSanitario.createMany({
      data: [
        eventPayload(saved.idAnimal, animal.p1, '2026-03-18'),
        eventPayload(saved.idAnimal, animal.p2, '2026-04-18'),
      ],
    });
  }

  for (const animal of bajas) {
    const saved = animalByArete.get(animal.numeroArete);
    await prisma.registroPeso.createMany({
      data: [
        {
          idAnimal: saved.idAnimal,
          peso: animal.weights[0],
          fechaRegistro: date('2026-02-25'),
          registradoPor: user.idUsuario,
          estadoValidacion: 'APROBADO',
          validadoPor: user.idUsuario,
        },
        {
          idAnimal: saved.idAnimal,
          peso: animal.weights[1],
          fechaRegistro: date(animal.fechaBaja),
          registradoPor: user.idUsuario,
          estadoValidacion: 'APROBADO',
          validadoPor: user.idUsuario,
        },
      ],
    });
  }

  return animals.length;
}

async function main() {
  const user = await getOrCreateUser();
  const inventoryCount = await seedInventory(user);
  const animalCount = await seedAnimals(user);

  console.log('Datos demo de reportes actualizados.');
  console.log(`Usuario de referencia: ${user.username}`);
  console.log(`Insumos demo: ${inventoryCount}`);
  console.log(`Animales demo: ${animalCount}`);
  console.log(`Aretes demo: ${DEMO_ARETES.join(', ')}`);
}

main()
  .catch((error) => {
    console.error('No se pudieron sembrar los datos demo de reportes.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
