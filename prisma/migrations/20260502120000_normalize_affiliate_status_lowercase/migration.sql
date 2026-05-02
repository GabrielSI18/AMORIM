-- Normaliza status de afiliados e indicações para lowercase.
--
-- Bug fix:
-- A rota PATCH /api/affiliates/[id] aceitava só UPPERCASE (`ACTIVE`, `PENDING`, ...)
-- e gravava AS-IS, enquanto a rota POST /api/bookings filtrava afiliado por
-- `status: 'active'` (lowercase). Resultado: depois que o admin aprovava o
-- afiliado, novas reservas via link `?ref=` jamais conseguiam atribuir comissão
-- porque o lookup retornava null.
--
-- A correção no código já tolera qualquer case nas comparações, mas esta
-- migration garante que os dados existentes ficam normalizados.

UPDATE "affiliates"
SET "status" = LOWER("status")
WHERE "status" IS NOT NULL
  AND "status" <> LOWER("status");

UPDATE "affiliate_referrals"
SET "commission_status" = LOWER("commission_status")
WHERE "commission_status" IS NOT NULL
  AND "commission_status" <> LOWER("commission_status");
