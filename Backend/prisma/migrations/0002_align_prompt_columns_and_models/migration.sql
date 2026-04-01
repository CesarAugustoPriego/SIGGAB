-- Align prompt field names without destructive reset.
-- 1) usuarios.activo -> usuarios.estado
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'activo'
  ) THEN
    ALTER TABLE "usuarios" RENAME COLUMN "activo" TO "estado";
  END IF;
END
$$;

-- 2) bitacora.fecha_hora -> bitacora.fecha_accion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bitacora' AND column_name = 'fecha_hora'
  ) THEN
    ALTER TABLE "bitacora" RENAME COLUMN "fecha_hora" TO "fecha_accion";
  END IF;
END
$$;

-- 3) Index alignment for bitacora timestamp column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_bitacora_fecha'
  ) THEN
    ALTER INDEX "idx_bitacora_fecha" RENAME TO "bitacora_fecha_accion_idx";
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "bitacora_fecha_accion_idx" ON "bitacora"("fecha_accion");
