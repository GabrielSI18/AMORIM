-- Passeios opcionais do pacote (ingresso à parte), ex.: Hot Park nos pacotes de Caldas Novas
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "optional_tours" JSONB;
