// ──────────────────────────────────────────
// Cron: Order Timeouts
// Vercel Cron Job — runs every 15 minutes
// Processes expired orders (seller inactivity, customer auto-approve, auto-complete)
// ──────────────────────────────────────────

import { processTimeouts } from '@/core/orders/orderTimeouts';
import { env } from '@/config/env';
import { NextResponse } from 'next/server';

// Vercel Cron: */15 * * * *
// Triggered via Supabase pg_cron → HTTP POST to storelite.app/api/cron/order-timeouts
export async function GET(request: Request) {
  // Auth: requires CRON_SECRET via ?token= or Authorization: Bearer header
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!token || token !== env.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] order-timeouts: starting');

  try {
    const result = await processTimeouts();
    console.log(
      `[Cron] order-timeouts: done — ${result.processed} processed, ${result.errors} errors`,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] order-timeouts: error —', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
