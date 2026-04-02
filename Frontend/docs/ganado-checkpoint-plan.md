# Checkpoint Siguiente Fase: Modulo Ganado (Frontend)

## Objetivo
Construir el modulo de Ganado en el Frontend con el mismo enfoque que Auth/Usuarios:
- Integracion con backend real
- Validaciones en UI alineadas con backend
- Pruebas E2E desde el primer incremento
- Criterios de cierre claros antes de movernos al siguiente modulo

## Alcance funcional (RF03, RF04, RF15 parcial)
1. Listado de animales con filtros base.
2. Registro de animal con campos obligatorios.
3. Consulta por arete y vista de historial por arete.
4. Edicion de datos permitidos del animal.
5. Baja del animal con motivo y fecha.

## Endpoints backend objetivo
- `GET /animales`
- `GET /animales?estado=ACTIVO`
- `GET /animales/:id`
- `GET /animales/arete/:numero`
- `GET /animales/arete/:numero/historial`
- `POST /animales`
- `PATCH /animales/:id`
- `PATCH /animales/:id/baja`

## Orden recomendado de implementacion (Front)
1. Vista `GanadoListPage`:
   - tabla/lista
   - filtros por estado y raza
   - estados de carga/error
2. Form `CrearAnimalForm`:
   - validacion UI previa
   - alta con feedback de exito/error
3. Busqueda por arete:
   - detalle rapido (`/arete/:numero`)
   - historial completo (`/arete/:numero/historial`)
4. Edicion y baja:
   - `PATCH /animales/:id`
   - `PATCH /animales/:id/baja` con confirmacion

## Estrategia de pruebas (replicada)
- E2E Playwright (checkpoint Ganado):
  1. crear animal exitoso
  2. evitar arete duplicado (error 409/400 segun API)
  3. editar animal (admin)
  4. baja de animal y bloqueo de operaciones posteriores
  5. consulta historial por arete
  6. permisos por rol (403 en acciones no permitidas)
- Contrato de selectores:
  - definir `data-testid` estables en componentes de ganado
  - agregar esos IDs a `scripts/verify-testids.js`

## Criterio de "Ganado Done"
- Endpoints del alcance conectados y validados.
- E2E de Ganado en verde en local y CI.
- Errores HTTP mapeados en UI (`400`, `401`, `403`, `404`, `409`).
- Documentacion del modulo agregada en `Frontend/docs/`.

## Estado actual (2026-04-01)
- Integracion inicial completada en `#/app/ganado` con backend real:
  - alta (`POST /animales`)
  - listado con filtros (`GET /animales`)
  - busqueda por arete (`GET /animales/arete/:numero`)
  - historial por arete (`GET /animales/arete/:numero/historial`)
  - edicion (`PATCH /animales/:id`)
  - baja (`PATCH /animales/:id/baja`)
- E2E de checkpoint habilitado y en verde junto con Auth/Usuarios.
