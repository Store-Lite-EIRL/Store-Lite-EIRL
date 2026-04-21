import { db } from '@/core/database/client';
import { planPayments } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * API: /api/billing/update-plan-ticket
 * Description: Actualiza el ticket URL de un plan_payment (SaaS).
 */
export async function POST(req: Request) {
  try {
    const { planPaymentId, ticketUrl } = await req.json();

    if (!planPaymentId || !ticketUrl) {
      return NextResponse.json(
        { error: 'Falta planPaymentId o ticketUrl' },
        { status: 400 }
      );
    }

    const [result] = await db
      .update(planPayments)
      .set({ ticketUrl, updatedAt: new Date() })
      .where(eq(planPayments.id, planPaymentId))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Pago de plan no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[update-plan-ticket] Error updating ticket URL:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
