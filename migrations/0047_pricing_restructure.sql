-- =====================================================
-- PRICING RESTRUCTURE — 3 Plans (Lite / Lite Pago / Lite Plus)
-- =====================================================
-- Replaces the legacy 4-plan catalog (basico, emprendedor,
-- business_pro, enterprise_pro) with 3 keys:
--   basico        -> lite
--   emprendedor   -> lite_pago   (upgrade: gains gateway + customization)
--   business_pro  -> lite_pago
--   enterprise_pro -> lite_plus
--
-- EXECUTION MODEL (MANDATORY):
--   * Autocommit: plain top-level statements, NO BEGIN/COMMIT.
--     PG >= 12 allows ALTER TYPE ... ADD VALUE inside a transaction, but the
--     new value cannot be USED in the same transaction
--     ("unsafe use of new value of enum type"). These UPDATEs reference
--     'lite'/'lite_pago'/'lite_plus', so everything must autocommit
--     statement-by-statement (Supabase SQL editor does this).
--   * NEVER run via drizzle-kit: 0047 is a hand-written manual file
--     (like 0024..0046) with NO entries in migrations/meta/_journal.json.
--     Drizzle-kit must not generate or execute it.
--   * Idempotent: ADD VALUE IF NOT EXISTS is a no-op when the value exists;
--     each UPDATE matches only legacy values, so a re-run matches zero rows.
--
-- UPDATE ORDERING (collision-proof, verified):
--   Every WHERE clause reads only a LEGACY source value:
--   enterprise_pro, business_pro, emprendedor, basico.
--   No statement reads a new value (lite / lite_pago / lite_plus)
--   as a source, so no ORDER of these statements can collide —
--   none is ever produced by an earlier UPDATE.
--   The two lite_pago writes are independent merges into a fresh value;
--   they are safe in any permutation. Listed order is kept for readability:
--   lite_plus first, then the two lite_pago merges, then lite.
--
-- Legacy enum values linger by PG limitation (no DROP VALUE); application
-- code never references them after this change (resolvePlan shim covers
-- the rollout window and is removed after settle).
-- =====================================================

-- 1. Add the three new enum values (idempotent).
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'lite';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'lite_pago';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'lite_plus';

-- 2. Remap business_subscriptions rows (plan_type only).
UPDATE business_subscriptions SET plan_type = 'lite_plus'  WHERE plan_type = 'enterprise_pro';
UPDATE business_subscriptions SET plan_type = 'lite_pago'  WHERE plan_type = 'business_pro';
UPDATE business_subscriptions SET plan_type = 'lite_pago'  WHERE plan_type = 'emprendedor';
UPDATE business_subscriptions SET plan_type = 'lite'       WHERE plan_type = 'basico';

-- 3. Remap plan_payments rows (plan_type ONLY; amount/fee columns
--    stay byte-identical — historical invoice amounts are frozen).
UPDATE plan_payments SET plan_type = 'lite_plus'  WHERE plan_type = 'enterprise_pro';
UPDATE plan_payments SET plan_type = 'lite_pago'  WHERE plan_type = 'business_pro';
UPDATE plan_payments SET plan_type = 'lite_pago'  WHERE plan_type = 'emprendedor';
UPDATE plan_payments SET plan_type = 'lite'       WHERE plan_type = 'basico';