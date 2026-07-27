import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { requireOwnedBusinessById } from '@/features/storage/actions/authz';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * API: /api/payment/update-ticket
 * Description: Updates a payment record with the generated ticket image URL.
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
    const { orderNumber, ticketUrl } = await req.json();

    if (!orderNumber || !ticketUrl) {
      return NextResponse.json({ error: 'Falta orderNumber o ticketUrl' }, { status: 400 });
    }

    // ── Auth: lookup businessId from payment ────────────────
    const [payment] = await db
      .select({ businessId: payments.businessId })
      .from(payments)
      .where(eq(payments.orderNumber, orderNumber))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado con ese número de orden' },
        { status: 404 },
      );
    }

    try {
      await requireOwnedBusinessById(payment.businessId);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'No autorizado' },
        { status: 401 },
      );
    }

    // ── Validate ticketUrl ──────────────────────────────────
    if (typeof ticketUrl !== 'string' || ticketUrl.trim().length === 0) {
      return NextResponse.json({ error: 'ticketUrl debe ser un texto válido' }, { status: 400 });
    }

    // Update payment where orderNumber matches
    const result = await db
      .update(payments)
      .set({ ticketUrl: ticketUrl.trim(), updatedAt: new Date() })
      .where(eq(payments.orderNumber, orderNumber))
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Pago no encontrado con ese número de orden' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error updating payment ticket:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
