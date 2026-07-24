-- Migration: 0030_add_payment_id_to_messages
-- Description: Agrega paymentId a mensajes para filtrar por orden en Realtime

-- Agregar columna paymentId a messages
ALTER TABLE messages
  ADD COLUMN payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;

-- Agregar índice para búsquedas por payment
CREATE INDEX idx_messages_payment_id ON messages(payment_id);