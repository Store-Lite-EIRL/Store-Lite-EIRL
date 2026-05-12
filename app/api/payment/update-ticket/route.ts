import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * API: /api/payment/update-ticket
 * Description: Updates a payment record with the generated ticket image URL.
 */
export async function POST(req: Request) {
  try {
    const { orderNumber, ticketUrl } = await req.json();

    if (!orderNumber || !ticketUrl) {
      return NextResponse.json({ error: 'Missing orderNumber or ticketUrl' }, { status: 400 });
    }

    // Update payment where orderNumber matches
    const result = await db
      .update(payments)
      .set({ ticketUrl, updatedAt: new Date() })
      .where(eq(payments.orderNumber, orderNumber))
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found with this order number' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error updating payment ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 },
    );
  }
}
