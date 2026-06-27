/**
 * =====================================================
 * API: GET /api/business/penalty-status
 * Get the current penalty status for a business
 * =====================================================
 */

import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: {
        culqiBlocked: true,
        blacklisted: true,
        penaltyDebt: true,
        penaltyCount: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      culqiBlocked: business.culqiBlocked,
      blacklisted: business.blacklisted,
      penaltyDebt: business.penaltyDebt,
      penaltyCount: business.penaltyCount,
      canAcceptPayments: !business.culqiBlocked && !business.blacklisted,
    });
  } catch (error) {
    console.error('[business/penalty-status] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
