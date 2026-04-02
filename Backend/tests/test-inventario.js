/**
 * SIGGAB — Test completo de endpoints de Módulo Inventario y Compras
 * Ejecutar: node tests/test-inventario.js
 *
 * Requiere backend corriendo en http://localhost:3000
 * Cubre:
 *   - Tipos de insumo (CRUD + toggle activo)
 *   - Insumos (CRUD + filtros + toggle activo)
 *   - Movimientos de inventario (CRUD + RN-09 stock insuficiente)
 *   - Solicitudes de compra (CRUD + RN-13 solo Almacén + RN-14 solo Admin + RN-15 inmutabilidad)
 *   - Compras realizadas (CRUD + RN-16 entradas automáticas + RN-17 unicidad)
 *   - Permisos por rol (403)
 */

const BASE = 'http://localhost:3000/api';
const RUN_ID = Date.now();
const results = [];
let passed = 0;
let failed = 0;

function test(nombre, condicion, detalle = '') {
  if (condicion) { passed++; results.push(`  [PASS] ${nombre}`); }
  else {
    failed++;
    const errMsg = (global.lastRes && global.lastRes.data && global.lastRes.data.error) ? global.lastRes.data.error : JSON.stringify(global.lastRes);
    results.push(`  [FAIL] ${nombre} (Status: ${global.lastRes?.status}) - ${errMsg}`); 
  }
}

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => null);
    global.lastRes = { status: res.status, data };
    return global.lastRes;
  } catch (e) {
    global.lastRes = { status: 0, data: { error: 'FETCH FAILED: ' + e.message } };
    return global.lastRes;
  }
}

function printSection() { 
  const fail = results.filter(r => r.includes('[FAIL]'));
  if (fail.length > 0) require('fs').appendFileSync('tests/inv-failures.json', JSON.stringify(fail, null, 2) + '\n');
  results.length = 0; 
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SIGGAB — Test Suite: Módulo Inventario');
  console.log('═══════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════
  // 0. SETUP — Autenticación
  // ═══════════════════════════════════════════════
  console.log('🔐 SETUP — Autenticación');

  let res = await request('POST', '/auth/login', { username: 'admin', password: 'SiggabAdmin2026!' });
  test('Login como Administrador', res.status === 200 && res.data.success);
  const adminToken = res.data.data?.accessToken;

  // Buscar roles correctos
  const rolesRes = await request('GET', '/auth/login', null); // fake request
  
  // Asumiremos las IDs de seed.js
  const rolAdmin = 2;
  const rolVet = 3;
  const rolProd = 4;
  const rolCampo = 5;
  const rolAlmacen = 6;

  // Crear usuario Almacén
  const almacenUser = `almacen_inv_${RUN_ID}`;
  res = await request('POST', '/usuarios', { nombreCompleto: 'Almacenista Test', username: almacenUser, password: 'TestAlm2026!', idRol: rolAlmacen }, adminToken);
  test('Usuario Almacén creado', res.status === 201);

  res = await request('POST', '/auth/login', { username: almacenUser, password: 'TestAlm2026!' });
  const almacenToken = res.data.data?.accessToken;
  test('Login como Almacén', res.status === 200 && !!almacenToken);

  // Crear usuario Producción (no debería tener acceso a inventario)
  const prodUser = `prod_inv_${RUN_ID}`;
  res = await request('POST', '/usuarios', { nombreCompleto: 'Producción Test Inv', username: prodUser, password: 'TestProd2026!', idRol: rolProd }, adminToken);
  test('Usuario Producción creado', res.status === 201);

  res = await request('POST', '/auth/login', { username: prodUser, password: 'TestProd2026!' });
  const prodToken = res.data.data?.accessToken;
  test('Login como Producción', res.status === 200 && !!prodToken);

  // Crear usuario Veterinario
  const vetUser = `vet_inv_${RUN_ID}`;
  res = await request('POST', '/usuarios', { nombreCompleto: 'Vet Test Inv', username: vetUser, password: 'TestVet2026!', idRol: rolVet }, adminToken);
  test('Usuario Veterinario creado', res.status === 201);

  res = await request('POST', '/auth/login', { username: vetUser, password: 'TestVet2026!' });
  const vetToken = res.data.data?.accessToken;
  test('Login como Veterinario', res.status === 200 && !!vetToken);

  printSection();

  // ═══════════════════════════════════════════════
  // 1. TIPOS DE INSUMO
  // ═══════════════════════════════════════════════
  console.log('\n📋 TIPOS DE INSUMO');

  // 1.1 Crear tipo (Admin)
  res = await request('POST', '/insumos/tipos', { nombreTipo: `Medicamentos ${RUN_ID}`, descripcion: 'Fármacos veterinarios' }, adminToken);
  test('POST /insumos/tipos crea tipo (Admin)', res.status === 201 && res.data.data?.nombreTipo?.includes('Medicamentos'));
  const tipoId = res.data.data?.idTipoInsumo;

  // 1.2 Crear segundo tipo
  res = await request('POST', '/insumos/tipos', { nombreTipo: `Alimento ${RUN_ID}` }, adminToken);
  test('POST /insumos/tipos crea segundo tipo', res.status === 201);
  const tipoId2 = res.data.data?.idTipoInsumo;

  // 1.3 Sin nombre → 400
  res = await request('POST', '/insumos/tipos', {}, adminToken);
  test('Tipo sin nombre → 400 (Zod)', res.status === 400);

  // 1.4 Nombre muy corto → 400
  res = await request('POST', '/insumos/tipos', { nombreTipo: 'A' }, adminToken);
  test('Tipo nombre < 2 chars → 400', res.status === 400);

  // 1.5 Listar tipos
  res = await request('GET', '/insumos/tipos', null, adminToken);
  test('GET /insumos/tipos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 1.6 Editar tipo (Admin)
  if (tipoId) {
    res = await request('PATCH', `/insumos/tipos/${tipoId}`, { descripcion: 'Actualizado' }, adminToken);
    test('PATCH /insumos/tipos/:id edita (Admin)', res.status === 200);
  }

  // 1.7 Toggle activo
  if (tipoId2) {
    res = await request('PATCH', `/insumos/tipos/${tipoId2}`, { activo: false }, adminToken);
    test('Desactivar tipo', res.status === 200 && res.data.data?.activo === false);

    res = await request('PATCH', `/insumos/tipos/${tipoId2}`, { activo: true }, adminToken);
    test('Reactivar tipo', res.status === 200 && res.data.data?.activo === true);
  }

  // 1.8 Tipo inexistente → 404
  res = await request('PATCH', '/insumos/tipos/99999', { nombreTipo: 'Valido' }, adminToken);
  test('PATCH tipo inexistente → 404', res.status === 404);

  // 1.9 Almacén NO puede crear tipo → 403
  res = await request('POST', '/insumos/tipos', { nombreTipo: 'Hack' }, almacenToken);
  test('Almacén → POST /insumos/tipos → 403', res.status === 403);

  // 1.10 Almacén NO puede editar tipo → 403
  if (tipoId) {
    res = await request('PATCH', `/insumos/tipos/${tipoId}`, { descripcion: 'Hack' }, almacenToken);
    test('Almacén → PATCH /insumos/tipos → 403', res.status === 403);
  }

  // 1.11 Todos pueden leer tipos
  res = await request('GET', '/insumos/tipos', null, almacenToken);
  test('Almacén puede GET /insumos/tipos', res.status === 200);

  printSection();

  // ═══════════════════════════════════════════════
  // 2. INSUMOS (CRUD)
  // ═══════════════════════════════════════════════
  console.log('\n📦 INSUMOS');

  let insumoId = null;
  let insumoId2 = null;

  // 2.1 Crear insumo (Admin)
  if (tipoId) {
    res = await request('POST', '/insumos', {
      nombreInsumo: `Ivermectina ${RUN_ID}`, idTipoInsumo: tipoId,
      unidadMedida: 'ml', descripcion: 'Antiparasitario', stockActual: 100,
    }, adminToken);
    test('POST /insumos crea insumo (Admin)', res.status === 201 && Number(res.data.data?.stockActual) === 100);
    insumoId = res.data.data?.idInsumo;
  }

  // 2.2 Crear insumo (Almacén — tiene permiso)
  if (tipoId) {
    res = await request('POST', '/insumos', {
      nombreInsumo: `Sal Mineral ${RUN_ID}`, idTipoInsumo: tipoId,
      unidadMedida: 'kg', stockActual: 200,
    }, almacenToken);
    test('POST /insumos crea insumo (Almacén)', res.status === 201);
    insumoId2 = res.data.data?.idInsumo;
  }

  // 2.3 Sin campos obligatorios → 400
  res = await request('POST', '/insumos', {}, adminToken);
  test('Insumo sin campos → 400 (Zod)', res.status === 400);

  // 2.4 Tipo inexistente → 400
  res = await request('POST', '/insumos', { nombreInsumo: 'X', idTipoInsumo: 99999, unidadMedida: 'x' }, adminToken);
  test('Insumo con tipo inexistente → 400', res.status === 400);

  // 2.5 Listar insumos
  res = await request('GET', '/insumos', null, adminToken);
  test('GET /insumos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 2.6 Filtrar por tipo
  if (tipoId) {
    res = await request('GET', `/insumos?idTipoInsumo=${tipoId}`, null, adminToken);
    test('GET /insumos?idTipoInsumo filtra correctamente', res.status === 200 && Array.isArray(res.data.data));
  }

  // 2.7 Obtener por ID
  if (insumoId) {
    res = await request('GET', `/insumos/${insumoId}`, null, adminToken);
    test('GET /insumos/:id retorna insumo', res.status === 200 && res.data.data?.idInsumo === insumoId);
  }

  // 2.8 Insumo inexistente → 404
  res = await request('GET', '/insumos/99999', null, adminToken);
  test('GET insumo inexistente → 404', res.status === 404);

  // 2.9 Editar insumo
  if (insumoId) {
    res = await request('PATCH', `/insumos/${insumoId}`, { descripcion: 'Actualizado por test' }, adminToken);
    test('PATCH /insumos/:id edita insumo', res.status === 200);
  }

  // 2.10 Toggle activo
  if (insumoId) {
    res = await request('PATCH', `/insumos/${insumoId}`, { activo: false }, adminToken);
    test('Desactivar insumo', res.status === 200 && res.data.data?.activo === false);

    res = await request('PATCH', `/insumos/${insumoId}`, { activo: true }, adminToken);
    test('Reactivar insumo', res.status === 200 && res.data.data?.activo === true);
  }

  // 2.11 Producción NO puede crear insumo → 403
  if (tipoId) {
    res = await request('POST', '/insumos', { nombreInsumo: 'Hack', idTipoInsumo: tipoId, unidadMedida: 'x' }, prodToken);
    test('Producción → POST /insumos → 403', res.status === 403);
  }

  // 2.12 Veterinario NO puede crear insumo → 403
  if (tipoId) {
    res = await request('POST', '/insumos', { nombreInsumo: 'Hack', idTipoInsumo: tipoId, unidadMedida: 'x' }, vetToken);
    test('Veterinario → POST /insumos → 403', res.status === 403);
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 3. MOVIMIENTOS DE INVENTARIO
  // ═══════════════════════════════════════════════
  console.log('\n🔄 MOVIMIENTOS DE INVENTARIO');

  // 3.1 Registrar salida manual (Admin — stock: 100)
  let movId = null;
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'SALIDA', cantidad: 25, fechaMovimiento: '2024-07-01',
    }, adminToken);
    test('POST /insumos/movimientos registra SALIDA válida', res.status === 201);
    movId = res.data.data?.idMovimiento;
  }

  // 3.2 Registrar entrada manual (Almacén)
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'ENTRADA', cantidad: 50, fechaMovimiento: '2024-07-02',
    }, almacenToken);
    test('POST movimiento ENTRADA (Almacén)', res.status === 201);
  }

  // 3.3 Salida mayor que stock → 400 (RN-09)
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'SALIDA', cantidad: 99999, fechaMovimiento: '2024-07-03',
    }, adminToken);
    test('Salida > stock → 400 (RN-09)', res.status === 400);
  }

  // 3.4 Sin campos → 400
  res = await request('POST', '/insumos/movimientos', {}, adminToken);
  test('Movimiento sin campos → 400 (Zod)', res.status === 400);

  // 3.5 Tipo inválido → 400
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'INVALIDO', cantidad: 10, fechaMovimiento: '2024-07-04',
    }, adminToken);
    test('Tipo movimiento inválido → 400', res.status === 400);
  }

  // 3.6 Cantidad negativa → 400
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'SALIDA', cantidad: -5, fechaMovimiento: '2024-07-05',
    }, adminToken);
    test('Cantidad negativa → 400', res.status === 400);
  }

  // 3.7 Insumo inexistente → 404
  res = await request('POST', '/insumos/movimientos', {
    idInsumo: 99999, tipoMovimiento: 'SALIDA', cantidad: 1, fechaMovimiento: '2024-07-06',
  }, adminToken);
  test('Movimiento con insumo inexistente → 404', res.status === 404);

  // 3.8 Listar movimientos
  res = await request('GET', '/insumos/movimientos', null, adminToken);
  test('GET /insumos/movimientos retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 3.9 Filtrar por insumo
  if (insumoId) {
    res = await request('GET', `/insumos/movimientos?idInsumo=${insumoId}`, null, adminToken);
    test('GET /insumos/movimientos?idInsumo filtra', res.status === 200);
  }

  // 3.10 Obtener movimiento por ID
  if (movId) {
    res = await request('GET', `/insumos/movimientos/${movId}`, null, adminToken);
    test('GET /insumos/movimientos/:id retorna movimiento', res.status === 200);
  }

  // 3.11 Producción NO puede registrar movimiento → 403
  if (insumoId) {
    res = await request('POST', '/insumos/movimientos', {
      idInsumo: insumoId, tipoMovimiento: 'SALIDA', cantidad: 1, fechaMovimiento: '2024-07-07',
    }, prodToken);
    test('Producción → POST /insumos/movimientos → 403', res.status === 403);
  }

  // 3.12 Producción NO puede ver movimientos → 403
  res = await request('GET', '/insumos/movimientos', null, prodToken);
  test('Producción → GET /insumos/movimientos → 403', res.status === 403);

  // 3.13 Verificar stock actualizado tras movimientos
  if (insumoId) {
    res = await request('GET', `/insumos/${insumoId}`, null, adminToken);
    const stockActual = Number(res.data.data?.stockActual);
    // Inicial: 100, -25 salida, +50 entrada = 125
    test('Stock actualizado correctamente (100-25+50=125)', stockActual === 125);
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 4. SOLICITUDES DE COMPRA
  // ═══════════════════════════════════════════════
  console.log('\n🛒 SOLICITUDES DE COMPRA');

  let solicitudId = null;
  let solicitudIdRechazar = null;

  // 4.1 Crear solicitud (Almacén — RN-13)
  if (insumoId && insumoId2) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-10',
      observaciones: 'Reposición mensual — test',
      detalles: [
        { idInsumo: insumoId, cantidad: 50, precioEstimado: 12.5 },
        { idInsumo: insumoId2, cantidad: 100, precioEstimado: 3.0 },
      ],
    }, almacenToken);
    test('POST /solicitudes-compra crea solicitud (Almacén — RN-13)', res.status === 201 && res.data.data?.estadoSolicitud === 'PENDIENTE');
    solicitudId = res.data.data?.idSolicitud;
  }

  // 4.2 Segunda solicitud (para rechazar)
  if (insumoId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-11',
      detalles: [{ idInsumo: insumoId, cantidad: 1, precioEstimado: 5 }],
    }, almacenToken);
    test(`POST segunda solicitud (status: ${res.status})`, res.status === 201);
    solicitudIdRechazar = res.data.data?.idSolicitud;
  }

  // 4.3 Admin NO puede crear solicitud → 403 (RN-13: solo Almacén)
  if (insumoId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-12',
      detalles: [{ idInsumo: insumoId, cantidad: 1, precioEstimado: 1 }],
    }, adminToken);
    test('Admin → POST /solicitudes-compra → 403 (RN-13)', res.status === 403);
  }

  // 4.4 Producción NO puede crear solicitud → 403
  if (insumoId) {
    res = await request('POST', '/solicitudes-compra', {
      fechaSolicitud: '2024-07-13',
      detalles: [{ idInsumo: insumoId, cantidad: 1, precioEstimado: 1 }],
    }, prodToken);
    test('Producción → POST /solicitudes-compra → 403', res.status === 403);
  }

  // 4.5 Sin detalles → 400
  res = await request('POST', '/solicitudes-compra', { fechaSolicitud: '2024-07-14', detalles: [] }, almacenToken);
  test('Solicitud sin detalles → 400', res.status === 400);

  // 4.6 Sin fecha → 400
  if (insumoId) {
    res = await request('POST', '/solicitudes-compra', {
      detalles: [{ idInsumo: insumoId, cantidad: 1, precioEstimado: 1 }],
    }, almacenToken);
    test('Solicitud sin fecha → 400', res.status === 400);
  }

  // 4.7 Listar solicitudes
  res = await request('GET', '/solicitudes-compra', null, adminToken);
  test('GET /solicitudes-compra retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 4.8 Filtrar por estado
  res = await request('GET', '/solicitudes-compra?estado=PENDIENTE', null, adminToken);
  test('GET /solicitudes-compra?estado=PENDIENTE filtra', res.status === 200);

  // 4.9 Obtener por ID
  if (solicitudId) {
    res = await request('GET', `/solicitudes-compra/${solicitudId}`, null, adminToken);
    test('GET /solicitudes-compra/:id retorna solicitud con detalles', res.status === 200 && res.data.data?.detalles?.length === 2);
  }

  // 4.10 Solicitud inexistente → 404
  res = await request('GET', '/solicitudes-compra/99999', null, adminToken);
  test('GET solicitud inexistente → 404', res.status === 404);

  // 4.11 Aprobar solicitud (Admin — RN-14)
  if (solicitudId) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudId}/aprobar`, { estadoSolicitud: 'APROBADA' }, adminToken);
    test('PATCH /solicitudes-compra/:id/aprobar → APROBADA (RN-14)', res.status === 200 && res.data.data?.estadoSolicitud === 'APROBADA');
  }

  // 4.12 Rechazar solicitud
  if (solicitudIdRechazar) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudIdRechazar}/aprobar`, { estadoSolicitud: 'RECHAZADA', observaciones: 'No prioritario' }, adminToken);
    test('PATCH rechazar solicitud', res.status === 200 && res.data.data?.estadoSolicitud === 'RECHAZADA');
  }

  // 4.13 No reabrir rechazada → 400 (RN-15)
  if (solicitudIdRechazar) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudIdRechazar}/aprobar`, { estadoSolicitud: 'APROBADA' }, adminToken);
    test('Reabrir rechazada → 400 (RN-15)', res.status === 400);
  }

  // 4.14 Almacén NO puede aprobar → 403 (RN-14)
  if (solicitudId) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudId}/aprobar`, { estadoSolicitud: 'RECHAZADA' }, almacenToken);
    test(`Almacén → aprobar solicitud → 403 (RN-14) (status: ${res.status})`, res.status === 403);
  }

  // 4.15 Aprobar solicitud ya aprobada → 400
  if (solicitudId) {
    res = await request('PATCH', `/solicitudes-compra/${solicitudId}/aprobar`, { estadoSolicitud: 'APROBADA' }, adminToken);
    test('Aprobar solicitud ya aprobada → 400', res.status === 400);
  }

  printSection();

  // ═══════════════════════════════════════════════
  // 5. COMPRAS REALIZADAS
  // ═══════════════════════════════════════════════
  console.log('\n💳 COMPRAS REALIZADAS');

  let compraId = null;

  // Guardar stock antes de la compra
  let stockAntes = 0;
  if (insumoId) {
    res = await request('GET', `/insumos/${insumoId}`, null, adminToken);
    stockAntes = Number(res.data.data?.stockActual);
  }

  // 5.1 Registrar compra (Admin — RN-16)
  if (solicitudId && insumoId && insumoId2) {
    res = await request('POST', '/compras-realizadas', {
      idSolicitud: solicitudId,
      fechaCompra: '2024-07-15',
      detalles: [
        { idInsumo: insumoId, cantidadReal: 45, precioUnitario: 13.0 },
        { idInsumo: insumoId2, cantidadReal: 95, precioUnitario: 3.5 },
      ],
    }, adminToken);
    test('POST /compras-realizadas registra compra (RN-16)', res.status === 201);
    compraId = res.data.data?.idCompra;
  }

  // 5.2 Verificar stock incrementado automáticamente (RN-16)
  if (insumoId) {
    res = await request('GET', `/insumos/${insumoId}`, null, adminToken);
    const stockDespues = Number(res.data.data?.stockActual);
    test(`Stock insumo1 incrementado por compra (${stockAntes}+45=${stockAntes + 45})`, stockDespues === stockAntes + 45);
  }

  // 5.3 Verificar stock insumo2 incrementado
  if (insumoId2) {
    res = await request('GET', `/insumos/${insumoId2}`, null, adminToken);
    const stock2 = Number(res.data.data?.stockActual);
    // Insumo2 empezó con 200, +95 de la compra = 295
    test('Stock insumo2 incrementado por compra (200+95=295)', stock2 === 295);
  }

  // 5.4 Doble compra sobre misma solicitud → 400 (RN-17)
  if (solicitudId && insumoId) {
    res = await request('POST', '/compras-realizadas', {
      idSolicitud: solicitudId,
      fechaCompra: '2024-07-16',
      detalles: [{ idInsumo: insumoId, cantidadReal: 1, precioUnitario: 1 }],
    }, adminToken);
    test('Doble compra sobre misma solicitud → 400 (RN-17)', res.status === 400);
  }

  // 5.5 Compra sobre solicitud RECHAZADA → 400
  if (solicitudIdRechazar && insumoId) {
    res = await request('POST', '/compras-realizadas', {
      idSolicitud: solicitudIdRechazar,
      fechaCompra: '2024-07-17',
      detalles: [{ idInsumo: insumoId, cantidadReal: 1, precioUnitario: 1 }],
    }, adminToken);
    test('Compra sobre solicitud RECHAZADA → 400', res.status === 400);
  }

  // 5.6 Compra sobre solicitud inexistente → 404
  res = await request('POST', '/compras-realizadas', {
    idSolicitud: 99999,
    fechaCompra: '2024-07-18',
    detalles: [{ idInsumo: insumoId, cantidadReal: 1, precioUnitario: 1 }],
  }, adminToken);
  test('Compra sobre solicitud inexistente → 404', res.status === 404);

  // 5.7 Sin detalles → 400
  if (solicitudId) {
    res = await request('POST', '/compras-realizadas', { idSolicitud: solicitudId, fechaCompra: '2024-07-19', detalles: [] }, adminToken);
    test('Compra sin detalles → 400', res.status === 400);
  }

  // 5.8 Listar compras (Admin)
  res = await request('GET', '/compras-realizadas', null, adminToken);
  test('GET /compras-realizadas retorna lista', res.status === 200 && Array.isArray(res.data.data));

  // 5.9 Obtener compra por ID
  if (compraId) {
    res = await request('GET', `/compras-realizadas/${compraId}`, null, adminToken);
    test('GET /compras-realizadas/:id retorna compra', res.status === 200 && res.data.data?.idCompra === compraId);
  }

  // 5.10 Verificar movimientos generados automáticamente
  if (insumoId) {
    res = await request('GET', `/insumos/movimientos?idInsumo=${insumoId}`, null, adminToken);
    const movEntradaAuto = res.data.data?.filter(m => m.tipoMovimiento === 'ENTRADA' && m.referenciaCompra != null);
    test('Movimiento ENTRADA automático generado por compra', movEntradaAuto?.length > 0);
  }

  // 5.11 Almacén NO puede crear compra → 403
  if (insumoId) {
    res = await request('POST', '/compras-realizadas', {
      idSolicitud: 1, fechaCompra: '2024-07-20',
      detalles: [{ idInsumo: insumoId, cantidadReal: 1, precioUnitario: 1 }],
    }, almacenToken);
    test('Almacén → POST /compras-realizadas → 403', res.status === 403);
  }

  // 5.12 Almacén NO puede ver compras → 403
  res = await request('GET', '/compras-realizadas', null, almacenToken);
  test('Almacén → GET /compras-realizadas → 403', res.status === 403);

  printSection();

  // ═══════════════════════════════════════════════
  // 6. PERMISOS CRUZADOS (401/403)
  // ═══════════════════════════════════════════════
  console.log('\n🚫 PERMISOS CRUZADOS');

  // 6.1 Sin token → 401
  res = await request('GET', '/insumos');
  test('GET /insumos sin token → 401', res.status === 401);

  res = await request('GET', '/insumos/tipos');
  test('GET /insumos/tipos sin token → 401', res.status === 401);

  res = await request('GET', '/insumos/movimientos');
  test('GET /insumos/movimientos sin token → 401', res.status === 401);

  res = await request('GET', '/solicitudes-compra');
  test('GET /solicitudes-compra sin token → 401', res.status === 401);

  res = await request('GET', '/compras-realizadas');
  test('GET /compras-realizadas sin token → 401', res.status === 401);

  // 6.2 Veterinario NO puede acceder a movimientos → 403
  res = await request('GET', '/insumos/movimientos', null, vetToken);
  test('Veterinario → GET /insumos/movimientos → 403', res.status === 403);

  // 6.3 Producción NO puede ver solicitudes → 403
  res = await request('GET', '/solicitudes-compra', null, prodToken);
  test('Producción → GET /solicitudes-compra → 403', res.status === 403);

  // 6.4 Producción NO puede ver compras → 403
  res = await request('GET', '/compras-realizadas', null, prodToken);
  test('Producción → GET /compras-realizadas → 403', res.status === 403);

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
