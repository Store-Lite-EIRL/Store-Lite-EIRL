import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * POST /api/order/lookup
 * Body: { dni: string, orderNumber: string, businessSlug: string }
 * Returns: { success: boolean, token?: string, error?: string }
 */
export async function POST(request: Request) {
  try {
    const { dni, orderNumber, businessSlug } = await request.json();

    if (!dni || !orderNumber || !businessSlug) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: DNI, Nro de Orden y Slug del negocio.' },
        { status: 400 }
      );
    }

    // Buscar el pago por DNI + Nro Orden + Slug del negocio
    const [order] = await db
      .select({
        trackingToken: payments.trackingToken,
        businessSlug: payments.business?.slug,
      })
      .from(payments)
      .leftJoin(businesses, eq(payments.businessId, businesses.id))
      .where(
        and(
          eq(payments.buyerDni, dni),
          eq(payments.orderNumber, orderNumber),
          eq(businesses.slug, businessSlug)
        )
      )
      .limit(1);

    if (!order || !order.trackingToken) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada. Verifica tus datos.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      token: order.trackingToken,
    });

  } catch (error) {
    console.error('[API /order/lookup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error de conexión. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
