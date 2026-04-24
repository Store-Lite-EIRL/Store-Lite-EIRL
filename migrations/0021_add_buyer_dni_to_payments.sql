-- =====================================================
-- Migration: 0021_add_buyer_dni_to_payments
-- Description: Agrega campo buyer_dni para guardar DNI del comprador
-- =====================================================

-- Agregar columna buyer_dni a la tabla payments
ALTER TABLE public.payments ADD COLUMN buyer_dni TEXT;

-- Crear índice para búsquedas por DNI
CREATE INDEX idx_payments_buyer_dni ON public.payments(buyer_dni) WHERE buyer_dni IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN public.payments.buyer_dni IS 'DNI del comprador';