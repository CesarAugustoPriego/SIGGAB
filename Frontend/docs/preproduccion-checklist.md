# SIGGAB - Checklist de Preproduccion Web

## Objetivo
Usar este checklist como gate obligatorio para congelar el release web antes de iniciar la fase movil.

## Gate obligatorio (bloqueante)
- [x] Sidebar de modulos filtrada por rol en todas las vistas de modulo.
- [x] `Respaldos` visible y operativo solo para `Administrador` (ruta, UI y endpoint).
- [x] `Aprobaciones` alineado a permisos reales por flujo:
  - Sanitario: `Medico Veterinario`.
  - Productivo: `Administrador`.
  - Solicitudes de compra: `Administrador`.
- [x] `Dashboard` alineado a matriz funcional (`Propietario` y `Administrador`).
- [x] RF14 cerrado: `Propietario` y `Administrador` pueden consultar bitacora (`/dashboard/bitacora`) y abrir vista de auditoria.
- [x] Smoke E2E por rol completo en verde (`npm run test:e2e:roles-smoke`).
- [x] Build de frontend en verde (`npm run build`).
- [x] E2E de release web en verde (`npm run test:e2e:release-web`).

## Comando oficial de gate
`npm run preprod:gate`

## Estado funcional RF (web)
- RF01 Autenticacion: Implementado.
- RF02 Gestion de usuarios y roles: Implementado.
- RF03 Registro y gestion de animal: Implementado.
- RF04 Escaneo de arete: Parcial en web (captura de escaneo fisico queda para movil).
- RF05 Gestion sanitaria: Implementado.
- RF06 Calendario sanitario: Implementado.
- RF07 Gestion productiva: Implementado.
- RF08 Inventario: Implementado.
- RF09 Reportes sanitarios/productivos/administrativos: Implementado.
- RF10 Dashboard ejecutivo: Implementado.
- RF11 Respaldo automatico/manual y descarga: Implementado.
- RF12 Validacion de registros: Implementado.
- RF13 Analisis historico comparativo: Implementado.
- RF14 Consulta de bitacora de auditoria: Implementado.
- RF15 Modificacion de registros segun rol: Implementado.

## Backlog no bloqueante (pulido final)
- Revisar textos con codificacion heredada en algunos labels/mensajes.
- Homologar tono de mensajes de error y vacios entre modulos.
