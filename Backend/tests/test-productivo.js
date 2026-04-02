/**
 * SIGGAB — Test completo de endpoints de Módulo Productivo
 * Ejecutar: node tests/test-productivo.js
 *
 * Requiere backend corriendo en http://localhost:3000
 * Cubre:
 *   - Lotes de validación (CRUD + validar)
 *   - Registros de peso (CRUD + editar + validar + RN-01/RN-02)
 *   - Producción de leche (CRUD + editar + validar)
 *   - Eventos reproductivos (CRUD + editar + validar + RN-06)
 *   - Permisos por rol (403)
 *   - Flujo PENDIENTE → APROBADO/RECHAZADO
 */

const BASE = 'http://localhost:3000/api';
const RUN_ID = Date.now();
const results = [];
let passed = 0;
let failed = 0;

async function request(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function test(nombre, condicion, detalle = '') {
  if (condicion) {
    passed++;
    results.push(`  ✅ ${nombre}`);
  } else {
    failed++;
    results.push(`  ❌ ${nombre} ${detalle}`);
  }
}

function printSection() {
  console.log(results.join('\n'));
  results.length = 0;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SIGGAB — Test Suite: Módulo Productivo');
  console.log('═══════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════
  // 0. SETUP — Autenticación y datos base
  // ═══════════════════════════════════════════════
  console.log('🔐 SETUP — Autenticación');

  let res = await request('POST', '/auth/login', { username: 'admin', password: 'SiggabAdmin2026!' });
  test('Login como Administrador', res.status === 200 && res.data.success);
  const adminToken = res.data.data?.accessToken;

  // Crear usuario Producción
  const prodUsername = `prod_test_${RUN_ID}`;
  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Operador Producción Test',
    username: prodUsername,
    password: 'TestProd2026!',
    idRol: 4, // Producción
  }, adminToken);
  test('Usuario Producción creado', res.status === 201);

  res = await request('POST', '/auth/login', { username: prodUsername, password: 'TestProd2026!' });
  const prodToken = res.data.data?.accessToken;
  test('Login como Producción', res.status === 200 && !!prodToken);

  // Crear usuario Veterinario
  const vetUsername = `vet_prod_${RUN_ID}`;
  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Dr. Vet Prod Test',
    username: vetUsername,
    password: 'TestVet2026!',
    idRol: 3, // Médico Veterinario
  }, adminToken);
  test('Usuario Veterinario creado', res.status === 201);

  res = await request('POST', '/auth/login', { username: vetUsername, password: 'TestVet2026!' });
  const vetToken = res.data.data?.accessToken;
  test('Login como Veterinario', res.status === 200 && !!vetToken);

  // Crear animal ACTIVO para registros
  const areteActivo = `PROD-ACT-${RUN_ID}`;
  res = await request('POST', '/animales', {
    numeroArete: areteActivo,
    procedencia: 'Rancho Test Productivo',
    edadEstimada: 24,
    estadoSanitarioInicial: 'Sano para producción',
    fechaIngreso: '2024-01-01',
    pesoInicial: 300,
    idRaza: 1,
  }, adminToken);
  test('Animal ACTIVO creado', res.status === 201);
  const animalActivoId = res.data.data?.idAnimal;

  // Crear animal y darlo de baja (para test RN-01)
  const areteBaja = `PROD-BAJA-${RUN_ID}`;
  res = await request('POST', '/animales', {
    numeroArete: areteBaja,
    procedencia: 'Rancho Test Baja',
    edadEstimada: 30,
    estadoSanitarioInicial: 'Sano',
    fechaIngreso: '2024-01-01',
    pesoInicial: 400,
    idRaza: 1,
  }, adminToken);
  const animalBajaId = res.data.data?.idAnimal;
  if (animalBajaId) {
    await request('PATCH', `/animales/${animalBajaId}/baja`, {
      estadoActual: 'VENDIDO',
      motivoBaja: 'Baja para test RN-01',
      fechaBaja: '2024-06-01',
    }, adminToken);
  }
  test('Animal dado de BAJA creado', !!animalBajaId);

  printSection();

  // ═══════════════════════════════════════════════
  // 1. LOTES DE VALIDACIÓN PRODUCTIVA
  // ═══════════════════════════════════════════════
  console.log('\n📋 LOTES DE VALIDACIÓN');

  // 1.1 Crear lote (Admin)
  res = await request('POST', '/lotes-productivos', {
    fechaInicio: '2024-06-01',
    fechaFin: '2024-06-30',
  }, adminToken);
  test('POST /lotes-productivos crea lote (Admin)', res.status === 201 && res.data.data?.estado === 'PENDIENTE');
  const loteId = res.data.data?.idLote;

  // 1.2 Crear lote (Producción)
  res = await request('POST', '/lotes-productivos', {
    fechaInicio: '2024-07-01',
    fechaFin: '2024-07-31',
  }, prodToken);
  test('POST /lotes-productivos crea lote (Producción)', res.status === 201);
  const loteId2 = res.data.data?.idLote;

  // 1.3 Fecha fin antes de inicio → 400 (Zod refine)
  res = await request('POST', '/lotes-productivos', {
    fechaInicio: '2024-12-31',
    fechaFin: '2024-01-01',
  }, adminToken);
  test('Lote con fechas invertidas → 400 (Zod)', res.status === 400);

  // 1.4 Sin fechas → 400
  res = await request('POST', '/lotes-productivos', {}, adminToken);
  test('Lote sin fechas → 400', res.status === 400);

  // 1.5 Listar lotes
  res = await request('GET', '/lotes-productivos', null, adminToken);
  test('GET /lotes-productivos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 1.6 Obtener lote por ID
  if (loteId) {
    res = await request('GET', `/lotes-productivos/${loteId}`, null, adminToken);
    test('GET /lotes-productivos/:id retorna lote', res.status === 200 && res.data.data?.idLote === loteId);
  }

  // 1.7 Lote inexistente → 404
  res = await request('GET', '/lotes-productivos/99999', null, adminToken);
  test('GET lote inexistente → 404', res.status === 404);

  // 1.8 Veterinario NO puede crear lote → 403
  res = await request('POST', '/lotes-productivos', {
    fechaInicio: '2024-08-01',
    fechaFin: '2024-08-31',
  }, vetToken);
  test('Veterinario → POST /lotes-productivos → 403', res.status === 403);

  // 1.9 Validar lote (Admin aprueba)
  if (loteId) {
    res = await request('PATCH', `/lotes-productivos/${loteId}/validar`, { estado: 'APROBADO' }, adminToken);
    test('PATCH /lotes-productivos/:id/validar aprueba (RN-03)', res.status === 200 && res.data.data?.estado === 'APROBADO');
  }

  // 1.10 No se puede validar lote ya aprobado → 400
  if (loteId) {
    res = await request('PATCH', `/lotes-productivos/${loteId}/validar`, { estado: 'RECHAZADO' }, adminToken);
    test('Validar lote ya aprobado → 400', res.status === 400);
  }

  // 1.11 Producción NO puede validar lote → 403
  if (loteId2) {
    res = await request('PATCH', `/lotes-productivos/${loteId2}/validar`, { estado: 'APROBADO' }, prodToken);
    test('Producción → validar lote → 403', res.status === 403);
  }

  // 1.12 Rechazar lote
  if (loteId2) {
    res = await request('PATCH', `/lotes-productivos/${loteId2}/validar`, { estado: 'RECHAZADO' }, adminToken);
    test('PATCH rechazar lote', res.status === 200 && res.data.data?.estado === 'RECHAZADO');
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 2. REGISTROS DE PESO
  // ═══════════════════════════════════════════════
  console.log('\n⚖️  REGISTROS DE PESO');

  let pesoId = null;

  // 2.1 Registrar peso válido (RN-01 animal activo + RN-02 peso ≥ 50% inicial)
  if (loteId && animalActivoId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalActivoId,
      idLote: loteId,
      peso: 320,
      fechaRegistro: '2024-06-10',
    }, adminToken);
    test('POST /registros-peso registra peso válido (RN-01+RN-02)', res.status === 201 && Number(res.data.data?.peso) === 320);
    pesoId = res.data.data?.idRegistroPeso;
  }

  // 2.2 Peso demasiado bajo → 400 (RN-02: < 50% de 300 = 150)
  if (loteId && animalActivoId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalActivoId,
      idLote: loteId,
      peso: 100,
      fechaRegistro: '2024-06-11',
    }, adminToken);
    test('Peso < 50% peso inicial → 400 (RN-02)', res.status === 400);
  }

  // 2.3 Peso en animal dado de baja → 400 (RN-01)
  if (loteId && animalBajaId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalBajaId,
      idLote: loteId,
      peso: 350,
      fechaRegistro: '2024-06-12',
    }, adminToken);
    test('Peso en animal BAJA → 400 (RN-01)', res.status === 400);
  }

  // 2.4 Lote inexistente → 400
  if (animalActivoId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalActivoId,
      idLote: 99999,
      peso: 300,
      fechaRegistro: '2024-06-13',
    }, adminToken);
    test('Peso con lote inexistente → 400', res.status === 400);
  }

  // 2.5 Sin campos requeridos → 400
  res = await request('POST', '/registros-peso', {}, adminToken);
  test('Peso sin campos → 400 (Zod)', res.status === 400);

  // 2.6 Listar registros de peso
  res = await request('GET', '/registros-peso', null, adminToken);
  test('GET /registros-peso retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 2.7 Obtener registro por ID
  if (pesoId) {
    res = await request('GET', `/registros-peso/${pesoId}`, null, adminToken);
    test('GET /registros-peso/:id retorna registro', res.status === 200);
  }

  // 2.8 Editar peso (PENDIENTE) — solo Producción
  let pesoEditableId = null;
  if (loteId && animalActivoId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalActivoId,
      idLote: loteId,
      peso: 310,
      fechaRegistro: '2024-06-14',
    }, prodToken);
    pesoEditableId = res.data.data?.idRegistroPeso;
    test('Producción crea registro de peso', res.status === 201);
  }

  if (pesoEditableId) {
    res = await request('PATCH', `/registros-peso/${pesoEditableId}`, {
      peso: 315,
    }, prodToken);
    test('PATCH /registros-peso/:id edita peso PENDIENTE (RF15)', res.status === 200 && Number(res.data.data?.peso) === 315);
  }

  // 2.9 Validar peso (Admin aprueba)
  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, adminToken);
    test('PATCH /registros-peso/:id/validar aprueba', res.status === 200 && res.data.data?.estadoValidacion === 'APROBADO');
  }

  // 2.10 No se puede validar dos veces
  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}/validar`, {
      estadoValidacion: 'RECHAZADO',
    }, adminToken);
    test('Doble validación peso → 400', res.status === 400);
  }

  // 2.11 No se puede editar registro ya aprobado
  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}`, { peso: 999 }, prodToken);
    test('Editar peso APROBADO → 400', res.status === 400);
  }

  // 2.12 Producción NO puede validar → 403
  if (pesoEditableId) {
    res = await request('PATCH', `/registros-peso/${pesoEditableId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, prodToken);
    test('Producción → validar peso → 403', res.status === 403);
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 3. PRODUCCIÓN DE LECHE
  // ═══════════════════════════════════════════════
  console.log('\n🥛 PRODUCCIÓN DE LECHE');

  let lecheId = null;

  // 3.1 Registrar producción de leche
  if (loteId && animalActivoId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: animalActivoId,
      idLote: loteId,
      litrosProducidos: 22.5,
      fechaRegistro: '2024-06-10',
    }, adminToken);
    test('POST /produccion-leche registra producción', res.status === 201 && Number(res.data.data?.litrosProducidos) === 22.5);
    lecheId = res.data.data?.idProduccion;
  }

  // 3.2 Animal dado de baja → 400 (RN-01)
  if (loteId && animalBajaId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: animalBajaId,
      idLote: loteId,
      litrosProducidos: 10,
      fechaRegistro: '2024-06-12',
    }, adminToken);
    test('Leche en animal BAJA → 400 (RN-01)', res.status === 400);
  }

  // 3.3 Sin campos → 400
  res = await request('POST', '/produccion-leche', {}, adminToken);
  test('Leche sin campos → 400 (Zod)', res.status === 400);

  // 3.4 Listar leche
  res = await request('GET', '/produccion-leche', null, adminToken);
  test('GET /produccion-leche retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 3.5 Editar leche (Producción edita PENDIENTE)
  let lecheEditableId = null;
  if (loteId && animalActivoId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: animalActivoId,
      idLote: loteId,
      litrosProducidos: 18,
      fechaRegistro: '2024-06-14',
    }, prodToken);
    lecheEditableId = res.data.data?.idProduccion;
    test('Producción crea registro de leche', res.status === 201);
  }

  if (lecheEditableId) {
    res = await request('PATCH', `/produccion-leche/${lecheEditableId}`, {
      litrosProducidos: 20,
    }, prodToken);
    test('PATCH /produccion-leche/:id edita PENDIENTE (RF15)', res.status === 200 && Number(res.data.data?.litrosProducidos) === 20);
  }

  // 3.6 Validar leche
  if (lecheId) {
    res = await request('PATCH', `/produccion-leche/${lecheId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, adminToken);
    test('PATCH /produccion-leche/:id/validar aprueba', res.status === 200 && res.data.data?.estadoValidacion === 'APROBADO');
  }

  // 3.7 Doble validación → 400
  if (lecheId) {
    res = await request('PATCH', `/produccion-leche/${lecheId}/validar`, {
      estadoValidacion: 'RECHAZADO',
    }, adminToken);
    test('Doble validación leche → 400', res.status === 400);
  }

  // 3.8 Editar leche aprobada → 400
  if (lecheId) {
    res = await request('PATCH', `/produccion-leche/${lecheId}`, { litrosProducidos: 99 }, prodToken);
    test('Editar leche APROBADA → 400', res.status === 400);
  }

  // 3.9 Rechazar leche
  if (lecheEditableId) {
    res = await request('PATCH', `/produccion-leche/${lecheEditableId}/validar`, {
      estadoValidacion: 'RECHAZADO',
    }, adminToken);
    test('PATCH rechazar producción de leche', res.status === 200 && res.data.data?.estadoValidacion === 'RECHAZADO');
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 4. EVENTOS REPRODUCTIVOS
  // ═══════════════════════════════════════════════
  console.log('\n🐄 EVENTOS REPRODUCTIVOS');

  let eventoId = null;

  // 4.1 Registrar evento PARTO
  if (loteId && animalActivoId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: animalActivoId,
      idLote: loteId,
      tipoEvento: 'PARTO',
      fechaEvento: '2024-06-15',
      observaciones: 'Parto normal sin complicaciones — test',
    }, adminToken);
    test('POST /eventos-reproductivos registra PARTO', res.status === 201 && res.data.data?.tipoEvento === 'PARTO');
    eventoId = res.data.data?.idEventoReproductivo;
  }

  // 4.2 Registrar todos los tipos válidos
  const tiposValidos = ['CELO', 'MONTA', 'PREÑEZ', 'ABORTO'];
  for (const tipo of tiposValidos) {
    if (loteId && animalActivoId) {
      res = await request('POST', '/eventos-reproductivos', {
        idAnimal: animalActivoId,
        idLote: loteId,
        tipoEvento: tipo,
        fechaEvento: '2024-06-16',
      }, adminToken);
      test(`POST evento ${tipo} → 201`, res.status === 201);
    }
  }

  // 4.3 Tipo inválido → 400 (RN-06)
  if (loteId && animalActivoId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: animalActivoId,
      idLote: loteId,
      tipoEvento: 'INVALIDO',
      fechaEvento: '2024-06-17',
    }, adminToken);
    test('Tipo reproductivo inválido → 400 (RN-06)', res.status === 400);
  }

  // 4.4 Animal dado de baja → 400 (RN-01)
  if (loteId && animalBajaId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: animalBajaId,
      idLote: loteId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-18',
    }, adminToken);
    test('Evento en animal BAJA → 400 (RN-01)', res.status === 400);
  }

  // 4.5 Sin campos → 400
  res = await request('POST', '/eventos-reproductivos', {}, adminToken);
  test('Evento sin campos → 400 (Zod)', res.status === 400);

  // 4.6 Listar eventos
  res = await request('GET', '/eventos-reproductivos', null, adminToken);
  test('GET /eventos-reproductivos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 4.7 Editar evento (Producción edita PENDIENTE)
  let eventoEditableId = null;
  if (loteId && animalActivoId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: animalActivoId,
      idLote: loteId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-19',
      observaciones: 'Editable',
    }, prodToken);
    eventoEditableId = res.data.data?.idEventoReproductivo;
    test('Producción crea evento reproductivo', res.status === 201);
  }

  if (eventoEditableId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoEditableId}`, {
      tipoEvento: 'MONTA',
      observaciones: 'Cambiado a MONTA',
    }, prodToken);
    test('PATCH /eventos-reproductivos/:id edita PENDIENTE (RF15)', res.status === 200 && res.data.data?.tipoEvento === 'MONTA');
  }

  // 4.8 Validar evento (Admin aprueba)
  if (eventoId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, adminToken);
    test('PATCH /eventos-reproductivos/:id/validar aprueba', res.status === 200 && res.data.data?.estadoValidacion === 'APROBADO');
  }

  // 4.9 Doble validación → 400
  if (eventoId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoId}/validar`, {
      estadoValidacion: 'RECHAZADO',
    }, adminToken);
    test('Doble validación evento → 400', res.status === 400);
  }

  // 4.10 Editar evento aprobado → 400
  if (eventoId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoId}`, {
      observaciones: 'Hack',
    }, prodToken);
    test('Editar evento APROBADO → 400', res.status === 400);
  }

  // 4.11 Producción NO puede validar → 403
  if (eventoEditableId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoEditableId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, prodToken);
    test('Producción → validar evento → 403', res.status === 403);
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 5. PERMISOS CRUZADOS
  // ═══════════════════════════════════════════════
  console.log('\n🚫 PERMISOS CRUZADOS');

  // 5.1 Veterinario NO puede crear registros de peso
  if (loteId && animalActivoId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: animalActivoId,
      idLote: loteId,
      peso: 280,
      fechaRegistro: '2024-06-20',
    }, vetToken);
    test('Veterinario → POST /registros-peso → 403', res.status === 403);
  }

  // 5.2 Veterinario NO puede crear producción de leche
  if (loteId && animalActivoId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: animalActivoId,
      idLote: loteId,
      litrosProducidos: 15,
      fechaRegistro: '2024-06-20',
    }, vetToken);
    test('Veterinario → POST /produccion-leche → 403', res.status === 403);
  }

  // 5.3 Veterinario NO puede crear eventos reproductivos
  if (loteId && animalActivoId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: animalActivoId,
      idLote: loteId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-20',
    }, vetToken);
    test('Veterinario → POST /eventos-reproductivos → 403', res.status === 403);
  }

  // 5.4 Sin token → 401 en todos los endpoints
  res = await request('GET', '/lotes-productivos');
  test('GET /lotes-productivos sin token → 401', res.status === 401);

  res = await request('GET', '/registros-peso');
  test('GET /registros-peso sin token → 401', res.status === 401);

  res = await request('GET', '/produccion-leche');
  test('GET /produccion-leche sin token → 401', res.status === 401);

  res = await request('GET', '/eventos-reproductivos');
  test('GET /eventos-reproductivos sin token → 401', res.status === 401);

  printSection();

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  RESULTADOS: ${passed} pasaron ✅ | ${failed} fallaron ❌`);
  console.log(`  Total: ${passed + failed} pruebas`);
  console.log('═══════════════════════════════════════════════');

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Error ejecutando tests:', err);
  process.exit(1);
});
