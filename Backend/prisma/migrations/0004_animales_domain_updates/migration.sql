DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sexo_animal') THEN
    CREATE TYPE sexo_animal AS ENUM ('HEMBRA', 'MACHO');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'procedencia_animal') THEN
    CREATE TYPE procedencia_animal AS ENUM ('NACIDA', 'ADQUIRIDA');
  END IF;
END $$;

INSERT INTO razas (nombre_raza, activo)
SELECT 'Tabasqueña', TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM razas
  WHERE translate(lower(nombre_raza), 'áéíóúü', 'aeiouu') = 'tabasquena'
);

WITH raza_tabasquena AS (
  SELECT id_raza
  FROM razas
  WHERE translate(lower(nombre_raza), 'áéíóúü', 'aeiouu') = 'tabasquena'
  ORDER BY id_raza
  LIMIT 1
)
UPDATE animales
SET id_raza = (SELECT id_raza FROM raza_tabasquena)
WHERE EXISTS (SELECT 1 FROM raza_tabasquena)
  AND id_raza <> (SELECT id_raza FROM raza_tabasquena);

UPDATE razas
SET activo = CASE
  WHEN translate(lower(nombre_raza), 'áéíóúü', 'aeiouu') = 'tabasquena' THEN TRUE
  ELSE FALSE
END;

UPDATE razas
SET nombre_raza = 'Tabasqueña'
WHERE translate(lower(nombre_raza), 'áéíóúü', 'aeiouu') = 'tabasquena';

ALTER TABLE animales
  ADD COLUMN IF NOT EXISTS sexo sexo_animal NOT NULL DEFAULT 'HEMBRA',
  ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255);

ALTER TABLE animales
  ALTER COLUMN procedencia TYPE procedencia_animal
  USING (
    CASE
      WHEN procedencia IS NULL THEN 'ADQUIRIDA'::procedencia_animal
      WHEN translate(lower(procedencia), 'áéíóúü', 'aeiouu') LIKE '%nacid%' THEN 'NACIDA'::procedencia_animal
      ELSE 'ADQUIRIDA'::procedencia_animal
    END
  );

ALTER TABLE animales
  ALTER COLUMN procedencia SET DEFAULT 'ADQUIRIDA',
  ALTER COLUMN procedencia SET NOT NULL;

CREATE INDEX IF NOT EXISTS animales_sexo_idx ON animales (sexo);
