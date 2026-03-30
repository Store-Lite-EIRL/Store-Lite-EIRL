'use server';

import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

export async function requireAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  return user.id;
}

export async function requireOwnedBusinessBySlug(slug: string) {
  const userId = await requireAuthenticatedUserId();

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { id: true, ownerId: true, slug: true },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  if (business.ownerId !== userId) {
    throw new Error('No autorizado');
  }

  return { businessId: business.id, ownerId: business.ownerId, slug: business.slug };
}

export async function requireOwnedBusinessById(businessId: string) {
  const userId = await requireAuthenticatedUserId();

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true, ownerId: true, slug: true },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  if (business.ownerId !== userId) {
    throw new Error('No autorizado');
  }

  return { businessId: business.id, ownerId: business.ownerId, slug: business.slug };
}
