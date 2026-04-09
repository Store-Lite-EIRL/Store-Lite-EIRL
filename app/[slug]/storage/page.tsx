import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/config/env';
import { getMemberPermissions } from '@/lib/permissions/checkPermission';
import { StorageClient } from './StorageClient';

interface StoragePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoragePageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { name: true },
  });

  return {
    title: business ? `Almacén — ${business.name}` : 'Almacén | Store Lite',
    description: 'Gestión de inventario y productos.',
    robots: { index: false, follow: false },
  };
}

export default async function StoragePage({ params }: StoragePageProps) {
  const { slug } = await params;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { id: true, ownerId: true },
  });

  if (!business) {
    return notFound();
  }

  // --- Auth & Ownership Guard ---
  const cookieStore = await cookies();
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { isOwner, permissions } = await getMemberPermissions(business.id, user.id);

  if (!isOwner && !permissions.includes('products.view') && !permissions.includes('categories.view')) {
    return notFound();
  }

  return <StorageClient businessSlug={slug} isOwner={isOwner} permissions={permissions} />;
}
