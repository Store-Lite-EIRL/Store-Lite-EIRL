-- Add ORDER_CANCELLED to timeline event type enum
-- Fix: CANCELLED orders were getting ORDER_PAID as timeline event
ALTER TYPE "public"."order_timeline_event_type" ADD VALUE 'ORDER_CANCELLED';
