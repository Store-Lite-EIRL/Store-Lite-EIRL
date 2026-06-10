import { db } from '@/core/database/client';
import { paymentIdempotencyKeys } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export type JsonResponseBody = Record<string, unknown>;

type Reservation =
  | { type: 'reserved'; key: string }
  | { type: 'replay'; response: NextResponse }
  | { type: 'processing'; response: NextResponse };

export async function reserveIdempotencyKey(key: string | null): Promise<Reservation | null> {
  if (!key) return null;

  const [inserted] = await db
    .insert(paymentIdempotencyKeys)
    .values({ key, status: 'processing' })
    .onConflictDoNothing()
    .returning({ key: paymentIdempotencyKeys.key });

  if (inserted) {
    return { type: 'reserved', key };
  }

  const existing = await db.query.paymentIdempotencyKeys.findFirst({
    where: eq(paymentIdempotencyKeys.key, key),
  });

  if (existing?.responseBody && existing.responseStatus) {
    return {
      type: 'replay',
      response: NextResponse.json(existing.responseBody as JsonResponseBody, {
        status: existing.responseStatus,
      }),
    };
  }

  return {
    type: 'processing',
    response: NextResponse.json(
      {
        error: 'Este pago ya se está procesando. Esperá la confirmación antes de reintentar.',
      },
      { status: 409 },
    ),
  };
}

export async function completeIdempotencyKey(
  key: string | null,
  responseBody: JsonResponseBody,
  responseStatus = 200,
): Promise<void> {
  if (!key) return;

  await db
    .update(paymentIdempotencyKeys)
    .set({
      status: responseStatus >= 200 && responseStatus < 300 ? 'succeeded' : 'failed',
      responseStatus,
      responseBody,
      updatedAt: new Date(),
    })
    .where(eq(paymentIdempotencyKeys.key, key));
}
