import ComplaintBanner from '@/features/business/components/ComplaintBanner';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ComplaintBanner', () => {
  it('renders warning banner when verifiedComplaints30d >= 2', () => {
    render(
      <ComplaintBanner
        verifiedComplaints30d={3}
        deactivationRisk="none"
        businessName="Test Business"
      />,
    );
    expect(
      screen.getByText('Este negocio tiene 3 denuncias verificadas en los últimos 30 días'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('complaint-banner')).toHaveStyle({
      backgroundColor: expect.stringContaining('yellow'),
    });
  });

  it('renders warning banner when deactivationRisk is verified_complaints', () => {
    render(
      <ComplaintBanner
        verifiedComplaints30d={5}
        deactivationRisk="verified_complaints"
        businessName="Test Business"
      />,
    );
    expect(
      screen.getByText('Este negocio tiene 5 denuncias verificadas en los últimos 30 días'),
    ).toBeInTheDocument();
  });

  it('renders warning banner when deactivationRisk is incomplete_orders', () => {
    render(
      <ComplaintBanner
        verifiedComplaints30d={1}
        deactivationRisk="incomplete_orders"
        businessName="Test Business"
      />,
    );
    expect(
      screen.getByText('Este negocio tiene 1 denuncia verificada en los últimos 30 días'),
    ).toBeInTheDocument();
  });

  it('does not render when no risk and < 2 complaints', () => {
    render(
      <ComplaintBanner
        verifiedComplaints30d={0}
        deactivationRisk="none"
        businessName="Test Business"
      />,
    );
    expect(screen.queryByTestId('complaint-banner')).not.toBeInTheDocument();
  });

  it('does not render when 1 complaint and no risk', () => {
    render(
      <ComplaintBanner
        verifiedComplaints30d={1}
        deactivationRisk="none"
        businessName="Test Business"
      />,
    );
    expect(screen.queryByTestId('complaint-banner')).not.toBeInTheDocument();
  });

  it('uses correct singular/plural text', () => {
    const { rerender } = render(
      <ComplaintBanner
        verifiedComplaints30d={1}
        deactivationRisk="verified_complaints"
        businessName="Test Business"
      />,
    );
    expect(
      screen.getByText('Este negocio tiene 1 denuncia verificada en los últimos 30 días'),
    ).toBeInTheDocument();

    rerender(
      <ComplaintBanner
        verifiedComplaints30d={2}
        deactivationRisk="verified_complaints"
        businessName="Test Business"
      />,
    );
    expect(
      screen.getByText('Este negocio tiene 2 denuncias verificadas en los últimos 30 días'),
    ).toBeInTheDocument();
  });
});
