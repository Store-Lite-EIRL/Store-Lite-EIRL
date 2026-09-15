import { getBusinessTrustScore } from '@/actions/business/getBusinessTrustScore';
import { resolveBusinessSlug } from '@/core/business/slug';
import ComplaintBanner from '@/features/business/components/ComplaintBanner';
import { notFound } from 'next/navigation';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolveBusinessSlug(slug);
  const business = resolved?.business;

  if (!business || !business.isActive) {
    return notFound();
  }

  // Fetch trust score for complaint banner
  const trustScore = await getBusinessTrustScore(business.id);

  return (
    <>
      {trustScore && (
        <ComplaintBanner
          verifiedComplaints30d={trustScore.verifiedComplaints30d}
          deactivationRisk={trustScore.deactivationRisk}
          businessName={trustScore.businessName}
          incompleteRate30d={trustScore.incompleteRate30d}
        />
      )}
      {children}
    </>
  );
}
