import { replaceSlugInPath, resolveBusinessSlug } from '@/core/business/slug';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { checkPermission } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { getBusinessPath } from '@/shared/utils/url';
import { notFound, redirect } from 'next/navigation';
import { RealtimeToast } from './components/RealtimeToast';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { slug } = await params;

  const resolvedBusiness = await resolveBusinessSlug(slug);
  const business = resolvedBusiness?.business;

  if (!business) {
    return notFound();
  }

  if (resolvedBusiness.matchedAlias) {
    redirect(replaceSlugInPath(`/${slug}/dashboard`, slug, resolvedBusiness.canonicalSlug));
  }

  const entitlements = await getBusinessEntitlements(business.id);

  if (entitlements.plan === 'basico') {
    redirect(getBusinessPath(resolvedBusiness.canonicalSlug));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAllowed = await checkPermission(business.id, user?.id, 'dashboard.view');
  if (!isAllowed) {
    redirect(getBusinessPath(resolvedBusiness.canonicalSlug));
  }

  return (
    <>
      <RealtimeToast businessId={business.id} />
      {children}
    </>
  );
}
