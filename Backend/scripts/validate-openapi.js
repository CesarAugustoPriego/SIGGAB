const swaggerSpec = require('../src/config/swagger');

const requiredOperations = [
  ['post', '/auth/login'],
  ['post', '/auth/refresh'],
  ['post', '/auth/logout'],
  ['get', '/auth/me'],
  ['get', '/usuarios'],
  ['post', '/usuarios'],
  ['get', '/animales'],
  ['post', '/animales'],
  ['get', '/animales/arete/{numero}/historial'],
  ['get', '/eventos-sanitarios'],
  ['patch', '/eventos-sanitarios/{id}/aprobar'],
  ['get', '/calendario-sanitario/alertas'],
  ['get', '/lotes-productivos'],
  ['patch', '/lotes-productivos/{id}/validar'],
  ['get', '/registros-peso'],
  ['patch', '/registros-peso/{id}/validar'],
  ['get', '/produccion-leche'],
  ['patch', '/produccion-leche/{id}/validar'],
  ['get', '/eventos-reproductivos'],
  ['patch', '/eventos-reproductivos/{id}/validar'],
  ['get', '/insumos'],
  ['get', '/insumos/movimientos'],
  ['get', '/solicitudes-compra'],
  ['post', '/compras-realizadas'],
  ['get', '/dashboard/resumen'],
  ['get', '/dashboard/stream'],
  ['get', '/reportes/sanitario'],
  ['get', '/reportes/productivo'],
  ['get', '/reportes/administrativo'],
  ['get', '/reportes/comparativo'],
  ['get', '/respaldos'],
  ['post', '/respaldos/ejecutar'],
  ['get', '/respaldos/{fileName}/descargar'],
];

function fail(message) {
  throw new Error(message);
}

function assertBasicSpec(spec) {
  if (!spec || typeof spec !== 'object') fail('Spec invalida: no es objeto');
  if (!String(spec.openapi || '').startsWith('3.')) fail('Spec invalida: openapi debe ser 3.x');
  if (!spec.info || !spec.info.title || !spec.info.version) fail('Spec invalida: info.title/info.version requeridos');
  if (!spec.paths || typeof spec.paths !== 'object') fail('Spec invalida: paths faltante');
}

function assertOperations(spec) {
  for (const [method, routePath] of requiredOperations) {
    const pathItem = spec.paths[routePath];
    if (!pathItem) fail(`Falta path requerido: ${routePath}`);
    if (!pathItem[method]) fail(`Falta metodo requerido: ${method.toUpperCase()} ${routePath}`);
  }
}

function assertLockoutResponses(spec) {
  const login = spec.paths['/auth/login']?.post;
  const refresh = spec.paths['/auth/refresh']?.post;

  if (!login?.responses?.['423']) {
    fail('Falta respuesta 423 en POST /auth/login (lockout RF01)');
  }

  if (!refresh?.responses?.['423']) {
    fail('Falta respuesta 423 en POST /auth/refresh (lockout RF01)');
  }
}

function assertReportFormats(spec, pathKey) {
  const operation = spec.paths[pathKey]?.get;
  const content = operation?.responses?.['200']?.content || {};
  if (!content['application/json']) fail(`Falta content application/json en ${pathKey}`);
  if (!content['text/csv']) fail(`Falta content text/csv en ${pathKey}`);
  if (!content['application/pdf']) fail(`Falta content application/pdf en ${pathKey}`);
}

function assertReportes(spec) {
  assertReportFormats(spec, '/reportes/sanitario');
  assertReportFormats(spec, '/reportes/productivo');
  assertReportFormats(spec, '/reportes/administrativo');
  assertReportFormats(spec, '/reportes/comparativo');
}

function countOperations(spec) {
  let total = 0;
  for (const pathItem of Object.values(spec.paths)) {
    total += Object.keys(pathItem).filter((key) => ['get', 'post', 'put', 'patch', 'delete'].includes(key)).length;
  }
  return total;
}

try {
  assertBasicSpec(swaggerSpec);
  assertOperations(swaggerSpec);
  assertLockoutResponses(swaggerSpec);
  assertReportes(swaggerSpec);

  const pathCount = Object.keys(swaggerSpec.paths).length;
  const operationCount = countOperations(swaggerSpec);

  console.log(`OpenAPI valida: ${pathCount} paths, ${operationCount} operaciones.`);
} catch (error) {
  console.error(`Validacion OpenAPI fallida: ${error.message}`);
  process.exit(1);
}
