'use client';

import type { BusinessTrustScore } from '@/actions/business/getBusinessTrustScore';
import BusinessBadge from '@/features/business/components/BusinessBadge';

interface StorefrontTrustBadgeProps {
  /** Trust data from getBusinessTrustScore; null when ENABLE_AUTO_DEACTIVATION is off. */
  trustSignal: BusinessTrustScore | null;
}

/**
 * Customer-facing DS 011 trust signal mounted on the storefront (business page).
 * Renders the BusinessBadge with the SAME trust data the complaint banner uses
 * (fetched once by the server page — no double fetch) and mirrors the banner's
 * gating: getBusinessTrustScore returns null when the feature flag is off, so
 * nothing renders.
 */
export default function StorefrontTrustBadge({ trustSignal }: StorefrontTrustBadgeProps) {
  if (!trustSignal) {
    return null;
  }

  return (
    <BusinessBadge
      kybVerified={trustSignal.kybVerified}
      trustLevel={trustSignal.trustLevel}
      verifiedComplaints30d={trustSignal.verifiedComplaints30d}
      incompleteRate30d={trustSignal.incompleteRate30d}
    />
  );
}
