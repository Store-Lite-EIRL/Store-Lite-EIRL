import { db } from '@/core/database/client';
import { planPayments } from '@/core/database/schema';
import { requireOwnedBusinessById } from '@/features/storage/actions/authz';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * API: /api/billing/update-plan-ticket
 * Description: Actualiza el ticket URL de un plan_payment (SaaS).
 */
export async function POST(req: Request) {
  // ── Auth check ──────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { planPaymentId, ticketUrl } = await req.json();

    if (!planPaymentId || !ticketUrl) {
      return NextResponse.json({ error: 'Falta planPaymentId o ticketUrl' }, { status: 400 });
    }

    // ── Auth: lookup businessId from planPayment ────────────
    const [planPayment] = await db
      .select({ businessId: planPayments.businessId })
      .from(planPayments)
      .where(eq(planPayments.id, planPaymentId))
      .limit(1);

    if (!planPayment) {
      return NextResponse.json({ error: 'Pago de plan no encontrado' }, { status: 404 });
    }

    try {
      await requireOwnedBusinessById(planPayment.businessId);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'No autorizado' },
        { status: 401 },
      );
    }

    const [result] = await db
      .update(planPayments)
      .set({ ticketUrl, updatedAt: new Date() })
      .where(eq(planPayments.id, planPaymentId))
      .returning();

    if (!result) {
      return NextResponse.json({ error: 'Pago de plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[update-plan-ticket] Error updating ticket URL:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
