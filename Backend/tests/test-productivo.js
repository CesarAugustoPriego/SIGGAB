/**
 * SIGGAB - Test de endpoints de Modulo Productivo
 * Ejecutar: node tests/test-productivo.js
 *
 * Requiere backend corriendo en http://localhost:3000
 * Cubre el flujo vigente sin lotes de validacion:
 *   - Registros de peso, produccion de leche y eventos reproductivos
 *   - Creacion directa en estado PENDIENTE
 *   - Edicion solo por Produccion mientras sigue PENDIENTE
 *   - Validacion individual solo por Administrador
 *   - Permisos por rol
 */

const BASE = 'http://localhost:3000/api';
const RUN_ID = Date.now();
const results = [];
let passed = 0;
let failed = 0;

async function request(method, path, body = null, token = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function test(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push(`  OK ${name}`);
  } else {
    failed++;
    results.push(`  FAIL ${name} ${detail}`);
  }
}

function printSection() {
  console.log(results.join('\n'));
  results.length = 0;
}

function uniqueArete(offset) {
  const base = String((RUN_ID + offset) % 100000000).padStart(8, '0');
  return `27${base}`;
}

async function createUser(adminToken, idRol, usernamePrefix, nombreCompleto) {
  const username = `${usernamePrefix}_${RUN_ID}`;
  let res = await request('POST', '/usuarios', {
    nombreCompleto,
    username,
    password: 'TestProd2026!',
    idRol,
  }, adminToken);
  test(`Usuario ${nombreCompleto} creado`, res.status === 201, `status=${res.status}`);

  res = await request('POST', '/auth/login', { username, password: 'TestProd2026!' });
  test(`Login ${nombreCompleto}`, res.status === 200 && !!res.data?.data?.accessToken, `status=${res.status}`);
  return res.data?.data?.accessToken;
}

async function createAnimal(adminToken, { offset, sexo = 'HEMBRA', baja = false }) {
  const numeroArete = uniqueArete(offset);
  let res = await request('POST', '/animales', {
    numeroArete,
    fechaIngreso: '2024-01-01',
    pesoInicial: 300,
    idRaza: 1,
    sexo,
    procedencia: 'NACIDA',
    edadEstimada: 24,
    estadoSanitarioInicial: 'Sano',
  }, adminToken);
  test(`Animal ${numeroArete} creado`, res.status === 201, `status=${res.status}`);
  const idAnimal = res.data?.data?.idAnimal;

  if (baja && idAnimal) {
    res = await request('PATCH', `/animales/${idAnimal}/baja`, {
      estadoActual: 'VENDIDO',
      motivoBaja: 'Baja para pruebas productivas',
      fechaBaja: '2024-06-01',
    }, adminToken);
    test(`Animal ${numeroArete} dado de baja`, res.status === 200, `status=${res.status}`);
  }

  return idAnimal;
}

async function main() {
  console.log('\nSIGGAB - Test Suite: Modulo Productivo sin lotes\n');

  let res = await request('POST', '/auth/login', { username: 'admin', password: 'SiggabAdmin2026!' });
  test('Login como Administrador', res.status === 200 && !!res.data?.data?.accessToken, `status=${res.status}`);
  const adminToken = res.data?.data?.accessToken;

  const prodToken = await createUser(adminToken, 4, 'prod_test', 'Operador Produccion Test');
  const vetToken = await createUser(adminToken, 3, 'vet_prod', 'Veterinario Productivo Test');

  const hembraId = await createAnimal(adminToken, { offset: 11, sexo: 'HEMBRA' });
  const machoId = await createAnimal(adminToken, { offset: 12, sexo: 'MACHO' });
  const bajaId = await createAnimal(adminToken, { offset: 13, sexo: 'HEMBRA', baja: true });
  printSection();

  console.log('\nREGISTROS DE PESO');
  let pesoId = null;
  if (hembraId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: hembraId,
      peso: 320,
      fechaRegistro: '2024-06-10',
    }, adminToken);
    test('POST /registros-peso crea registro directo PENDIENTE', res.status === 201 && res.data?.data?.estadoValidacion === 'PENDIENTE', `status=${res.status}`);
    pesoId = res.data?.data?.idRegistroPeso;
  }

  if (hembraId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: hembraId,
      peso: 100,
      fechaRegistro: '2024-06-11',
    }, adminToken);
    test('Peso menor al 50% del peso inicial -> 400', res.status === 400, `status=${res.status}`);
  }

  if (bajaId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: bajaId,
      peso: 310,
      fechaRegistro: '2024-06-12',
    }, adminToken);
    test('Peso en animal de baja -> 400', res.status === 400, `status=${res.status}`);
  }

  let pesoEditableId = null;
  if (hembraId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: hembraId,
      peso: 315,
      fechaRegistro: '2024-06-13',
    }, prodToken);
    test('Produccion crea registro de peso', res.status === 201, `status=${res.status}`);
    pesoEditableId = res.data?.data?.idRegistroPeso;
  }

  if (pesoEditableId) {
    res = await request('PATCH', `/registros-peso/${pesoEditableId}`, { peso: 318 }, prodToken);
    test('Produccion edita peso PENDIENTE', res.status === 200 && Number(res.data?.data?.peso) === 318, `status=${res.status}`);

    res = await request('PATCH', `/registros-peso/${pesoEditableId}/validar`, { estadoValidacion: 'APROBADO' }, prodToken);
    test('Produccion no valida peso', res.status === 403, `status=${res.status}`);
  }

  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}/validar`, { estadoValidacion: 'APROBADO' }, adminToken);
    test('Administrador valida peso', res.status === 200 && res.data?.data?.estadoValidacion === 'APROBADO', `status=${res.status}`);

    res = await request('PATCH', `/registros-peso/${pesoId}`, { peso: 999 }, prodToken);
    test('No se edita peso ya aprobado', res.status === 400, `status=${res.status}`);
  }

  res = await request('GET', '/registros-peso?estado=PENDIENTE', null, adminToken);
  test('GET /registros-peso?estado=PENDIENTE responde lista', res.status === 200 && Array.isArray(res.data?.data), `status=${res.status}`);
  printSection();

  console.log('\nPRODUCCION DE LECHE');
  let lecheId = null;
  if (hembraId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: hembraId,
      litrosProducidos: 22.5,
      fechaRegistro: '2024-06-10',
    }, adminToken);
    test('POST /produccion-leche crea registro directo PENDIENTE', res.status === 201 && res.data?.data?.estadoValidacion === 'PENDIENTE', `status=${res.status}`);
    lecheId = res.data?.data?.idProduccion;
  }

  if (machoId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: machoId,
      litrosProducidos: 15,
      fechaRegistro: '2024-06-11',
    }, adminToken);
    test('Leche en macho -> 400', res.status === 400, `status=${res.status}`);
  }

  let lecheEditableId = null;
  if (hembraId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: hembraId,
      litrosProducidos: 18,
      fechaRegistro: '2024-06-12',
    }, prodToken);
    test('Produccion crea registro de leche', res.status === 201, `status=${res.status}`);
    lecheEditableId = res.data?.data?.idProduccion;
  }

  if (lecheEditableId) {
    res = await request('PATCH', `/produccion-leche/${lecheEditableId}`, { litrosProducidos: 20 }, prodToken);
    test('Produccion edita leche PENDIENTE', res.status === 200 && Number(res.data?.data?.litrosProducidos) === 20, `status=${res.status}`);
  }

  if (lecheId) {
    res = await request('PATCH', `/produccion-leche/${lecheId}/validar`, { estadoValidacion: 'APROBADO' }, adminToken);
    test('Administrador valida leche', res.status === 200 && res.data?.data?.estadoValidacion === 'APROBADO', `status=${res.status}`);
  }
  printSection();

  console.log('\nEVENTOS REPRODUCTIVOS');
  let eventoId = null;
  if (hembraId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: hembraId,
      tipoEvento: 'PARTO',
      fechaEvento: '2024-06-15',
      observaciones: 'Parto normal de prueba',
    }, adminToken);
    test('POST /eventos-reproductivos crea evento directo PENDIENTE', res.status === 201 && res.data?.data?.estadoValidacion === 'PENDIENTE', `status=${res.status}`);
    eventoId = res.data?.data?.idEventoReproductivo;
  }

  const tiposValidos = ['CELO', 'MONTA', 'PREÑEZ', 'ABORTO'];
  for (const tipoEvento of tiposValidos) {
    if (!hembraId) continue;
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: hembraId,
      tipoEvento,
      fechaEvento: '2024-06-16',
    }, adminToken);
    test(`POST evento ${tipoEvento}`, res.status === 201, `status=${res.status}`);
  }

  if (machoId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: machoId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-17',
    }, adminToken);
    test('Evento reproductivo en macho -> 400', res.status === 400, `status=${res.status}`);
  }

  let eventoEditableId = null;
  if (hembraId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: hembraId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-18',
      observaciones: 'Editable',
    }, prodToken);
    test('Produccion crea evento reproductivo', res.status === 201, `status=${res.status}`);
    eventoEditableId = res.data?.data?.idEventoReproductivo;
  }

  if (eventoEditableId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoEditableId}`, {
      tipoEvento: 'MONTA',
      observaciones: 'Actualizado por produccion',
    }, prodToken);
    test('Produccion edita evento PENDIENTE', res.status === 200 && res.data?.data?.tipoEvento === 'MONTA', `status=${res.status}`);
  }

  if (eventoId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoId}/validar`, { estadoValidacion: 'APROBADO' }, adminToken);
    test('Administrador valida evento reproductivo', res.status === 200 && res.data?.data?.estadoValidacion === 'APROBADO', `status=${res.status}`);
  }
  printSection();

  console.log('\nPERMISOS Y AUTENTICACION');
  if (hembraId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: hembraId,
      peso: 280,
      fechaRegistro: '2024-06-20',
    }, vetToken);
    test('Veterinario no crea peso', res.status === 403, `status=${res.status}`);

    res = await request('POST', '/produccion-leche', {
      idAnimal: hembraId,
      litrosProducidos: 16,
      fechaRegistro: '2024-06-20',
    }, vetToken);
    test('Veterinario no crea leche', res.status === 403, `status=${res.status}`);
  }

  res = await request('GET', '/registros-peso');
  test('GET /registros-peso sin token -> 401', res.status === 401, `status=${res.status}`);
  res = await request('GET', '/produccion-leche');
  test('GET /produccion-leche sin token -> 401', res.status === 401, `status=${res.status}`);
  res = await request('GET', '/eventos-reproductivos');
  test('GET /eventos-reproductivos sin token -> 401', res.status === 401, `status=${res.status}`);
  printSection();

  console.log(`\nRESULTADOS: ${passed} pasaron | ${failed} fallaron | Total: ${passed + failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Error ejecutando tests:', err);
  process.exit(1);
});
