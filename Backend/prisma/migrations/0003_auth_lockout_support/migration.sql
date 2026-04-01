-- RF01 hardening: bloqueo automatico por intentos fallidos consecutivos
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "intentos_fallidos" INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bloqueado_hasta" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "usuarios_bloqueado_hasta_idx" ON "usuarios"("bloqueado_hasta");
