import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { checkPermission } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { slug } = await params;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { id: true },
  });

  if (!business) {
    return notFound();
  }

  const entitlements = await getBusinessEntitlements(business.id);

  if (entitlements.plan === 'basico') {
    redirect(`/${slug}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAllowed = await checkPermission(business.id, user?.id, 'dashboard.view');
  if (!isAllowed) {
    redirect(`/${slug}`);
  }

  return <>{children}</>;
}
