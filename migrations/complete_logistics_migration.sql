-- =====================================================
-- Migration: Logistics Flow
-- Estado: PENDIENTE → ANALIZANDO → ACEPTADO → FINALIZADO
-- =====================================================

-- 1. Actualizar estados existentes
UPDATE public.payments SET status = 'pending' WHERE status IN ('paid', 'shipped', 'processing', 'delivered', 'verifying');
UPDATE public.payments SET status = 'completed' WHERE status = 'completed';
UPDATE public.payments SET status = 'rejected' WHERE status IN ('rejected', 'refunded', 'disputed', 'refund_requested', 'not_delivered');

-- 2. Agregar columnas de fecha (si no existen)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 3. Agregar seller_status y campos de ticket
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS seller_status text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ticket_image_url text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_image text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tracking_token text;

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_payments_shipped_at ON public.payments(shipped_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON public.payments(completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_payments_seller_status ON public.payments(seller_status);

-- 5. Crear tabla de chats (si no existe)
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