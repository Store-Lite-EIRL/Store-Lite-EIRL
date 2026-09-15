import type { BusinessTrustScore } from '@/actions/business/getBusinessTrustScore';
import StorefrontTrustBadge from '@/app/[slug]/(app)/components/StorefrontTrustBadge';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function makeTrustSignal(overrides: Partial<BusinessTrustScore> = {}): BusinessTrustScore {
  return {
    businessId: 'biz-1',
    businessName: 'Test Business',
    kybVerified: false,
    trustLevel: 'new',
    verifiedComplaints30d: 0,
    incompleteRate30d: 0,
    deactivationRisk: 'none',
    shouldShowBanner: false,
    ...overrides,
  };
}

describe('StorefrontTrustBadge — production mount of BusinessBadge on the storefront', () => {
  it('renders the BusinessBadge with the given trust data when a trust signal is available', () => {
    render(
      <StorefrontTrustBadge
        trustSignal={makeTrustSignal({ kybVerified: true, trustLevel: 'verified' })}
      />,
    );
    expect(screen.getByText('Negocio Verificado')).toBeInTheDocument();
    expect(screen.getByTestId('business-badge-verified')).toBeInTheDocument();
  });

  it('renders the warning badge with the complaint tooltip when the trust level is warning', () => {
    render(
      <StorefrontTrustBadge
        trustSignal={makeTrustSignal({
          trustLevel: 'warning',
          verifiedComplaints30d: 3,
          deactivationRisk: 'verified_complaints',
        })}
      />,
    );
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
    expect(screen.getByTestId('business-badge-warning')).toHaveAttribute(
      'title',
      expect.stringContaining('3 denuncias verificadas'),
    );
  });

  it('renders nothing when the trust signal is null (flag off → getBusinessTrustScore returns null)', () => {
    render(<StorefrontTrustBadge trustSignal={null} />);
    expect(screen.queryByTestId(/business-badge-/)).not.toBeInTheDocument();
  });
});
