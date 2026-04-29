/**
 * SIGGAB — Test completo de endpoints Fase 1
 * Ejecutar: node tests/test-endpoints.js
 */

const BASE = 'http://localhost:3000/api';
let accessToken = '';
let refreshToken = '';
let createdUserId = null;
let createdAnimalId = null;
let createdEventoId = null;
let createdCalendarioId = null;

const results = [];
let passed = 0;
let failed = 0;
// Sufijo único por corrida para evitar colisión de datos
const RUN_ID = Date.now();

async function request(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
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

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SIGGAB — Test Suite Fase 1 + Fase 2');
  console.log('═══════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════
  // 1. AUTH MODULE
  // ═══════════════════════════════════════════════
  console.log('🔐 AUTH MODULE');

  // 1.1 Login exitoso
  let res = await request('POST', '/auth/login', { username: 'admin', password: 'SiggabAdmin2026!' });
  test('Login exitoso', res.status === 200 && res.data.success && res.data.data.accessToken);
  accessToken = res.data.data?.accessToken;
  refreshToken = res.data.data?.refreshToken;

  // 1.2 Login con contraseña incorrecta
  res = await request('POST', '/auth/login', { username: 'admin', password: 'wrongpassword' });
  test('Login falla con contraseña incorrecta', res.status === 401);

  // 1.3 Login con usuario inexistente (password >= 6 chars para pasar Zod y llegar a auth)
  res = await request('POST', '/auth/login', { username: 'noexiste_usuario', password: 'noexiste123' });
  test('Login falla con usuario inexistente → 401', res.status === 401);

  // 1.4 Login sin body
  res = await request('POST', '/auth/login', {});
  test('Login falla sin credenciales (validación Zod) → 400', res.status === 400);

  // 1.5 GET /me
  res = await request('GET', '/auth/me', null, accessToken);
  test('GET /me retorna perfil', res.status === 200 && res.data.data.username === 'admin');

  // 1.6 GET /me sin token
  res = await request('GET', '/auth/me');
  test('GET /me sin token → 401', res.status === 401);

  // 1.7 Refresh token
  res = await request('POST', '/auth/refresh', { refreshToken });
  test('Refresh token exitoso', res.status === 200 && res.data.data.accessToken);
  if (res.data.data?.accessToken) accessToken = res.data.data.accessToken;
  if (res.data.data?.refreshToken) refreshToken = res.data.data.refreshToken;

  console.log(results.slice(-7).join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 2. USUARIOS MODULE
  // ═══════════════════════════════════════════════
  console.log('\n👥 USUARIOS MODULE');

  // 2.1 Listar usuarios
  res = await request('GET', '/usuarios', null, accessToken);
  test('GET /usuarios retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 2.2 Obtener roles
  res = await request('GET', '/usuarios/roles', null, accessToken);
  test('GET /roles retorna 6 roles', res.status === 200 && res.data.data?.length === 6);

  // 2.3 Crear usuario (username único por corrida)
  const vetUsername = `vet_${RUN_ID}`;
  const ownerUsername = `prop_${RUN_ID}`;
  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Dr. Veterinario Test',
    username: vetUsername,
    password: 'TestPassword123!',
    idRol: 3, // Médico Veterinario
  }, accessToken);
  test('POST /usuarios crea usuario', res.status === 201 && res.data.data?.username === vetUsername);
  createdUserId = res.data.data?.idUsuario;

  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Propietario Test',
    username: ownerUsername,
    password: 'TestPassword123!',
    idRol: 1, // Propietario
  }, accessToken);
  test('POST /usuarios crea propietario', res.status === 201 && res.data.data?.username === ownerUsername);

  // 2.4 Obtener usuario creado
  if (createdUserId) {
    res = await request('GET', `/usuarios/${createdUserId}`, null, accessToken);
    test('GET /usuarios/:id retorna usuario', res.status === 200 && res.data.data?.username === vetUsername);
  }

  // 2.5 Actualizar usuario
  if (createdUserId) {
    res = await request('PATCH', `/usuarios/${createdUserId}`, {
      nombreCompleto: 'Dr. Veterinario Actualizado',
    }, accessToken);
    test('PATCH /usuarios/:id actualiza', res.status === 200 && res.data.data.nombreCompleto === 'Dr. Veterinario Actualizado');
  }

  // 2.6 Desactivar usuario
  if (createdUserId) {
    res = await request('PATCH', `/usuarios/${createdUserId}/estado`, { activo: false }, accessToken);
    test('PATCH desactivar usuario', res.status === 200 && res.data.data.activo === false);
  }

  // 2.7 Reactivar usuario
  if (createdUserId) {
    res = await request('PATCH', `/usuarios/${createdUserId}/estado`, { activo: true }, accessToken);
    test('PATCH reactivar usuario', res.status === 200 && res.data.data.activo === true);
  }

  // 2.8 Crear usuario duplicado (mismo username → conflicto único)
  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Duplicado',
    username: vetUsername,
    password: 'TestPassword123!',
    idRol: 3,
  }, accessToken);
  test('POST usuario duplicado → 409', res.status === 409);

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 3. TEST DE PERMISOS (403)
  // ═══════════════════════════════════════════════
  console.log('\n🚫 TEST DE PERMISOS');

  // Login con veterinario creado en este run
  let vetToken = null;
  let ownerToken = null;
  const vetLogin = await request('POST', '/auth/login', { username: vetUsername, password: 'TestPassword123!' });
  if (vetLogin.status === 200) {
    vetToken = vetLogin.data.data.accessToken;
  }
  test('Login como Veterinario exitoso', vetLogin.status === 200);

  const ownerLogin = await request('POST', '/auth/login', { username: ownerUsername, password: 'TestPassword123!' });
  if (ownerLogin.status === 200) {
    ownerToken = ownerLogin.data.data.accessToken;
  }
  test('Login como Propietario exitoso', ownerLogin.status === 200);

  // Veterinario intenta acceder a usuarios → 403
  if (vetToken) {
    res = await request('GET', '/usuarios', null, vetToken);
    test('Veterinario → GET /usuarios → 403', res.status === 403);
  }

  // Veterinario intenta crear usuario → 403
  if (vetToken) {
    res = await request('POST', '/usuarios', {
      nombreCompleto: 'Hacker',
      username: 'hacker',
      password: 'Hack123!',
      idRol: 2,
    }, vetToken);
    test('Veterinario → POST /usuarios → 403', res.status === 403);
  }

  // Propietario no puede acceder a usuarios → 403
  if (ownerToken) {
    res = await request('GET', '/usuarios', null, ownerToken);
    test('Propietario → GET /usuarios → 403', res.status === 403);
  }

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 4. RAZAS MODULE
  // ═══════════════════════════════════════════════
  console.log('\n🐄 RAZAS MODULE');

  // 4.1 Listar razas
  res = await request('GET', '/razas', null, accessToken);
  test('GET /razas retorna lista (8 razas)', res.status === 200 && res.data.data?.length >= 8);

  // 4.2 Crear raza
  res = await request('POST', '/razas', { nombreRaza: 'TestRaza' }, accessToken);
  test('POST /razas crea raza', res.status === 201 && res.data.data.nombreRaza === 'TestRaza');
  const createdRazaId = res.data.data?.idRaza;

  // 4.3 Vet no puede crear raza
  if (vetToken) {
    res = await request('POST', '/razas', { nombreRaza: 'HackRaza' }, vetToken);
    test('Veterinario → POST /razas → 403', res.status === 403);
  }

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 5. ANIMALES MODULE
  // ═══════════════════════════════════════════════
  console.log('\n🐮 ANIMALES MODULE');

  // 5.1 Crear animal (arete único por corrida)
  const areteTest = `27${String(RUN_ID).slice(-8).padStart(8,"0")}`;
  res = await request('POST', '/animales', {
    numeroArete: areteTest,
    procedencia: 'ADQUIRIDA',
    edadEstimada: 18,
    estadoSanitarioInicial: 'Sano al ingreso',
    fechaIngreso: '2024-01-15',
    pesoInicial: 350.5,
    idRaza: 1,
  }, accessToken);
  test('POST /animales crea animal', res.status === 201 && res.data.data?.numeroArete === areteTest);
  createdAnimalId = res.data.data?.idAnimal;

  // 5.2 Listar animales
  res = await request('GET', '/animales', null, accessToken);
  test('GET /animales retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 5.3 Buscar por ID
  if (createdAnimalId) {
    res = await request('GET', `/animales/${createdAnimalId}`, null, accessToken);
    test('GET /animales/:id retorna animal', res.status === 200 && res.data.data?.numeroArete === areteTest);
  }

  // 5.4 Buscar por arete
  res = await request('GET', `/animales/arete/${areteTest}`, null, accessToken);
  test('GET /animales/arete/:numero retorna animal', res.status === 200 && res.data.data?.idAnimal === createdAnimalId);

  // 5.5 Actualizar animal (campos que SÍ existen: procedencia, edadEstimada)
  if (createdAnimalId) {
    res = await request('PATCH', `/animales/${createdAnimalId}`, {
      procedencia: 'ADQUIRIDA',
      edadEstimada: 24,
    }, accessToken);
    test('PATCH /animales/:id actualiza', res.status === 200 && res.data.data?.procedencia === 'ADQUIRIDA');
  }

  // 5.6 Filtrar por estado
  res = await request('GET', '/animales?estado=ACTIVO', null, accessToken);
  test('GET /animales?estado=ACTIVO filtra', res.status === 200);

  // 5.7 Dar de baja
  if (createdAnimalId) {
    res = await request('PATCH', `/animales/${createdAnimalId}/baja`, {
      estadoActual: 'VENDIDO',
      motivoBaja: 'Venta programada para prueba',
      fechaBaja: '2024-06-15',
    }, accessToken);
    test('PATCH /animales/:id/baja exitoso', res.status === 200 && res.data.data.estadoActual === 'VENDIDO');
  }

  // 5.8 No se puede dar de baja a un animal ya dado de baja
  if (createdAnimalId) {
    res = await request('PATCH', `/animales/${createdAnimalId}/baja`, {
      estadoActual: 'MUERTO',
      motivoBaja: 'Test doble baja',
      fechaBaja: '2024-07-01',
    }, accessToken);
    test('Doble baja → error 400', res.status === 400);
  }

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 6. EVENTOS SANITARIOS MODULE
  // ═══════════════════════════════════════════════
  console.log('\n🏥 EVENTOS SANITARIOS MODULE');

  // Crear animal activo para eventos (arete único por corrida)
  res = await request('POST', '/animales', {
    numeroArete: `27${String(RUN_ID+1).slice(-8).padStart(8,"0")}`,
    procedencia: 'NACIDA',
    edadEstimada: 26,
    estadoSanitarioInicial: 'Sin signos clinicos',
    fechaIngreso: '2024-01-01',
    pesoInicial: 400,
    idRaza: 2,
  }, accessToken);
  const saniAnimalId = res.data.data?.idAnimal;
  test('Animal para eventos creado', res.status === 201);

  // 6.1 GET tipos de evento
  res = await request('GET', '/eventos-sanitarios/tipos', null, accessToken);
  test('GET /tipos retorna 3 tipos', res.status === 200 && res.data.data?.length === 3);

  // 6.2 Crear evento sanitario (como Vet)
  if (vetToken && saniAnimalId) {
    res = await request('POST', '/eventos-sanitarios', {
      idAnimal: saniAnimalId,
      idTipoEvento: 1,
      fechaEvento: '2024-03-15',
      descripcion: 'Vacunación de prueba',
    }, vetToken);
    test('POST evento sanitario (Vet)', res.status === 201);
    createdEventoId = res.data.data?.idEvento;
  }

  // 6.3 Listar eventos
  res = await request('GET', '/eventos-sanitarios', null, accessToken);
  test('GET /eventos-sanitarios retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 6.4 Obtener evento por ID
  if (createdEventoId) {
    res = await request('GET', `/eventos-sanitarios/${createdEventoId}`, null, accessToken);
    test('GET /eventos-sanitarios/:id retorna evento', res.status === 200);
  }

  // 6.5 Aprobar evento (como Vet)
  if (createdEventoId && vetToken) {
    res = await request('PATCH', `/eventos-sanitarios/${createdEventoId}/aprobar`, {
      estadoAprobacion: 'APROBADO',
    }, vetToken);
    test('PATCH aprobar evento (RN-04)', res.status === 200 && res.data.data.estadoAprobacion === 'APROBADO');
  }

  // 6.6 No se puede aprobar evento ya aprobado
  if (createdEventoId && vetToken) {
    res = await request('PATCH', `/eventos-sanitarios/${createdEventoId}/aprobar`, {
      estadoAprobacion: 'RECHAZADO',
    }, vetToken);
    test('Aprobar evento ya aprobado → 400', res.status === 400);
  }

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // 7. CALENDARIO SANITARIO MODULE
  // ═══════════════════════════════════════════════
  console.log('\n📅 CALENDARIO SANITARIO MODULE');

  // 7.1 Crear evento en calendario (como Vet)
  if (vetToken && saniAnimalId) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const fechaStr = futureDate.toISOString().split('T')[0];

    res = await request('POST', '/calendario-sanitario', {
      idAnimal: saniAnimalId,
      idTipoEvento: 2,
      fechaProgramada: fechaStr,
    }, vetToken);
    test('POST calendario sanitario (Vet)', res.status === 201);
    createdCalendarioId = res.data.data?.idCalendario;
  }

  // 7.2 Listar calendario
  res = await request('GET', '/calendario-sanitario', null, accessToken);
  test('GET /calendario-sanitario retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 7.3 Alertas
  res = await request('GET', '/calendario-sanitario/alertas?dias=30', null, accessToken);
  test('GET /alertas retorna próximos (30 días)', res.status === 200 && Array.isArray(res.data.data));

  // 7.4 Completar evento
  if (createdCalendarioId && vetToken) {
    res = await request('PATCH', `/calendario-sanitario/${createdCalendarioId}/completar`, {
      estado: 'COMPLETADO',
    }, vetToken);
    test('PATCH completar evento calendario', res.status === 200 && res.data.data.estado === 'COMPLETADO');
  }

  // 7.5 No se puede completar evento ya completado
  if (createdCalendarioId && vetToken) {
    res = await request('PATCH', `/calendario-sanitario/${createdCalendarioId}/completar`, {
      estado: 'CANCELADO',
    }, vetToken);
    test('Completar evento ya completado → 400', res.status === 400);
  }

  console.log(results.join('\n'));
  results.length = 0;

  // ═══════════════════════════════════════════════
  // ── FASE 2 ──────────────────────────────────────
  // ═══════════════════════════════════════════════

  // ═══════════════════════════════════════════════
  // 10. INVENTARIO — TIPOS DE INSUMO
  // ═══════════════════════════════════════════════
  console.log('\n📦 INVENTARIO — TIPOS DE INSUMO');

  // 10.1 Listar tipos (vacío al inicio)
  res = await request('GET', '/insumos/tipos', null, accessToken);
  test('GET /insumos/tipos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 10.2 Crear tipo de insumo
  res = await request('POST', '/insumos/tipos', {
    nombreTipo: 'Medicamentos',
    descripcion: 'Medicamentos veterinarios',
  }, accessToken);
  test('POST /insumos/tipos crea tipo', res.status === 201 && res.data.data?.nombreTipo === 'Medicamentos');
  const tipoInsumoId = res.data.data?.idTipoInsumo;

  // 10.3 Crear segundo tipo
  res = await request('POST', '/insumos/tipos', { nombreTipo: 'Alimento' }, accessToken);
  const tipoAlimentoId = res.data.data?.idTipoInsumo;
  test('POST /insumos/tipos segundo tipo', res.status === 201);

  // 10.4 Tipo con nombre inválido → error Zod
  res = await request('POST', '/insumos/tipos', { nombreTipo: 'A' }, accessToken);
  test('POST tipo nombre corto → 400', res.status === 400);

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 11. INVENTARIO — INSUMOS
  // ═══════════════════════════════════════════════
  console.log('\n🧴 INVENTARIO — INSUMOS');

  let createdInsumoId = null;

  // 11.1 Crear insumo
  if (tipoInsumoId) {
    res = await request('POST', '/insumos', {
      nombreInsumo: 'Ivermectina 1%',
      idTipoInsumo: tipoInsumoId,
      unidadMedida: 'ml',
      descripcion: 'Antiparasitario inyectable',
      stockActual: 0,
    }, accessToken);
    test('POST /insumos crea insumo', res.status === 201 && res.data.data?.nombreInsumo === 'Ivermectina 1%');
    createdInsumoId = res.data.data?.idInsumo;
  }

  // 11.2 Listar insumos
  res = await request('GET', '/insumos', null, accessToken);
  test('GET /insumos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 11.3 Obtener insumo por ID
  if (createdInsumoId) {
    res = await request('GET', `/insumos/${createdInsumoId}`, null, accessToken);
    test('GET /insumos/:id retorna insumo', res.status === 200 && res.data.data?.idInsumo === createdInsumoId);
  }

  // 11.4 Actualizar insumo
  if (createdInsumoId) {
    res = await request('PATCH', `/insumos/${createdInsumoId}`, { descripcion: 'Antiparasitario inyectable actualizado' }, accessToken);
    test('PATCH /insumos/:id actualiza', res.status === 200);
  }

  // 11.5 Insumo con tipo inexistente → 400
  res = await request('POST', '/insumos', {
    nombreInsumo: 'Test',
    idTipoInsumo: 99999,
    unidadMedida: 'kg',
  }, accessToken);
  test('POST insumo con tipo inválido → 400', res.status === 400);

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 12. INVENTARIO — MOVIMIENTOS
  // ═══════════════════════════════════════════════
  console.log('\n🔄 INVENTARIO — MOVIMIENTOS');

  // Para probar movimientos primero necesitamos stock. Creamos otro insumo con stock inicial > 0
  let insumoConStockId = null;
  if (tipoAlimentoId) {
    res = await request('POST', '/insumos', {
      nombreInsumo: 'Sal Mineral',
      idTipoInsumo: tipoAlimentoId,
      unidadMedida: 'kg',
      stockActual: 100,
    }, accessToken);
    insumoConStockId = res.data.data?.idInsumo;
    test('Insumo con stock inicial 100 kg creado', res.status === 201);
  }

  // 12.1 Registrar salida exitosa
  if (insumoConStockId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoConStockId,
      tipoMovimiento: 'SALIDA',
      cantidad: 25,
      fechaMovimiento: '2024-06-01',
    }, accessToken);
    test('POST movimiento SALIDA exitoso', res.status === 201 && res.data.data?.tipoMovimiento === 'SALIDA');
  }

  // 12.2 Salida que excede stock → 400 (RN-09)
  if (insumoConStockId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoConStockId,
      tipoMovimiento: 'SALIDA',
      cantidad: 9999,
      fechaMovimiento: '2024-06-01',
    }, accessToken);
    test('Salida mayor al stock → 400 (RN-09)', res.status === 400);
  }

  // 12.3 Listar movimientos
  res = await request('GET', '/insumos/movimientos', null, accessToken);
  test('GET /insumos/movimientos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 13. COMPRAS — SOLICITUDES
  // ═══════════════════════════════════════════════
  console.log('\n🛒 COMPRAS — SOLICITUDES');

  // Crear un usuario con rol Almacén para las pruebas
  const almacenUsername = `almacen_${RUN_ID}`;
  res = await request('POST', '/usuarios', {
    nombreCompleto: 'Encargado Almacén',
    username: almacenUsername,
    password: 'TestPassword123!',
    idRol: 6, // Almacén
  }, accessToken);
  test('Usuario Almacén creado', res.status === 201);
  let almacenToken = null;
  const almacenLogin = await request('POST', '/auth/login', { username: almacenUsername, password: 'TestPassword123!' });
  if (almacenLogin.status === 200) almacenToken = almacenLogin.data.data.accessToken;

  let solicitudId = null;

  // 13.1 Almacén crea solicitud (RN-13)
  if (almacenToken && createdInsumoId && insumoConStockId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-01',
      observaciones: 'Solicitud de prueba F2',
      detalles: [
        { idInsumo: createdInsumoId, cantidad: 50, precioEstimado: 12.5 },
        { idInsumo: insumoConStockId, cantidad: 200, precioEstimado: 3.0 },
      ],
    }, almacenToken);
    test('POST /solicitudes-compra crea solicitud (RN-13)', res.status === 201);
    solicitudId = res.data.data?.idSolicitud;
  }

  // 13.2 Admin no puede crear solicitud (requiere Almacén)
  if (createdInsumoId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-01',
      detalles: [{ idInsumo: createdInsumoId, cantidad: 10, precioEstimado: 5 }],
    }, accessToken); // admin token
    test('Admin crea solicitud → 403 (RN-13)', res.status === 403);
  }

  // 13.3 Listar solicitudes
  res = await request('GET', '/solicitudes-compra', null, accessToken);
  test('GET /solicitudes-compra retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 13.4 Obtener solicitud por ID
  if (solicitudId) {
    res = await request('GET', `/solicitudes-compra/${solicitudId}`, null, accessToken);
    test('GET /solicitudes-compra/:id retorna solicitud', res.status === 200 && res.data.data?.idSolicitud === solicitudId);
  }

  // 13.5 Admin aprueba solicitud (RN-14)
  if (solicitudId) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudId}/aprobar`, {
      estadoSolicitud: 'APROBADA',
      observaciones: 'Aprobada para prueba',
    }, accessToken);
    test('PATCH aprobar solicitud (RN-14)', res.status === 200 && res.data.data?.estadoSolicitud === 'APROBADA');
  }

  // 13.6 No se puede aprobar solicitud ya aprobada (RN-17)
  if (solicitudId) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudId}/aprobar`, {
      estadoSolicitud: 'RECHAZADA',
    }, accessToken);
    test('Aprobar solicitud ya procesada → 400 (RN-17)', res.status === 400);
  }

  // 13.7 Crear y rechazar segunda solicitud (RN-15)
  let solicitudRechazadaId = null;
  if (almacenToken && createdInsumoId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-02',
      detalles: [{ idInsumo: createdInsumoId, cantidad: 5, precioEstimado: 10 }],
    }, almacenToken);
    solicitudRechazadaId = res.data.data?.idSolicitud;
    if (solicitudRechazadaId) {
      await request('PATCH', `/solicitudes-compra/${solicitudRechazadaId}/aprobar`, { estadoSolicitud: 'RECHAZADA' }, accessToken);
      res = await request('PATCH', `/solicitudes-compra/${solicitudRechazadaId}/aprobar`, { estadoSolicitud: 'APROBADA' }, accessToken);
      test('Reabrir solicitud rechazada → 400 (RN-15)', res.status === 400);
    }
  }

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 14. COMPRAS — COMPRAS REALIZADAS
  // ═══════════════════════════════════════════════
  console.log('\n💳 COMPRAS — COMPRAS REALIZADAS');

  let compraId = null;

  // 14.1 Registrar compra realizada (RN-16: genera entradas automáticas)
  if (solicitudId && createdInsumoId && insumoConStockId) {
    // Verificar stock antes
    const insumoAntes = await request('GET', `/insumos/${createdInsumoId}`, null, accessToken);
    const stockAntes = Number(insumoAntes.data.data?.stockActual || 0);

    res = await request('POST', '/compras-realizadas', {
      idSolicitud: solicitudId,
      fechaCompra: '2024-07-05',
      detalles: [
        { idInsumo: createdInsumoId, cantidadReal: 50, precioUnitario: 12.5 },
        { idInsumo: insumoConStockId, cantidadReal: 200, precioUnitario: 3.0 },
      ],
    }, accessToken);
    test('POST /compras-realizadas registra compra (RN-16)', res.status === 201);
    compraId = res.data.data?.idCompra;

    // Verificar que el stock aumentó automáticamente (RN-16)
    if (compraId) {
      const insumoDesp = await request('GET', `/insumos/${createdInsumoId}`, null, accessToken);
      const stockDesp = Number(insumoDesp.data.data?.stockActual || 0);
      test('Stock actualizado automáticamente tras compra (RN-16)', stockDesp === stockAntes + 50);
    }
  }

  // 14.2 Listar compras
  res = await request('GET', '/compras-realizadas', null, accessToken);
  test('GET /compras-realizadas retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 14.3 Obtener compra por ID
  if (compraId) {
    res = await request('GET', `/compras-realizadas/${compraId}`, null, accessToken);
    test('GET /compras-realizadas/:id con detalles y movimientos', res.status === 200 && res.data.data?.detalles?.length > 0);
  }

  // 14.4 Compra sobre solicitud ya comprada → 400 (RN-17)
  if (solicitudId && createdInsumoId) {
    res = await request('POST', '/compras-realizadas', {
      idSolicitud: solicitudId,
      fechaCompra: '2024-07-10',
      detalles: [{ idInsumo: createdInsumoId, cantidadReal: 10, precioUnitario: 12.5 }],
    }, accessToken);
    test('Compra duplicada sobre misma solicitud → 400 (RN-17)', res.status === 400);
  }

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 15. PRODUCTIVO - FLUJO DIRECTO
  // ═══════════════════════════════════════════════
  console.log('\nPRODUCTIVO - FLUJO DIRECTO');

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 16. PRODUCTIVO — REGISTROS DE PESO
  // ═══════════════════════════════════════════════
  console.log('\n⚖️  PRODUCTIVO — REGISTROS DE PESO');

  // Creamos animal activo para registros productivos
  const areteProd = `27${String(RUN_ID+2).slice(-8).padStart(8,"0")}`;
  res = await request('POST', '/animales', {
    numeroArete: areteProd,
    procedencia: 'NACIDA',
    edadEstimada: 20,
    estadoSanitarioInicial: 'Apto para produccion',
    fechaIngreso: '2024-01-01',
    pesoInicial: 300,
    idRaza: 1,
    sexo: 'HEMBRA',
  }, accessToken);
  const prodAnimalId = res.data.data?.idAnimal;
  test('Animal para registros productivos creado', res.status === 201);

  let pesoId = null;

  // 16.1 Registrar peso válido (RN-01 + RN-02)
  if (prodAnimalId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: prodAnimalId,
      peso: 350,
      fechaRegistro: '2024-06-10',
    }, accessToken);
    test('POST /registros-peso registra peso', res.status === 201 && Number(res.data.data?.peso) === 350);
    pesoId = res.data.data?.idRegistroPeso;
  }

  // 16.2 Peso demasiado bajo → 400 (RN-02: < 50% de pesoInicial=300 → min 150)
  if (prodAnimalId) {
    res = await request('POST', '/registros-peso', {
      idAnimal: prodAnimalId,
      peso: 100,
      fechaRegistro: '2024-06-11',
    }, accessToken);
    test('Peso inválido < 50% inicial → 400 (RN-02)', res.status === 400);
  }

  // 16.3 Listar registros de peso
  res = await request('GET', '/registros-peso', null, accessToken);
  test('GET /registros-peso retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 16.4 Validar registro de peso
  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}/validar`, {
      estadoValidacion: 'APROBADO',
    }, accessToken);
    test('PATCH /registros-peso/:id/validar aprueba', res.status === 200 && res.data.data?.estadoValidacion === 'APROBADO');
  }

  // 16.5 No validar dos veces
  if (pesoId) {
    res = await request('PATCH', `/registros-peso/${pesoId}/validar`, {
      estadoValidacion: 'RECHAZADO',
    }, accessToken);
    test('Doble validación peso → 400', res.status === 400);
  }

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 17. PRODUCTIVO — PRODUCCIÓN DE LECHE
  // ═══════════════════════════════════════════════
  console.log('\n🥛 PRODUCTIVO — PRODUCCIÓN DE LECHE');

  let produccionId = null;

  if (prodAnimalId) {
    res = await request('POST', '/produccion-leche', {
      idAnimal: prodAnimalId,
      litrosProducidos: 18.5,
      fechaRegistro: '2024-06-10',
    }, accessToken);
    test('POST /produccion-leche registra producción', res.status === 201 && Number(res.data.data?.litrosProducidos) === 18.5);
    produccionId = res.data.data?.idProduccion;
  }

  res = await request('GET', '/produccion-leche', null, accessToken);
  test('GET /produccion-leche retorna lista', res.status === 200 && Array.isArray(res.data.data));

  if (produccionId) {
    res = await request('PATCH', `/produccion-leche/${produccionId}/validar`, { estadoValidacion: 'APROBADO' }, accessToken);
    test('PATCH /produccion-leche/:id/validar aprueba', res.status === 200);
  }

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 18. PRODUCTIVO — EVENTOS REPRODUCTIVOS
  // ═══════════════════════════════════════════════
  console.log('\n🐄 PRODUCTIVO — EVENTOS REPRODUCTIVOS');

  let eventoReproId = null;

  if (prodAnimalId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: prodAnimalId,
      tipoEvento: 'PARTO',
      fechaEvento: '2024-06-15',
      observaciones: 'Parto normal sin complicaciones',
    }, accessToken);
    test('POST /eventos-reproductivos registra PARTO', res.status === 201 && res.data.data?.tipoEvento === 'PARTO');
    eventoReproId = res.data.data?.idEventoReproductivo;
  }

  // Tipo inválido → 400
  if (prodAnimalId) {
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: prodAnimalId,
      tipoEvento: 'INVALIDO',
      fechaEvento: '2024-06-16',
    }, accessToken);
    test('Tipo reproductivo inválido → 400 (RN-06)', res.status === 400);
  }

  res = await request('GET', '/eventos-reproductivos', null, accessToken);
  test('GET /eventos-reproductivos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  if (eventoReproId) {
    res = await request('PATCH', `/eventos-reproductivos/${eventoReproId}/validar`, { estadoValidacion: 'APROBADO' }, accessToken);
    test('PATCH /eventos-reproductivos/:id/validar aprueba', res.status === 200);
  }

  // Animal dado de baja no puede registrar eventos productivos (RN-01)
  if (createdAnimalId) {
    // createdAnimalId ya está dado de baja (VENDIDO) desde el test de Fase 1
    res = await request('POST', '/eventos-reproductivos', {
      idAnimal: createdAnimalId,
      tipoEvento: 'CELO',
      fechaEvento: '2024-06-20',
    }, accessToken);
    test('Evento reproductivo en animal BAJA → 400 (RN-01)', res.status === 400);
  }

  console.log(results.join('\n')); results.length = 0;

  // ═══════════════════════════════════════════════
  // 19. DASHBOARD
  // ═══════════════════════════════════════════════
  console.log('\n📈 DASHBOARD');

  res = await request('GET', '/dashboard/resumen', null, accessToken);
  test('GET /dashboard/resumen responde 200', res.status === 200 && res.data.data?.totalAnimalesActivos !== undefined);

  res = await request('GET', '/dashboard/ganado', null, accessToken);
  test('GET /dashboard/ganado responde 200', res.status === 200 && res.data.data?.porEstado !== undefined);

  res = await request('GET', '/dashboard/produccion', null, accessToken);
  test('GET /dashboard/produccion responde 200', res.status === 200 && res.data.data?.leche !== undefined);

  res = await request('GET', '/dashboard/sanitario', null, accessToken);
  test('GET /dashboard/sanitario responde 200', res.status === 200 && res.data.data?.proximosEventos !== undefined);

  res = await request('GET', '/dashboard/inventario', null, accessToken);
  test('GET /dashboard/inventario responde 200', res.status === 200 && res.data.data?.agotados !== undefined);

  res = await request('GET', '/dashboard/bitacora', null, accessToken);
  test('GET /dashboard/bitacora responde 200 (Administrador/Propietario)', res.status === 200 && Array.isArray(res.data.data));

  if (ownerToken) {
    res = await request('GET', '/dashboard/bitacora', null, ownerToken);
    test('Propietario → GET /dashboard/bitacora → 200', res.status === 200 && Array.isArray(res.data.data));
  }

  // Veterinario no puede ver dashboard resumen → 403
  if (vetToken) {
    res = await request('GET', '/dashboard/resumen', null, vetToken);
    test('Vet → GET /dashboard/resumen → 403', res.status === 403);
  }

  // Veterinario no puede ver bitácora → 403
  if (vetToken) {
    res = await request('GET', '/dashboard/bitacora', null, vetToken);
    test('Vet → GET /dashboard/bitacora → 403', res.status === 403);
  }

  console.log(results.join('\n')); results.length = 0;


  console.log('\n🔍 RUTA 404');
  res = await request('GET', '/ruta-inexistente', null, accessToken);
  test('GET ruta inexistente → 404', res.status === 404);

  // ═══════════════════════════════════════════════
  // 9. LOGOUT
  // ═══════════════════════════════════════════════
  console.log('\n🚪 LOGOUT');
  res = await request('POST', '/auth/logout', { refreshToken }, accessToken);
  test('POST /auth/logout exitoso', res.status === 200);

  // Intentar usar refresh token revocado
  res = await request('POST', '/auth/refresh', { refreshToken });
  test('Refresh con token revocado → 401', res.status === 401);

  console.log(results.join('\n'));

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  RESULTADOS: ${passed} pasaron ✅ | ${failed} fallaron ❌`);
  console.log(`  Total: ${passed + failed} pruebas`);
  console.log('═══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error ejecutando tests:', err);
  process.exit(1);
});


