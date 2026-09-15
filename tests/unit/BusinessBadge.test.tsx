import BusinessBadge from '@/features/business/components/BusinessBadge';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('BusinessBadge', () => {
  const defaultProps = {
    kybVerified: false,
    trustLevel: 'new' as const,
    verifiedComplaints30d: 0,
    incompleteRate30d: 0,
  };

  it('renders green "Negocio Verificado" badge when kybVerified + trustLevel=verified', () => {
    render(<BusinessBadge {...defaultProps} kybVerified={true} trustLevel="verified" />);
    const badge = screen.getByText('Negocio Verificado');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: expect.stringContaining('green') });
  });

  it('renders blue "Confiable" badge when trustLevel=confiable', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="confiable" />);
    const badge = screen.getByText('Confiable');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: expect.stringContaining('blue') });
  });

  it('renders yellow "Advertencia" badge when trustLevel=warning', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="warning" />);
    const badge = screen.getByText('Advertencia');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: expect.stringContaining('yellow') });
  });

  it('renders red "Cuenta Desactivada" badge when trustLevel=deactivated', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="deactivated" />);
    const badge = screen.getByText('Cuenta Desactivada');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: expect.stringContaining('red') });
  });

  it('renders gray "Nuevo" badge when trustLevel=new', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="new" />);
    const badge = screen.getByText('Nuevo');
    expect(badge).toBeInTheDocument();
  });

  it('shows complaint count tooltip when verifiedComplaints30d >= 2', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="warning" verifiedComplaints30d={3} />);
    const badge = screen.getByTestId('business-badge-warning');
    expect(badge).toHaveAttribute('title', expect.stringContaining('3 denuncias verificadas'));
  });

  it('does not show complaint tooltip when verifiedComplaints30d < 2', () => {
    render(<BusinessBadge {...defaultProps} trustLevel="warning" verifiedComplaints30d={1} />);
    const badge = screen.getByTestId('business-badge-warning');
    expect(badge).not.toHaveAttribute('title');
  });

  it('applies correct data-testid for each trust level', () => {
    const { rerender } = render(
      <BusinessBadge {...defaultProps} trustLevel="verified" kybVerified={true} />,
    );
    expect(screen.getByTestId('business-badge-verified')).toBeInTheDocument();

    rerender(<BusinessBadge {...defaultProps} trustLevel="confiable" />);
    expect(screen.getByTestId('business-badge-confiable')).toBeInTheDocument();

    rerender(<BusinessBadge {...defaultProps} trustLevel="warning" />);
    expect(screen.getByTestId('business-badge-warning')).toBeInTheDocument();

    rerender(<BusinessBadge {...defaultProps} trustLevel="deactivated" />);
    expect(screen.getByTestId('business-badge-deactivated')).toBeInTheDocument();

    rerender(<BusinessBadge {...defaultProps} trustLevel="new" />);
    expect(screen.getByTestId('business-badge-new')).toBeInTheDocument();
  });
});
