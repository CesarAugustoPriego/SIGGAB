# SIGGAB Frontend

Frontend web de SIGGAB con foco actual en autenticacion y gestion de usuarios/roles.

## Estado actual
- Auth implementado con backend real (`/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`).
- Guardas de ruta activas sin librerias extra:
  - Publicas: `#/auth/login`, `#/auth/register`
  - Protegidas: `#/app`, `#/app/usuarios`
- Manejo de errores mapeado por estado:
  - `401`: credenciales invalidas o sesion expirada
  - `403`: rol sin permisos
  - `423`: cuenta bloqueada temporalmente
- RF02 (Usuarios/Roles) conectado a backend real:
  - `GET /usuarios/roles`
  - `GET /usuarios`
  - `POST /usuarios`
  - `PATCH /usuarios/:id`
  - `PATCH /usuarios/:id/estado`
- Ganado (RF03/RF04 web/RF15 parcial) conectado a backend real:
  - `GET /razas`
  - `GET /animales`
  - `GET /animales/arete/:numero`
  - `GET /animales/arete/:numero/historial`
  - `POST /animales`
  - `PATCH /animales/:id`
  - `PATCH /animales/:id/baja`

## Arquitectura base reusable
- `src/app/`: shell y enrutado/guardas.
- `src/features/auth/`: contexto, API y pantallas de auth.
- `src/features/users/`: modulo de gestion de usuarios y roles (Admin).
- `src/shared/ui/`: componentes reutilizables (`Button`, `TextField`).
- `src/lib/`: cliente HTTP + almacenamiento de sesion.

## Requisitos
- Backend en `http://localhost:3000`.
- Node.js `22.15.0`.

## Configuracion
1. Copia `.env.example` a `.env`.
2. Ajusta `VITE_API_BASE_URL` si aplica.

## Ejecucion
```bash
npm install
npm run dev
```

## Pruebas E2E de Frontend (Playwright)
```bash
npm run test:e2e
```

Scripts utiles:
- `npm run test:e2e:contract`: valida contrato de `data-testid` criticos.
- `npm run test:e2e`: corre el suite E2E en headless.
- `npm run test:e2e:headed`: corre E2E con navegador visible.
- `npm run test:e2e:ui`: abre el panel interactivo de Playwright.

Variables opcionales para pruebas:
- `E2E_ADMIN_USERNAME` (default: `admin`)
- `E2E_ADMIN_PASSWORD` (default: `SiggabAdmin2026!`)
- `E2E_BACKEND_PORT` (default: `3000`)
- `E2E_FRONTEND_PORT` (default: `4173`)
- `E2E_API_BASE_URL` (default: `http://127.0.0.1:<backend>/api`)

## Evidencia de cierre Auth
- Checklist y criterios: `docs/auth-done-checklist.md`
- Prueba manual completa: `docs/auth-manual-test.md`
- Acta de congelamiento: `docs/auth-module-freeze.md`
- Contrato de selectores E2E: `docs/e2e-testid-contract.md`
- Plan del siguiente checkpoint (Ganado): `docs/ganado-checkpoint-plan.md`
