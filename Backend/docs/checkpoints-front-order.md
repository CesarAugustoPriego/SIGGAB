# SIGGAB - Orden de checkpoints para construir Front

Este documento define el orden recomendado de trabajo endpoint por endpoint,
con validacion del backend antes de avanzar de bloque.

## Checkpoint 1 - Auth (actual)
- Endpoints:
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- Prueba automatica:
  - `npm run test:checkpoint:auth`
- Criterio de salida:
  - Login/refresh/logout estables
  - Manejo de errores 400/401 listo para Front
  - Flujo de token probado

## Checkpoint 2 - Usuarios y roles
- Endpoints:
  - `GET /usuarios/roles`
  - `GET /usuarios`
  - `POST /usuarios`
  - `GET /usuarios/:id`
  - `PATCH /usuarios/:id`
  - `PATCH /usuarios/:id/estado`
- Criterio de salida:
  - CRUD administrativo estable
  - Permisos por rol validados (403)

## Checkpoint 3 - Ganado base
- Endpoints:
  - `GET /razas`
  - `GET /animales`
  - `POST /animales`
  - `GET /animales/:id`
  - `GET /animales/arete/:numero`
  - `PATCH /animales/:id`
  - `PATCH /animales/:id/baja`
  - `GET /animales/arete/:numero/historial`
- Criterio de salida:
  - Registro y consulta de animales sin friccion
  - Flujo de escaneo/historial listo para UI movil

## Checkpoint 4 - Sanitario
- Endpoints:
  - `GET /eventos-sanitarios/tipos`
  - `GET /eventos-sanitarios`
  - `POST /eventos-sanitarios`
  - `PATCH /eventos-sanitarios/:id`
  - `PATCH /eventos-sanitarios/:id/aprobar`
  - `GET /calendario-sanitario`
  - `GET /calendario-sanitario/alertas`
  - `POST /calendario-sanitario`
  - `PATCH /calendario-sanitario/:id`
  - `PATCH /calendario-sanitario/:id/completar`

## Checkpoint 5 - Dashboard base
- Endpoints:
  - `GET /dashboard/resumen`
  - `GET /dashboard/ganado`
  - `GET /dashboard/produccion`
  - `GET /dashboard/sanitario`
  - `GET /dashboard/inventario`
  - `GET /dashboard/bitacora` (Administrador / Propietario)

## Checkpoint 6 - Productivo operativo
- Endpoints:
  - Lotes, peso, leche y reproductivos (CRUD + validar)

## Checkpoint 7 - Inventario y compras
- Endpoints:
  - Insumos, tipos, movimientos
  - Solicitudes y compras realizadas

## Checkpoint 8 - Fase 3 avanzada
- Endpoints:
  - Reportes (`json/csv/pdf`)
  - Dashboard stream (`SSE`)
  - Respaldos

## Regla de trabajo
1. Implementar/cerrar backend del checkpoint.
2. Ejecutar prueba automatica del checkpoint.
3. Compartir checklist de prueba manual para Front.
4. Avanzar al siguiente checkpoint solo cuando lo valides.
