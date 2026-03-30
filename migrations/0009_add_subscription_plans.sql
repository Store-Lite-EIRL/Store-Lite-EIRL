-- Create subscription enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('basico', 'emprendedor', 'business_pro', 'enterprise_ai');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'past_due', 'canceled', 'expired', 'trialing');
    END IF;
END $$;

-- Add subscription columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS plan_type subscription_plan DEFAULT 'basico',
ADD COLUMN IF NOT EXISTS plan_status subscription_status DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
