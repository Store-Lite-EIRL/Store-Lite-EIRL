-- Migration: Add 'en_reparto' status to payment_status enum
-- This status is used when the seller notifies that the product has arrived at the customer's location
-- Flow: paid -> validando -> delivered -> en_reparto -> completed

ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'en_reparto';
