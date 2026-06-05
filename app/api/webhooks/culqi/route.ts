import { NextResponse } from 'next/server';

import { db } from '@/core/database/client';
import type { OrderStatus } from '@/core/database/schema';
import { paymentOrders, payments } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const DEDUP_TTL_MS = 10 * 60 * 1000;
const seenEvents = new Map<string, number>();

function safeTimingEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function cleanupSeenEvents(now: number) {
  for (const [key, expiresAt] of seenEvents.entries()) {
    if (expiresAt <= now) {
      seenEvents.delete(key);
    }
  }
}

function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const parts = signatureHeader.split(',').map((part) => part.trim());
  const kv = new Map<string, string>();
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (!key || rest.length === 0) continue;
    kv.set(key.trim().toLowerCase(), rest.join('=').trim());
  }

  const timestamp = kv.get('t') ?? kv.get('ts') ?? null;
  const signature = kv.get('v1') ?? kv.get('signature') ?? signatureHeader.trim();

  return { timestamp, signature };
}

function verifyCulqiSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.CULQI_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false as const, reason: 'Missing webhook secret' };
    }
    return { ok: true as const, timestamp: null };
  }

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed?.signature) {
    return { ok: false as const, reason: 'Missing signature header' };
  }

  const expectedRaw = createHmac('sha256', secret).update(rawBody).digest('hex');
  let valid = safeTimingEquals(parsed.signature, expectedRaw);

  if (!valid && parsed.timestamp) {
    const expectedTimestamped = createHmac('sha256', secret)
      .update(`${parsed.timestamp}.${rawBody}`)
      .digest('hex');
    valid = safeTimingEquals(parsed.signature, expectedTimestamped);
  }

  if (!valid) {
    return { ok: false as const, reason: 'Invalid signature' };
  }

  if (parsed.timestamp) {
    const tsNum = Number(parsed.timestamp);
    if (Number.isFinite(tsNum)) {
      const now = Date.now();
      const timestampMs = tsNum > 1e12 ? tsNum : tsNum * 1000;
      if (Math.abs(now - timestampMs) > REPLAY_WINDOW_MS) {
        return { ok: false as const, reason: 'Expired signature timestamp' };
      }
    }
  }

  return { ok: true as const, timestamp: parsed.timestamp ?? null };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const signatureHeader = request.headers.get('Culqi-Signature');
  const verification = verifyCulqiSignature(rawBody, signatureHeader);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.reason }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const event = body as {
    id?: string;
    type?: string;
    data?: {
      id?: string;
      reference_code?: string;
      status?: string;
      outcome?: { type?: string };
    };
  };

  const eventType = event.type;
  const chargeId = event.data?.id;

  if (!eventType || !chargeId) {
    return NextResponse.json({ received: true });
  }

  const dedupId = event.id ?? `${eventType}:${chargeId}`;
  const now = Date.now();
  cleanupSeenEvents(now);
  if (seenEvents.has(dedupId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  seenEvents.set(dedupId, now + DEDUP_TTL_MS);

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
      case 'order.status.changed': {
        const orderStatus = event.data?.status;
        const culqiOrderId = event.data?.id;

        if (!culqiOrderId || !orderStatus) {
          console.warn('[culqi-webhook] Missing order ID or status in order.status.changed');
          break;
        }

        const statusMap: Record<string, OrderStatus> = {
          paid: 'paid',
          expired: 'expired',
          cancelled: 'cancelled',
        };

        const mapped = statusMap[orderStatus];
        if (!mapped) {
          console.warn(`[culqi-webhook] Unknown order status: ${orderStatus}`);
          break;
        }

        const result = (await db
          .update(paymentOrders)
          .set({ status: mapped, updatedAt: new Date() })
          .where(eq(paymentOrders.culqiOrderId, culqiOrderId))) as unknown as {
          rowCount: number;
        };

        if (!result?.rowCount || result.rowCount === 0) {
          console.warn(`[culqi-webhook] Order not found in DB: ${culqiOrderId}`);
        }
        break;
      }
      default:
        console.warn(`[culqi-webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[culqi-webhook] DB error processing event ${eventType}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
