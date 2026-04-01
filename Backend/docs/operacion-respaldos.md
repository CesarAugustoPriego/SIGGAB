# Operacion de Respaldos (SIGGAB Backend)

## 1. Objetivo
Documentar el ciclo de respaldo y restauracion de datos del backend SIGGAB para pruebas controladas y recuperacion operativa.

## 2. Generar respaldo manual
Endpoint:
- `POST /api/respaldos/ejecutar` (solo rol `Administrador`)

Respuesta esperada:
- `201` con `fileName`, `filePath`, `generatedAt`, `source`.

Carpeta de salida:
- `BACKUP_DIR` en entorno (default: `backups`).

Opcional (RF10 nube):
- `BACKUP_CLOUD_ENABLED=true`
- `BACKUP_CLOUD_UPLOAD_URL=https://.../objeto/{filename}`
- `BACKUP_CLOUD_AUTH_TOKEN=<token-opcional>`

Cuando la subida en nube esta habilitada, el backend realiza `PUT` del JSON al endpoint configurado tras cada respaldo.

## 3. Listar respaldos disponibles
Endpoint:
- `GET /api/respaldos` (solo rol `Administrador`)

Retorna archivos ordenados por fecha descendente.

## 4. Restaurar respaldo (script CLI)
Comando:

```bash
npm run backup:restore -- backups/siggab-backup-YYYY-MM-DDTHH-mm-ss-sssZ.json preview
```

Dry run:
- valida estructura del archivo
- muestra conteo por tabla
- no modifica base de datos

Nota:
- Si no envias `preview` ni `force`, el script se ejecuta en modo seguro (preview) por defecto.
- Tambien puedes ejecutar el script directo:
  - `node scripts/restore-backup.js --file <archivo> --preview`

Ejecucion real (destructiva):

```bash
npm run backup:restore -- backups/siggab-backup-YYYY-MM-DDTHH-mm-ss-sssZ.json force
```

Reglas de seguridad:
- Sin `force` el script no aplica cambios.
- La restauracion elimina datos actuales y reemplaza por el contenido del backup.
- Incluye reseteo de secuencias `SERIAL` para evitar colisiones de IDs posteriores.

## 5. Tablas incluidas en respaldo/restauracion
- `roles`
- `usuarios`
- `bitacora`
- `razas`
- `animales`
- `tipos_evento_sanitario`
- `eventos_sanitarios`
- `calendario_sanitario`
- `lote_validacion_productiva`
- `registro_peso`
- `produccion_leche`
- `eventos_reproductivos`
- `tipos_insumo`
- `insumos`
- `solicitudes_compra`
- `detalle_solicitud_compra`
- `compras_realizadas`
- `detalle_compra`
- `movimientos_inventario`

## 6. Consideraciones operativas
- No ejecutar restauracion en produccion sin ventana de mantenimiento.
- Antes de restaurar, guardar un respaldo adicional del estado actual.
- Verificar `DATABASE_URL` del entorno activo antes del comando.
- Si se usa nube, validar conectividad y permisos del endpoint antes de habilitar scheduler automatico.
