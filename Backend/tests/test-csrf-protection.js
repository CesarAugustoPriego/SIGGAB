/**
 * SIGGAB - Pruebas CSRF con proteccion habilitada.
 * Requiere arrancar API con:
 * ENABLE_CSRF_PROTECTION=true
 * CSRF_TOKEN=<token>
 * CSRF_HEADER_NAME=x-csrf-token
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const CSRF_HEADER_NAME = process.env.TEST_CSRF_HEADER_NAME || 'x-csrf-token';
const CSRF_TOKEN = process.env.TEST_CSRF_TOKEN || 'siggab_csrf_token_super_seguro_2026';

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

async function request(method, route, { body, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined && body !== null) finalHeaders['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

async function main() {
  console.log('==============================================');
  console.log(' SIGGAB - CSRF Protection Suite');
  console.log('==============================================');

  let res = await request('GET', '/health', {
    headers: { Cookie: 'sid=fake-session' },
  });
  test('GET /health no requiere CSRF aunque haya cookie', res.status === 200, `status=${res.status}`);

  res = await request('POST', '/auth/login', {
    body: { username: 'admin', password: 'SiggabAdmin2026!' },
  });
  test('POST /auth/login sin cookie sigue permitido', res.status === 200, `status=${res.status}`);

  res = await request('POST', '/auth/login', {
    body: { username: 'admin', password: 'SiggabAdmin2026!' },
    headers: { Cookie: 'sid=fake-session' },
  });
  test(
    'POST /auth/login con cookie y sin CSRF token es bloqueado',
    res.status === 403 && typeof res.data?.message === 'string' && res.data.message.toLowerCase().includes('csrf'),
    `status=${res.status}`
  );

  res = await request('POST', '/auth/login', {
    body: { username: 'admin', password: 'SiggabAdmin2026!' },
    headers: {
      Cookie: 'sid=fake-session',
      [CSRF_HEADER_NAME]: 'token-incorrecto',
    },
  });
  test('POST /auth/login con CSRF token incorrecto es bloqueado', res.status === 403, `status=${res.status}`);

  res = await request('POST', '/auth/login', {
    body: { username: 'admin', password: 'SiggabAdmin2026!' },
    headers: {
      Cookie: 'sid=fake-session',
      [CSRF_HEADER_NAME]: CSRF_TOKEN,
    },
  });
  test('POST /auth/login con CSRF valido es permitido', res.status === 200, `status=${res.status}`);

  console.log('\nResumen CSRF');
  console.log(`Total: ${passed + failed}`);
  console.log(`OK: ${passed}`);
  console.log(`FAIL: ${failed}`);

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Error ejecutando suite CSRF:', error);
  process.exit(1);
});
