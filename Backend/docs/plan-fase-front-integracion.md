# SIGGAB - Plan de siguiente fase (Integracion Front)

## Objetivo
Iniciar desarrollo Front sin friccion sobre modulos ya estables (Fase 1 y Fase 2), mientras se cierra Fase 3 avanzada en paralelo.

## Entregables de entrada
- Contrato API: `docs/openapi-final.json`
- Guia de consumo: `docs/front-handoff-contract.md`
- Backend CI con validacion OpenAPI: `.github/workflows/backend-ci.yml`

## Fase A - Arranque Front (Semana 1)
1. Configurar cliente API compartido (web y movil) con:
   - base URL por entorno
   - interceptor JWT (access + refresh)
   - manejo de errores estandar (400/401/403/423/409)
2. Implementar pantallas base:
   - Login + bloqueo temporal (423)
   - Dashboard resumen
   - Layout por rol
3. Conectar modulos MVP:
   - Usuarios/Roles (admin)
   - Animales (incluye historial por arete)
   - Eventos y calendario sanitario

## Fase B - Operativo Front (Semana 2)
1. Productivo:
   - Lotes, peso, leche, eventos reproductivos
   - Flujos de validacion por rol (admin)
2. Inventario y compras:
   - Tipos, insumos, movimientos
   - Solicitudes, aprobacion, compras realizadas
3. Pruebas E2E front-back por rol

## Fase C - Cierre avanzado (Semana 3)
1. Reportes exportables (json/csv/pdf)
2. Dashboard stream SSE (`/dashboard/stream`)
3. Respaldos (pantalla admin) y bitacora consultable

## Criterio de salida
- 100% flujos Fase 1 y Fase 2 navegables en Front
- Errores funcionales manejados visualmente por codigo HTTP
- Smoke test por rol completado y documentado
- Sin cambios pendientes de contrato OpenAPI
