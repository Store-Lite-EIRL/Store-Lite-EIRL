import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, hasBusinesses: false });
  }

  // Check if user has any businesses
  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
    columns: { id: true },
    limit: 1,
  });

  const hasBusinesses = userBusinesses.length > 0;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url,
    },
    hasBusinesses,
  });
}
