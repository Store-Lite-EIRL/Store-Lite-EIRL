// =====================================================
// PhaseTicketSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseTicketSection from '../../app/[slug]/(app)/dashboard/components/PhaseTicketSection';

// ── Mocks ────────────────────────────────────────────

vi.mock('@/shared/components/ui/buttons/Button', () => ({
  default: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('../../app/[slug]/(app)/dashboard/components/TicketSection', () => ({
  default: () => <div data-testid="ticket-section">TicketSection Mock</div>,
}));

// ── Fixtures ─────────────────────────────────────────

const defaultProps = {
  order: { id: 'order-1', status: 'paid', ticketImageUrl: null },
  ticketFile: null as File | null,
  ticketPreview: null as string | null,
  uploading: false,
  uploadResult: null,
  isEditingTicket: false,
  onFileSelect: vi.fn(),
  onUpload: vi.fn(),
  onCancel: vi.fn(),
  onEdit: vi.fn(),
};

// ── Tests ────────────────────────────────────────────

describe('PhaseTicketSection', () => {
  test('renders ticket section', () => {
    render(<PhaseTicketSection {...defaultProps} />);

    expect(screen.getByTestId('ticket-section')).toBeInTheDocument();
  });
});
