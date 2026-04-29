-- Eliminar el flujo de lotes de validacion productiva.
-- Los registros productivos se validan individualmente por estado_validacion.

ALTER TABLE "registro_peso" DROP CONSTRAINT IF EXISTS "registro_peso_id_lote_fkey";
ALTER TABLE "produccion_leche" DROP CONSTRAINT IF EXISTS "produccion_leche_id_lote_fkey";
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT IF EXISTS "eventos_reproductivos_id_lote_fkey";
ALTER TABLE "lote_validacion_productiva" DROP CONSTRAINT IF EXISTS "lote_validacion_productiva_creado_por_fkey";

DROP INDEX IF EXISTS "registro_peso_id_lote_idx";
DROP INDEX IF EXISTS "produccion_leche_id_lote_idx";
DROP INDEX IF EXISTS "eventos_reproductivos_id_lote_idx";
DROP INDEX IF EXISTS "idx_reg_peso_lote";
DROP INDEX IF EXISTS "idx_prod_leche_lote";
DROP INDEX IF EXISTS "idx_evt_repro_lote";

ALTER TABLE "registro_peso" DROP COLUMN IF EXISTS "id_lote";
ALTER TABLE "produccion_leche" DROP COLUMN IF EXISTS "id_lote";
ALTER TABLE "eventos_reproductivos" DROP COLUMN IF EXISTS "id_lote";

DROP TABLE IF EXISTS "lote_validacion_productiva";
