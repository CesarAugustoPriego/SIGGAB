# SIGGAB Backend Contract Handoff

## 1. Reglas de consumo
- Base URL local: `http://localhost:3000/api`
- Auth: `Authorization: Bearer <accessToken>`
- Formato estandar de respuesta:
  - exito: `{ success: true, data, message, errors: null }`
  - error: `{ success: false, data: null, message, errors }`

## 2. Flujo de autenticacion
1. `POST /auth/login` -> recibe `accessToken` y `refreshToken`.
2. `GET /auth/me` -> perfil del usuario logueado.
3. `POST /auth/refresh` -> renueva `accessToken`.
4. `POST /auth/logout` -> revoca `refreshToken`.

## 3. Endpoints priorizados para Front (Fase 1-2)
- Usuarios y roles: `/usuarios`, `/usuarios/roles`.
- Ganado: `/animales`, `/animales/:id`, `/animales/arete/:numero`, `/animales/:id/baja`.
- Escaneo/historial: `/animales/arete/:numero/historial`.
- Sanitario: `/eventos-sanitarios`, `/eventos-sanitarios/:id/aprobar`, `/calendario-sanitario`.
- Productivo: `/lotes-productivos`, `/registros-peso`, `/produccion-leche`, `/eventos-reproductivos`.
- Inventario: `/insumos`, `/insumos/tipos`, `/insumos/movimientos`.
- Compras: `/solicitudes-compra`, `/solicitudes-compra/:id/aprobar`, `/compras-realizadas`.

## 4. Endpoints de Fase 3
- Dashboard tiempo real:
  - `GET /dashboard/stream` (SSE, roles Propietario/Administrador).
  - `GET /dashboard/bitacora` (roles Propietario/Administrador).
- Reportes configurables:
  - `GET /reportes/sanitario?fechaInicio&fechaFin&formato=json|csv|pdf`
  - `GET /reportes/productivo?fechaInicio&fechaFin&idAnimal&idLote&formato=json|csv|pdf`
  - `GET /reportes/administrativo?fechaInicio&fechaFin&formato=json|csv|pdf`
  - `GET /reportes/comparativo?modulo&periodoAInicio&periodoAFin&periodoBInicio&periodoBFin&formato=json|csv|pdf`
- Respaldos:
  - `GET /respaldos` (Administrador)
  - `POST /respaldos/ejecutar` (Administrador)
  - `GET /respaldos/{fileName}/descargar` (Administrador)

## 5. Codigos de error funcionales esperados
- `400`: validacion Zod o regla de negocio.
- `401`: no autenticado o token invalido/revocado/expirado.
- `403`: rol sin permiso.
- `423`: cuenta bloqueada temporalmente por intentos fallidos (RF01).
- `404`: recurso no encontrado.
- `409`: conflicto de unicidad.
- `500`: error interno no controlado.

## 6. Seguridad aplicada para Front
- Sanitizacion automatica de entrada en backend.
- Politica CSRF configurable por entorno (`ENABLE_CSRF_PROTECTION`).
- Lockout de autenticacion tras 5 intentos fallidos consecutivos (RF01).
- Bitacora de operaciones criticas y reportes consultados.

## 7. Criterio de backend "listo para front"
- Pruebas E2E base: `tests/test-endpoints.js` (Fase 1 + Fase 2).
- Pruebas E2E de cierre: `tests/test-fase3-hardening.js` (reportes, respaldos, SSE, permisos productivos, bitacora).
- Pruebas de seguridad CSRF: `tests/test-csrf-protection.js` con servidor en modo CSRF habilitado.
- CI backend: `.github/workflows/backend-ci.yml` ejecuta suites funcionales y de seguridad.

## 8. Operacion de respaldos para soporte
- Runbook: `docs/operacion-respaldos.md`.
- Politica vigente: restauracion **solo por CLI** (sin endpoint HTTP de restore en esta fase).
- Restauracion CLI:
  - Preview sin cambios: `npm run backup:restore -- <archivo> preview`
  - Ejecucion real: `npm run backup:restore -- <archivo> force`

## 9. Contrato OpenAPI final para Front
- Archivo congelado para consumo: `docs/openapi-final.json`.
- Generacion local del contrato:
  - `npm run openapi:generate`
- Validacion automatica del contrato:
  - `npm run openapi:validate`
- El CI backend ejecuta ambos pasos para evitar que endpoints o codigos de error se desalineen.
- Plan operativo de siguiente fase: `docs/plan-fase-front-integracion.md`.
