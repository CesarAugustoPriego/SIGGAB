# Acta de Congelamiento - Modulo Auth Web

Fecha: 2026-04-01
Modulo: Autenticacion (Frontend Web)
Proyecto: SIGGAB

## Alcance congelado
- Login conectado a backend.
- Lectura de perfil de sesion (`/auth/me`).
- Renovacion de token por refresh (`/auth/refresh`) desde cliente HTTP.
- Cierre de sesion (`/auth/logout`) con limpieza local inmediata.
- Guardas de ruta public/protected por hash.
- Manejo de mensajes para `401`, `403`, `423`.

## Evidencia tecnica
- Build OK: `npm run build`.
- Checklist completado: `docs/auth-done-checklist.md`.
- Casos manuales definidos: `docs/auth-manual-test.md`.

## Decision
Se declara el modulo **cerrado tecnicamente** para continuar con el siguiente bloque (Usuarios y Roles), sujeto a validacion manual final en ambiente local.

## Cambios fuera de alcance de este freeze
- Registro real de usuarios desde frontend (actualmente mock visual).
- Recuperacion de contrasena.
- MFA/seguridad adicional.
