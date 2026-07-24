/**
 * =====================================================
 * API: POST /api/order/track
 * Backend: Buscar tracking_token por DNI y Nro de Orden
 * =====================================================
 */

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // 0. Validate Data using Zod
    const { trackOrderSchema } = await import('@/features/billing/schemas');
    const validationResult = trackOrderSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || 'DNI y Número de Orden son requeridos',
        },
        { status: 400 },
      );
    }

    const { dni, orderNumber } = validationResult.data;

    // Buscamos el pago que coincida con ambos campos
    // Nota: el orderNumber en la DB puede venir con o sin el '#' dependiendo de cómo se guarde
    const cleanOrderNumber = orderNumber.startsWith('#') ? orderNumber.slice(1) : orderNumber;

    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.buyerDni, dni), eq(payments.orderNumber, cleanOrderNumber)),
      columns: {
        trackingToken: true,
      },
    });

    if (!payment || !payment.trackingToken) {
      return NextResponse.json(
        { error: 'No se encontró ningún pedido con esos datos' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      token: payment.trackingToken,
    });
  } catch (error) {
    console.error('[order/track] Error:', error);
    return NextResponse.json({ error: 'Error interno al buscar el pedido' }, { status: 500 });
  }
}
