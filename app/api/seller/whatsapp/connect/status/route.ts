import { db } from '@/core/database/client';
import { businesses, whatsappChannels } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/config/env';

const connectStatusSchema = z.object({
  phoneNumberId: z.string().min(1, 'phoneNumberId es requerido'),
});

const YCLOUD_API_BASE = 'https://api.ycloud.com/v2';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // Validate input
    const validationResult = connectStatusSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.issues[0]?.message || 'Datos inválidos',
        },
        { status: 400 },
      );
    }

    const { phoneNumberId } = validationResult.data;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Find the channel by phoneNumberId
    const channel = await db.query.whatsappChannels.findFirst({
      where: eq(whatsappChannels.ycloudPhoneNumberId, phoneNumberId),
      columns: {
        id: true,
        businessId: true,
        ycloudPhoneNumberId: true,
        isActive: true,
        connectedAt: true,
        displayPhoneNumber: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }

    // Verify ownership - fetch business separately
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, channel.businessId),
      columns: { ownerId: true },
    });

    if (!business || business.ownerId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos para este canal' }, { status: 403 });
    }

    // If already active, return current state
    if (channel.isActive) {
      return NextResponse.json({
        status: 'connected',
        isActive: true,
        displayPhoneNumber: channel.displayPhoneNumber,
        connectedAt: channel.connectedAt,
      });
    }

    // Get YCloud credentials
    const apiKey = env.ycloudApiKey;

    if (!apiKey) {
      console.error('[whatsapp/connect/status] Missing YCloud API key');
      return NextResponse.json(
        { error: 'Configuración de WhatsApp incompleta' },
        { status: 500 },
      );
    }

    // Query YCloud for current status
    const ycloudResponse = await fetch(`${YCLOUD_API_BASE}/whatsapp/phoneNumbers/${phoneNumberId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const ycloudData = await ycloudResponse.json();

    if (!ycloudResponse.ok) {
      console.error('[whatsapp/connect/status] YCloud error:', ycloudData);
      // Don't fail - return current DB state
      return NextResponse.json({
        status: 'pending',
        isActive: channel.isActive,
        displayPhoneNumber: channel.displayPhoneNumber,
        connectedAt: channel.connectedAt,
      });
    }

    const { status: ycloudStatus, display_phone_number: displayPhoneNumber } = ycloudData;

    // If connected, update database
    if (ycloudStatus === 'connected') {
      await db
        .update(whatsappChannels)
        .set({
          isActive: true,
          connectedAt: new Date(),
          displayPhoneNumber: displayPhoneNumber ?? null,
          updatedAt: new Date(),
        })
        .where(eq(whatsappChannels.id, channel.id));

      return NextResponse.json({
        status: 'connected',
        isActive: true,
        displayPhoneNumber,
        connectedAt: new Date().toISOString(),
      });
    }

    // Return pending status
    return NextResponse.json({
      status: ycloudStatus || 'pending',
      isActive: false,
      displayPhoneNumber: channel.displayPhoneNumber,
      connectedAt: channel.connectedAt,
    });
  } catch (error) {
    console.error('[whatsapp/connect/status] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}