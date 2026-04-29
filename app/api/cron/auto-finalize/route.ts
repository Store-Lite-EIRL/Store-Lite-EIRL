// =====================================================
// API ROUTE: /api/cron/auto-finalize
// =====================================================
// Description: Endpoint for cron jobs to auto-finalize expired payments
// Security: Requires CRON_SECRET header
// =====================================================

import { autoFinalizeExpiredPayments } from '@/app/[slug]/dashboard/actions/finalizationActions';
import { env } from '@/config/env';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No cache

/**
 * POST /api/cron/auto-finalize
 * Called by external cron service (Vercel Cron, Supabase, etc.)
 */
export async function POST(request: NextRequest) {
  console.log('[API /cron/auto-finalize] Received request');

  // 1. Security check: Validate CRON_SECRET
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = env.CRON_SECRET || process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[API /cron/auto-finalize] CRON_SECRET not configured');
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 },
    );
  }

  if (cronSecret !== expectedSecret) {
    console.warn('[API /cron/auto-finalize] Invalid cron secret');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Call the auto-finalize function
  try {
    console.log('[API /cron/auto-finalize] Starting auto-finalization...');

    const result = await autoFinalizeExpiredPayments();

    if (result.success) {
      console.log(`[API /cron/auto-finalize] Success! Processed ${result.processedCount} payments`);
      return NextResponse.json({
        success: true,
        processedCount: result.processedCount,
        message: `Auto-finalized ${result.processedCount} payments`,
      });
    } else {
      console.error('[API /cron/auto-finalize] Error:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('[API /cron/auto-finalize] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/cron/auto-finalize
 * Health check endpoint (optional)
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Auto-finalize cron endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
