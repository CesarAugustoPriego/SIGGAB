# Contrato E2E de `data-testid`

Este documento congela los selectores criticos usados por Playwright para evitar pruebas fragiles.

## Regla
- No renombrar ni eliminar estos `data-testid` sin actualizar:
  - `tests/e2e/*.spec.ts`
  - `scripts/verify-testids.js`

## Auth
- Archivo: `src/features/auth/components/login-view.tsx`
  - `login-username-input`
  - `login-password-input`
  - `login-submit-button`
  - `login-error-banner`

- Archivo: `src/features/auth/components/session-view.tsx`
  - `session-refresh-button`
  - `session-users-button`
  - `session-logout-button`
  - `session-success-banner`

## Usuarios
- Archivo: `src/features/users/components/users-admin-page.tsx`
  - `users-admin-header`
  - `users-sidebar-logout-button`
  - `users-form-nombre-completo`
  - `users-form-username`
  - `users-form-id-rol`
  - `users-form-password`
  - `users-form-save-button`
  - `users-form-message`
  - `users-list`
  - Prefijos dinamicos:
    - `users-list-item-<id>`
    - `users-edit-button-<id>`
    - `users-toggle-button-<id>`
    - `users-nav-<modulo>`

## Ganado
- Archivo: `src/features/ganado/components/ganado-admin-page.tsx`
  - `ganado-admin-header`
  - `input-arete`
  - `input-fecha`
  - `input-peso`
  - `input-edad`
  - `select-raza`
  - `input-procedencia`
  - `input-sanitario`
  - `btn-submit`
  - `input-buscar-arete`
  - `btn-buscar`
  - `filter-estado`
  - `filter-raza`
  - `filter-arete`
  - `btn-limpiar-filtros`
  - `select-motivo`
  - `input-baja-fecha`
  - `btn-confirmar-baja`
  - Prefijos dinamicos:
    - `card-<arete>`
    - `btn-editar-<arete>`
    - `btn-baja-<arete>`
    - `btn-historial-<arete>`

## Validacion automatica
- Comando: `npm run test:e2e:contract`
- Este comando corre antes de `npm run test:e2e` y falla si el contrato se rompe.
