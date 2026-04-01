const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const ADMIN_USER = process.env.CHECKPOINT_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.CHECKPOINT_ADMIN_PASS || 'SiggabAdmin2026!';

let passed = 0;
let failed = 0;

function logPass(message) {
  passed += 1;
  console.log(`[OK] ${message}`);
}

function logFail(message, details = '') {
  failed += 1;
  console.log(`[FAIL] ${message}${details ? ` - ${details}` : ''}`);
}

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function expect(condition, okMessage, failMessage) {
  if (condition) {
    logPass(okMessage);
  } else {
    logFail(failMessage);
  }
}

async function main() {
  console.log('==============================================');
  console.log(' SIGGAB - Checkpoint Auth (Front Order #1)');
  console.log('==============================================');
  console.log(`BASE: ${BASE}`);

  let accessToken = '';
  let refreshToken = '';

  // 1) Login correcto
  let res = await request('POST', '/auth/login', {
    username: ADMIN_USER,
    password: ADMIN_PASS,
  });

  expect(
    res.status === 200 && Boolean(res.payload?.data?.accessToken) && Boolean(res.payload?.data?.refreshToken),
    'POST /auth/login devuelve accessToken y refreshToken',
    `POST /auth/login esperado 200, recibido ${res.status}`
  );

  accessToken = res.payload?.data?.accessToken || '';
  refreshToken = res.payload?.data?.refreshToken || '';

  // 2) Perfil autenticado
  res = await request('GET', '/auth/me', null, accessToken);
  expect(
    res.status === 200 && res.payload?.data?.username === ADMIN_USER,
    'GET /auth/me devuelve perfil del usuario',
    `GET /auth/me esperado 200, recibido ${res.status}`
  );

  // 3) Perfil sin token
  res = await request('GET', '/auth/me');
  expect(
    res.status === 401,
    'GET /auth/me sin token es rechazado (401)',
    `GET /auth/me sin token esperado 401, recibido ${res.status}`
  );

  // 4) Refresh token correcto
  res = await request('POST', '/auth/refresh', { refreshToken });
  expect(
    res.status === 200 && Boolean(res.payload?.data?.accessToken),
    'POST /auth/refresh renueva accessToken',
    `POST /auth/refresh esperado 200, recibido ${res.status}`
  );

  const refreshedAccessToken = res.payload?.data?.accessToken || accessToken;

  // 5) Logout y revocacion de refresh
  res = await request('POST', '/auth/logout', { refreshToken }, refreshedAccessToken);
  expect(
    res.status === 200,
    'POST /auth/logout cierra sesion',
    `POST /auth/logout esperado 200, recibido ${res.status}`
  );

  res = await request('POST', '/auth/refresh', { refreshToken });
  expect(
    res.status === 401,
    'POST /auth/refresh rechaza token revocado (401)',
    `POST /auth/refresh token revocado esperado 401, recibido ${res.status}`
  );

  // 6) Login incorrecto
  res = await request('POST', '/auth/login', {
    username: ADMIN_USER,
    password: 'wrong-password',
  });
  expect(
    res.status === 401,
    'POST /auth/login con credenciales invalidas responde 401',
    `POST /auth/login invalido esperado 401, recibido ${res.status}`
  );

  // 7) Login sin payload valido
  res = await request('POST', '/auth/login', {});
  expect(
    res.status === 400,
    'POST /auth/login sin payload valido responde 400',
    `POST /auth/login sin payload esperado 400, recibido ${res.status}`
  );

  console.log('----------------------------------------------');
  console.log(`Total: ${passed + failed}`);
  console.log(`OK: ${passed}`);
  console.log(`FAIL: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error ejecutando checkpoint auth:', error.message);
  process.exit(1);
});
