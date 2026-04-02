# Auth Done Checklist (SIGGAB Web)

Fecha base: 2026-04-01

## Criterios funcionales
- [x] Login funcional con credenciales validas.
- [x] Consulta de perfil via `/auth/me` con sesion activa.
- [x] Renovacion de access token via `/auth/refresh` al recibir `401`.
- [x] Logout local inmediato + revocacion remota best-effort con `/auth/logout`.
- [x] Mensajes de error definidos para `401`, `403`, `423`.

## Criterios de navegacion y guardas
- [x] Rutas publicas separadas: `#/auth/login`, `#/auth/register`.
- [x] Ruta protegida separada: `#/app`.
- [x] Usuario autenticado no permanece en rutas publicas (redirect a `#/app`).
- [x] Usuario no autenticado no accede a `#/app` (redirect a `#/auth/login`).
- [x] URL canonical por hash al recargar o entrar sin hash.

## Criterios de UX minima
- [x] Estados de carga durante validacion de sesion (`booting`).
- [x] Banner de error visible cuando falla autenticacion.
- [x] Sesion activa visible con acciones de verificar perfil y cerrar sesion.

## Criterios de calidad tecnica
- [x] Build de produccion compila sin errores (`npm run build`).
- [x] Estructura por capas frontend mantenida (`app`, `features`, `shared`, `lib`).
- [x] Componentes de formulario reutilizables (`TextField`, `Button`).

## Referencias de implementacion
- `src/app/app-shell.tsx`
- `src/app/auth-routes.ts`
- `src/features/auth/auth-context.tsx`
- `src/features/auth/components/auth-page.tsx`
- `src/features/auth/components/login-view.tsx`
- `src/features/auth/components/session-view.tsx`
