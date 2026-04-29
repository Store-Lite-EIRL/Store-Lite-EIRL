-- =====================================================
-- Migration: Add logistics columns to payments
-- Description: Nuevas columnas para flujo de logística
-- =====================================================

-- 1. Agregar columnas de fecha (solo si no existen)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 2. Agregar seller_status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seller_status') THEN
        CREATE TYPE public.seller_status AS ENUM('pending', 'por_enviar', 'enviado');
    END IF;
END $$;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS seller_status public.seller_status;

-- 3. Agregar campos de ticket y rechazo
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ticket_image_url text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_image text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tracking_token text;

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_payments_shipped_at ON public.payments(shipped_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON public.payments(completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_payments_seller_status ON public.payments(seller_status);
CREATE INDEX IF NOT EXISTS idx_payments_tracking_token ON public.payments(tracking_token);

-- 5. Agregar constraint único para tracking_token
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_tracking_token_unique') THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_tracking_token_unique UNIQUE(tracking_token);
    END IF;
END $$;

-- 6. Crear tabla payment_chats
CREATE TABLE IF NOT EXISTS public.payment_chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
    token text NOT NULL,
    sender text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_chats_payment_id ON public.payment_chats(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_chats_token ON public.payment_chats(token);
CREATE INDEX IF NOT EXISTS idx_payment_chats_created_at ON public.payment_chats(created_at DESC NULLS LAST);