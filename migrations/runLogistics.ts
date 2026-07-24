import { sql } from 'drizzle-orm';
import { db } from './src/core/database/client';

async function runMigration() {
  console.log('🔄 Ejecutando migración de logística...');

  try {
    // Run custom SQL directly
    await db.execute(sql`
      -- Agregar columnas de fecha
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at timestamptz;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
    `);
    console.log('✅ Columnas de fecha agregadas');

    await db.execute(sql`
      -- Agregar seller_status
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS seller_status text;
    `);
    console.log('✅ Columna seller_status agregada');

    await db.execute(sql`
      -- Agregar campos de ticket y rechazo
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ticket_image_url text;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason text;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_image text;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tracking_token text;
    `);
    console.log('✅ Campos de ticket y rechazo agregados');

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_payments_shipped_at ON public.payments(shipped_at DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON public.payments(completed_at DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_payments_seller_status ON public.payments(seller_status);
    `);
    console.log('✅ Índices creados');

    // Create payment_chats table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.payment_chats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
        token text NOT NULL,
        sender text NOT NULL,
        message text NOT NULL,
        is_read boolean DEFAULT false,
        created_at timestamptz DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Tabla payment_chats creada');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_payment_chats_payment_id ON public.payment_chats(payment_id);
      CREATE INDEX IF NOT EXISTS idx_payment_chats_token ON public.payment_chats(token);
    `);
    console.log('✅ Índices de payment_chats creados');

    console.log('🎉 Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }

  process.exit(0);
}

runMigration();
