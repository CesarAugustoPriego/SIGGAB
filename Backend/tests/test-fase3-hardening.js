/**
 * SIGGAB - Suite de cierre backend (Fase 3 + hardening).
 * Ejecutar con la API ya corriendo:
 *   node tests/test-fase3-hardening.js
 */

const fs = require('fs/promises');
const path = require('path');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const RUN_ID = Date.now();

let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  [OK] ${name}`);
  } else {
    failed += 1;
    console.log(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

function printSection(title) {
  console.log(`\n==== ${title} ====`);
}

async function request(method, route, { body, token, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && body !== null) finalHeaders['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function login(username, password, extraHeaders = {}) {
  return request('POST', '/auth/login', {
    body: { username, password },
    headers: extraHeaders,
  });
}

async function createUser(adminToken, { nombreCompleto, username, password, idRol }) {
  const res = await request('POST', '/usuarios', {
    token: adminToken,
    body: { nombreCompleto, username, password, idRol },
  });

  if (res.status !== 201) {
    throw new Error(`No se pudo crear usuario ${username}. status=${res.status}`);
  }

  return res.data.data;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testDashboardSse(adminToken) {
  const sseResponse = await fetch(`${BASE}/dashboard/stream`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  test(
    'GET /dashboard/stream (admin) abre SSE',
    sseResponse.status === 200 && (sseResponse.headers.get('content-type') || '').includes('text/event-stream'),
    `status=${sseResponse.status}`
  );

  if (sseResponse.status !== 200 || !sseResponse.body) return;

  const reader = sseResponse.body.getReader();
  const decoder = new TextDecoder();

  try {
    const chunkResult = await Promise.race([
      reader.read(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout leyendo SSE')), 6000)),
    ]);

    const chunk = decoder.decode(chunkResult.value || new Uint8Array());
    test(
      'SSE envia evento inicial dashboard-resumen',
      chunk.includes('event: dashboard-resumen') && chunk.includes('data:'),
      chunk.slice(0, 180)
    );
  } catch (error) {
    test('SSE envia evento inicial dashboard-resumen', false, error.message);
  } finally {
    await reader.cancel().catch(() => {});
  }
}

async function main() {
  console.log('==============================================');
  console.log(' SIGGAB - Test Suite Cierre Backend');
  console.log(' Fase 3 + Hardening + Permisos RF');
  console.log('==============================================');

  let adminToken;
  let produccionToken;
  let veterinarioToken;
  let almacenToken;

  printSection('1) Auth base para suite');
  let res = await login('admin', 'SiggabAdmin2026!');
  test('Login admin', res.status === 200 && res.data?.data?.accessToken, `status=${res.status}`);
  adminToken = res.data?.data?.accessToken;

  if (!adminToken) {
    throw new Error('No se obtuvo token de admin; no se puede continuar la suite');
  }

  printSection('2) Usuarios para pruebas de permisos');
  const prodUsername = `prod_f3_${RUN_ID}`;
  const vetUsername = `vet_f3_${RUN_ID}`;
  const almUsername = `alm_f3_${RUN_ID}`;
  const testPassword = 'TestPassword123!';

  await createUser(adminToken, {
    nombreCompleto: 'Produccion Fase 3',
    username: prodUsername,
    password: testPassword,
    idRol: 4,
  });
  await createUser(adminToken, {
    nombreCompleto: 'Veterinario Fase 3',
    username: vetUsername,
    password: testPassword,
    idRol: 3,
  });
  await createUser(adminToken, {
    nombreCompleto: 'Almacen Fase 3',
    username: almUsername,
    password: testPassword,
    idRol: 6,
  });
  test('Usuarios de prueba creados (Produccion, Veterinario, Almacen)', true);

  res = await login(prodUsername, testPassword);
  test('Login Produccion', res.status === 200, `status=${res.status}`);
  produccionToken = res.data?.data?.accessToken;

  res = await login(vetUsername, testPassword);
  test('Login Veterinario', res.status === 200, `status=${res.status}`);
  veterinarioToken = res.data?.data?.accessToken;

  res = await login(almUsername, testPassword);
  test('Login Almacen', res.status === 200, `status=${res.status}`);
  almacenToken = res.data?.data?.accessToken;

  printSection('2.1) RF01 lockout por intentos fallidos');
  const lockUsername = `lock_f3_${RUN_ID}`;
  const lockUser = await createUser(adminToken, {
    nombreCompleto: 'Usuario Lockout RF01',
    username: lockUsername,
    password: testPassword,
    idRol: 4,
  });

  for (let i = 1; i <= 4; i += 1) {
    const failedAttempt = await login(lockUsername, 'PasswordIncorrecto123');
    test(`Intento fallido ${i} retorna 401`, failedAttempt.status === 401, `status=${failedAttempt.status}`);
  }

  res = await login(lockUsername, 'PasswordIncorrecto123');
  test('Intento fallido 5 bloquea cuenta (423)', res.status === 423, `status=${res.status}`);

  res = await login(lockUsername, testPassword);
  test('Cuenta bloqueada rechaza credenciales correctas', res.status === 423, `status=${res.status}`);

  res = await request('PATCH', `/usuarios/${lockUser.idUsuario}/estado`, {
    token: adminToken,
    body: { activo: true },
  });
  test('Admin puede desbloquear cuenta reactivando estado', res.status === 200, `status=${res.status}`);

  res = await login(lockUsername, testPassword);
  test('Usuario desbloqueado vuelve a iniciar sesion', res.status === 200, `status=${res.status}`);

  printSection('3) Permisos de modificacion y validacion productiva');
  res = await request('POST', '/animales', {
    token: adminToken,
    body: {
      numeroArete: `F3-PROD-${RUN_ID}`,
      fechaIngreso: '2024-01-01',
      pesoInicial: 320,
      idRaza: 1,
      procedencia: 'Rancho Test Fase 3',
      edadEstimada: 22,
      estadoSanitarioInicial: 'Apto para manejo',
    },
  });
  test('Crear animal para pruebas productivas', res.status === 201, `status=${res.status}`);
  const animalId = res.data?.data?.idAnimal;

  res = await request('POST', '/eventos-sanitarios', {
    token: veterinarioToken,
    body: {
      idAnimal: animalId,
      idTipoEvento: 1,
      fechaEvento: '2024-06-09',
      diagnostico: 'Vacunacion preventiva',
    },
  });
  test('Veterinario crea evento sanitario', res.status === 201, `status=${res.status}`);
  const eventoSanitarioId = res.data?.data?.idEvento;

  res = await request('PATCH', `/eventos-sanitarios/${eventoSanitarioId}/aprobar`, {
    token: adminToken,
    body: { estadoAprobacion: 'APROBADO' },
  });
  test('Admin NO puede autorizar evento sanitario (RF05/RF11)', res.status === 403, `status=${res.status}`);

  res = await request('PATCH', `/eventos-sanitarios/${eventoSanitarioId}/aprobar`, {
    token: veterinarioToken,
    body: { estadoAprobacion: 'APROBADO' },
  });
  test('Veterinario autoriza evento sanitario (RF05/RF11)', res.status === 200, `status=${res.status}`);

  res = await request('POST', '/lotes-productivos', {
    token: adminToken,
    body: { fechaInicio: '2024-06-01', fechaFin: '2024-06-30' },
  });
  test('Crear lote productivo para pruebas', res.status === 201, `status=${res.status}`);
  const loteId = res.data?.data?.idLote;

  // Registro de peso
  res = await request('POST', '/registros-peso', {
    token: produccionToken,
    body: { idAnimal: animalId, idLote: loteId, peso: 355, fechaRegistro: '2024-06-10' },
  });
  test('Produccion crea registro de peso', res.status === 201, `status=${res.status}`);
  const registroPesoId = res.data?.data?.idRegistroPeso;

  res = await request('PATCH', `/registros-peso/${registroPesoId}`, {
    token: produccionToken,
    body: { peso: 360 },
  });
  test('Produccion puede modificar registro de peso (RF15)', res.status === 200, `status=${res.status}`);

  res = await request('PATCH', `/registros-peso/${registroPesoId}`, {
    token: adminToken,
    body: { peso: 362 },
  });
  test('Admin NO puede modificar registro de peso (RF15)', res.status === 403, `status=${res.status}`);

  res = await request('PATCH', `/registros-peso/${registroPesoId}/validar`, {
    token: produccionToken,
    body: { estadoValidacion: 'APROBADO' },
  });
  test('Produccion NO puede validar registro de peso (RF12)', res.status === 403, `status=${res.status}`);

  res = await request('PATCH', `/registros-peso/${registroPesoId}/validar`, {
    token: adminToken,
    body: { estadoValidacion: 'APROBADO' },
  });
  test('Admin puede validar registro de peso (RF12)', res.status === 200, `status=${res.status}`);

  // Produccion leche
  res = await request('POST', '/produccion-leche', {
    token: produccionToken,
    body: { idAnimal: animalId, idLote: loteId, litrosProducidos: 19.2, fechaRegistro: '2024-06-11' },
  });
  test('Produccion crea registro de leche', res.status === 201, `status=${res.status}`);
  const produccionId = res.data?.data?.idProduccion;

  res = await request('PATCH', `/produccion-leche/${produccionId}`, {
    token: produccionToken,
    body: { litrosProducidos: 20.1 },
  });
  test('Produccion puede modificar registro de leche (RF15)', res.status === 200, `status=${res.status}`);

  res = await request('PATCH', `/produccion-leche/${produccionId}`, {
    token: adminToken,
    body: { litrosProducidos: 20.3 },
  });
  test('Admin NO puede modificar registro de leche (RF15)', res.status === 403, `status=${res.status}`);

  res = await request('PATCH', `/produccion-leche/${produccionId}/validar`, {
    token: adminToken,
    body: { estadoValidacion: 'APROBADO' },
  });
  test('Admin puede validar registro de leche (RF12)', res.status === 200, `status=${res.status}`);

  // Eventos reproductivos
  res = await request('POST', '/eventos-reproductivos', {
    token: produccionToken,
    body: {
      idAnimal: animalId,
      idLote: loteId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-12',
      observaciones: 'Evento inicial',
    },
  });
  test('Produccion crea evento reproductivo', res.status === 201, `status=${res.status}`);
  const eventoReproId = res.data?.data?.idEventoReproductivo;

  res = await request('PATCH', `/eventos-reproductivos/${eventoReproId}`, {
    token: produccionToken,
    body: { observaciones: 'Observacion actualizada por produccion' },
  });
  test('Produccion puede modificar evento reproductivo (RF15)', res.status === 200, `status=${res.status}`);

  res = await request('PATCH', `/eventos-reproductivos/${eventoReproId}`, {
    token: adminToken,
    body: { observaciones: 'Intento de admin' },
  });
  test('Admin NO puede modificar evento reproductivo (RF15)', res.status === 403, `status=${res.status}`);

  res = await request('PATCH', `/eventos-reproductivos/${eventoReproId}/validar`, {
    token: adminToken,
    body: { estadoValidacion: 'APROBADO' },
  });
  test('Admin puede validar evento reproductivo (RF12)', res.status === 200, `status=${res.status}`);

  res = await request('GET', `/animales/arete/F3-PROD-${RUN_ID}/historial`, {
    token: produccionToken,
  });
  test(
    'Historial por arete retorna trazabilidad sanitaria/productiva (RF04)',
    res.status === 200
      && res.data?.data?.animal?.idAnimal === animalId
      && Array.isArray(res.data?.data?.historial?.productivo?.registrosPeso),
    `status=${res.status}`
  );

  printSection('4) Reportes configurables');
  res = await request('GET', '/reportes/productivo?fechaInicio=2024-01-01&fechaFin=2030-01-01&formato=json', {
    token: produccionToken,
  });
  test('Produccion puede consultar reporte productivo', res.status === 200 && res.data?.data?.tipo === 'productivo', `status=${res.status}`);

  res = await request('GET', '/reportes/sanitario?fechaInicio=2024-01-01&fechaFin=2030-01-01&formato=json', {
    token: produccionToken,
  });
  test('Produccion NO puede consultar reporte sanitario', res.status === 403, `status=${res.status}`);

  res = await request('GET', '/reportes/sanitario?fechaInicio=2024-01-01&fechaFin=2030-01-01&formato=csv', {
    token: adminToken,
  });
  const sanitarioCsvType = (res.headers.get('content-type') || '').includes('text/csv');
  test('Admin descarga reporte sanitario CSV', res.status === 200 && sanitarioCsvType, `status=${res.status}`);

  res = await request('GET', '/reportes/productivo?fechaInicio=2024-01-01&fechaFin=2030-01-01&formato=pdf', {
    token: adminToken,
  });
  const productivoPdfType = (res.headers.get('content-type') || '').includes('application/pdf');
  test('Admin descarga reporte productivo PDF', res.status === 200 && productivoPdfType, `status=${res.status}`);

  res = await request('GET', '/reportes/administrativo?fechaInicio=2024-01-01&fechaFin=2030-01-01&formato=json', {
    token: almacenToken,
  });
  test('Almacen puede consultar reporte administrativo', res.status === 200 && res.data?.data?.tipo === 'administrativo', `status=${res.status}`);

  res = await request('GET', '/reportes/comparativo?modulo=productivo&periodoAInicio=2024-01-01&periodoAFin=2024-06-15&periodoBInicio=2024-06-16&periodoBFin=2030-01-01&formato=json', {
    token: adminToken,
  });
  test(
    'Comparativo historico productivo disponible (RF13)',
    res.status === 200 && res.data?.data?.tipo === 'comparativo' && res.data?.data?.variacion,
    `status=${res.status}`
  );

  printSection('5) Respaldos y bitacora de acciones');
  res = await request('GET', '/respaldos', { token: adminToken });
  test('Admin puede listar respaldos', res.status === 200 && Array.isArray(res.data?.data), `status=${res.status}`);

  res = await request('GET', '/respaldos', { token: produccionToken });
  test('Produccion NO puede listar respaldos', res.status === 403, `status=${res.status}`);

  res = await request('POST', '/respaldos/ejecutar', { token: adminToken });
  test(
    'Admin puede ejecutar respaldo manual',
    res.status === 201 && typeof res.data?.data?.fileName === 'string',
    `status=${res.status}`
  );

  if (res.status === 201 && res.data?.data?.fileName) {
    const expectedPath = path.resolve(process.cwd(), 'backups', res.data.data.fileName);
    try {
      await fs.access(expectedPath);
      test('Archivo de respaldo fue creado en disco', true);
    } catch {
      test('Archivo de respaldo fue creado en disco', false, expectedPath);
    }
  }

  await wait(700);
  res = await request('GET', '/dashboard/bitacora?limit=200', { token: adminToken });
  const acciones = Array.isArray(res.data?.data) ? res.data.data.map((item) => item.accion) : [];
  const tieneAccionReporte = acciones.some((accion) => accion === 'CONSULTAR_REPORTE');
  const tieneAccionRespaldo = acciones.some((accion) => accion === 'RESPALDAR');
  test(
    'Bitacora registra acciones de middleware (reportes y respaldos)',
    res.status === 200 && tieneAccionReporte && tieneAccionRespaldo,
    `status=${res.status}`
  );

  printSection('6) Dashboard en tiempo real (SSE)');
  await testDashboardSse(adminToken);

  res = await request('GET', '/dashboard/stream', { token: veterinarioToken });
  test('Veterinario NO puede abrir stream de dashboard', res.status === 403, `status=${res.status}`);

  printSection('Resumen');
  const total = passed + failed;
  console.log(`Total: ${total}`);
  console.log(`OK: ${passed}`);
  console.log(`FAIL: ${failed}`);

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Error ejecutando suite Fase 3 + hardening:', error);
  process.exit(1);
});
