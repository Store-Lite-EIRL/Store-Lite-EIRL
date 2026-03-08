import { NextResponse } from 'next/server';

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/webhooks/culqi
 *
 * Receives Culqi webhook events and updates payment records accordingly.
 * Culqi sends events such as: charge.created, charge.paid, charge.failed, refund.created
 *
 * Security: In production, verify the Culqi-signature header.
 * Reference: https://docs.culqi.com/#documentacion-webhooks
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // In production: verify Culqi signature here
  // const signature = request.headers.get('Culqi-Signature');
  // verifySignature(signature, rawBody);

  const event = body as {
    object?: string;
    type?: string;
    data?: {
      id?: string;
      object?: string;
      reference_code?: string;
      outcome?: unknown;
    };
  };

  const chargeId = event.data?.id;
  const eventType = event.type;

  if (!chargeId || !eventType) {
    // Not an event we care about — return 200 so Culqi stops retrying
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventType) {
      case 'charge.paid': {
        await db
          .update(payments)
          .set({ status: 'paid', updatedAt: new Date() })
          .where(eq(payments.culqiChargeId, chargeId));
        break;
      }

      case 'charge.failed': {
        await db
          .update(payments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(payments.culqiChargeId, chargeId));
        break;
      }

      case 'refund.created': {
        await db
          .update(payments)
          .set({ status: 'refund_requested', updatedAt: new Date() })
          .where(eq(payments.culqiChargeId, chargeId));
        break;
      }

      default:
        // Unknown event type — acknowledge and move on
        console.log(`[culqi-webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[culqi-webhook] DB error processing event ${eventType}:`, error);
    // Return 500 so Culqi retries
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
