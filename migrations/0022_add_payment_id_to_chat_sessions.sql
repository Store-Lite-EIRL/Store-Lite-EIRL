-- Migration: 0022_add_payment_id_to_chat_sessions
-- Description: Agrega campo paymentId para vincular sesiones de chat con pedidos

-- Agregar columna paymentId a chat_sessions
ALTER TABLE chat_sessions
  ADD COLUMN payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;

-- Agregar índice para búsquedas por payment
CREATE INDEX idx_chat_sessions_payment_id ON chat_sessions(payment_id);
