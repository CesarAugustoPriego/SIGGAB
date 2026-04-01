# Alineacion Prompt vs Prisma (SIGGAB)

## Objetivo
Congelar una fuente de verdad funcional antes del handoff completo a Front, sin resetear la base de datos.

## Decisiones cerradas (Sprint 1)
1. `refresh_tokens` se mantiene como extension aprobada.
- Justificacion: el prompt exige refresh token en Fase 1 de autenticacion.
- Estado: aplicado en runtime y documentado.

2. `usuarios.estado`.
- Accion: se alineo el nombre de columna a `estado` respetando el diccionario.
- Implementacion: Prisma conserva el campo de codigo `activo` con `@map("estado")`.
- Estado: aplicado (migracion `0002_align_prompt_columns_and_models`).

3. `bitacora.fecha_accion`.
- Accion: se alineo la columna a `fecha_accion` (antes `fecha_hora`).
- Implementacion: Prisma mantiene `fechaHora` en codigo con `@map("fecha_accion")`.
- Estado: aplicado (migracion `0002_align_prompt_columns_and_models`).

4. `DetalleSolicitudCompra` (modelo Prisma).
- Accion: se corrigio typo de modelo `DetalleeSolicitudCompra` -> `DetalleSolicitudCompra`.
- Impacto: no cambia tablas ni columnas, solo claridad en codigo.
- Estado: aplicado.

5. Campos operativos adicionales se mantienen como extensiones controladas.
- `animales.motivo_baja`, `animales.fecha_baja` (RN-08).
- `movimientos_inventario.registrado_por` (trazabilidad).
- banderas `activo` en catalogos (`razas`, `tipos_evento_sanitario`, `tipos_insumo`).
- Estado: se mantienen para no romper comportamiento funcional actual.

## Estrategia de migracion aplicada
- Se creo baseline de migraciones para no usar `reset`:
  - `0001_baseline` (marcada como aplicada con `prisma migrate resolve`).
- Se aplico migracion incremental no destructiva:
  - `0002_align_prompt_columns_and_models`.
- Se agrego soporte de lockout de autenticacion:
  - `0003_auth_lockout_support` (`usuarios.intentos_fallidos`, `usuarios.bloqueado_hasta`).
- Verificacion esperada: `prisma migrate status` -> `Database schema is up to date`.

## Cierre adicional de backend (Sprint 2-3)
- Reportes configurables activos: `/reportes/sanitario`, `/reportes/productivo`, `/reportes/administrativo`, `/reportes/comparativo`.
- Exportaciones de reportes: `json`, `csv`, `pdf`.
- Escaneo/historial por arete: `/animales/arete/:numero/historial`.
- Lockout automatico en auth tras 5 intentos fallidos consecutivos (RF01).
- Dashboard con stream SSE activo: `/dashboard/stream`.
- Respaldos activos:
  - `GET /respaldos`
  - `POST /respaldos/ejecutar`
- Runbook y restauracion CLI agregados:
  - `docs/operacion-respaldos.md`
  - `scripts/restore-backup.js`
- Respaldo ampliado para incluir `bitacora` en el payload.
- Respaldo con opcion de subida a nube por `BACKUP_CLOUD_UPLOAD_URL`.

## Validacion automatizada de cierre
- Suite base: `tests/test-endpoints.js`.
- Suite de cierre: `tests/test-fase3-hardening.js`.
- Suite CSRF en modo protegido: `tests/test-csrf-protection.js`.
- Pipeline: `.github/workflows/backend-ci.yml` ejecuta las tres validaciones (funcional + seguridad).

## Pendiente de gobierno de datos (siguiente paso recomendado)
- Versionar diccionario v2 para reflejar explicitamente las extensiones aprobadas.
