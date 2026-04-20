-- Permitir registrar eventos reproductivos sin asociarlos a un lote de validacion.
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT IF EXISTS "eventos_reproductivos_id_lote_fkey";

ALTER TABLE "eventos_reproductivos"
  ALTER COLUMN "id_lote" DROP NOT NULL;

ALTER TABLE "eventos_reproductivos"
  ADD CONSTRAINT "eventos_reproductivos_id_lote_fkey"
  FOREIGN KEY ("id_lote") REFERENCES "lote_validacion_productiva"("id_lote")
  ON DELETE SET NULL ON UPDATE CASCADE;
