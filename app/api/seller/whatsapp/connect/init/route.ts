import { db } from '@/core/database/client';
import { businesses, whatsappChannels } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/config/env';

const connectInitSchema = z.object({
  businessId: z.string().uuid('ID de negocio inválido'),
});

const YCLOUD_API_BASE = 'https://api.ycloud.com/v2';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // Validate input
    const validationResult = connectInitSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.issues[0]?.message || 'Datos inválidos',
        },
        { status: 400 },
      );
    }

    const { businessId } = validationResult.data;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verify business ownership
    const business = await db.query.businesses.findFirst({
      where: and(eq(businesses.id, businessId), eq(businesses.ownerId, user.id)),
      columns: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado o sin permisos' }, { status: 403 });
    }

    // Check if business already has a WhatsApp channel
    const existingChannel = await db.query.whatsappChannels.findFirst({
      where: eq(whatsappChannels.businessId, businessId),
      columns: { id: true, isActive: true, ycloudPhoneNumberId: true },
    });

    if (existingChannel?.isActive) {
      return NextResponse.json(
        { error: 'Este negocio ya tiene un canal WhatsApp activo' },
        { status: 409 },
      );
    }

    // Get YCloud credentials
    const apiKey = env.ycloudApiKey;
    const wabaId = env.ycloudWabaId;

    if (!apiKey || !wabaId) {
      console.error('[whatsapp/connect/init] Missing YCloud credentials');
      return NextResponse.json(
        { error: 'Configuración de WhatsApp incompleta. Contacta al administrador.' },
        { status: 500 },
      );
    }

    // Call YCloud API to register phone number (Embedded Signup)
    const ycloudResponse = await fetch(`${YCLOUD_API_BASE}/whatsapp/phoneNumbers/register`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        waba_id: wabaId,
        // pin is optional - let YCloud generate the 6-digit code
      }),
    });

    const ycloudData = await ycloudResponse.json();

    if (!ycloudResponse.ok) {
      console.error('[whatsapp/connect/init] YCloud error:', ycloudData);
      return NextResponse.json(
        { error: ycloudData.message || 'Error al iniciar conexión con WhatsApp' },
        { status: ycloudResponse.status },
      );
    }

    // Extract data from YCloud response
    const { id: phoneNumberId, code, expires_at: expiresAt } = ycloudData;

    if (!phoneNumberId || !code || !expiresAt) {
      console.error('[whatsapp/connect/init] Invalid YCloud response:', ycloudData);
      return NextResponse.json(
        { error: 'Respuesta inválida de YCloud' },
        { status: 500 },
      );
    }

    // Save to database
    await db.insert(whatsappChannels).values({
      businessId,
      ycloudPhoneNumberId: phoneNumberId,
      wabaId,
      isActive: false,
      connectedAt: null,
      displayPhoneNumber: null,
    });

    // Return code and expiry to frontend
    return NextResponse.json({
      phoneNumberId,
      code,
      expiresAt,
    });
  } catch (error) {
    console.error('[whatsapp/connect/init] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}