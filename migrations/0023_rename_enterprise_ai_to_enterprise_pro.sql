-- Rename enterprise_ai to enterprise_pro in subscription_plan enum
-- 1. Add new value
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'enterprise_pro';

-- 2. Update existing data
UPDATE business_subscriptions SET plan_type = 'enterprise_pro' WHERE plan_type = 'enterprise_ai';
UPDATE plan_payments SET plan_type = 'enterprise_pro' WHERE plan_type = 'enterprise_ai';

-- 3. The old 'enterprise_ai' value remains in the enum type (PG doesn't support DROP VALUE).
--    No rows reference it after step 2, so this is safe.
