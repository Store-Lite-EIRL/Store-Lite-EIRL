-- Migration 0028: RECOJO Pickup Flow — new statuses for in-store pickup
-- Adds READY_FOR_PICKUP and PICKED_UP to order_status_v2
-- Adds ORDER_READY_FOR_PICKUP and ORDER_PICKED_UP to order_timeline_event_type
-- Migrates existing recojo orders stuck in IN_TRANSIT/DELIVERED → READY_FOR_PICKUP

-- Step 1: Add new order statuses
ALTER TYPE "public"."order_status_v2" ADD VALUE 'READY_FOR_PICKUP';--> statement-breakpoint
ALTER TYPE "public"."order_status_v2" ADD VALUE 'PICKED_UP';--> statement-breakpoint

-- Step 2: Add new timeline event types
ALTER TYPE "public"."order_timeline_event_type" ADD VALUE 'ORDER_READY_FOR_PICKUP';--> statement-breakpoint
ALTER TYPE "public"."order_timeline_event_type" ADD VALUE 'ORDER_PICKED_UP';--> statement-breakpoint

-- Step 3: One-time migration — recojo orders stuck in IN_TRANSIT → READY_FOR_PICKUP
UPDATE "payments"
SET status = 'READY_FOR_PICKUP',
    version = version + 1,
    updated_at = NOW()
WHERE shipping_type = 'recojo'
  AND status = 'IN_TRANSIT';--> statement-breakpoint

-- Step 4: One-time migration — recojo orders stuck in DELIVERED → READY_FOR_PICKUP
UPDATE "payments"
SET status = 'READY_FOR_PICKUP',
    version = version + 1,
    updated_at = NOW()
WHERE shipping_type = 'recojo'
  AND status = 'DELIVERED';
