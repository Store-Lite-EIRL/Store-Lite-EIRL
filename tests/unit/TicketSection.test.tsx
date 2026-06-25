// =====================================================
// TicketSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TicketSection from '../../app/[slug]/dashboard/components/TicketSection';

// ── Mocks ────────────────────────────────────────────

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ size }: any) => (
    <span data-testid="icon-alert" data-size={size}>
      AlertTriangle
    </span>
  ),
  CheckCircle: ({ size }: any) => (
    <span data-testid="icon-check" data-size={size}>
      CheckCircle
    </span>
  ),
  Clock: ({ size }: any) => (
    <span data-testid="icon-clock" data-size={size}>
      Clock
    </span>
  ),
  CreditCard: ({ size }: any) => (
    <span data-testid="icon-creditcard" data-size={size}>
      CreditCard
    </span>
  ),
  FileText: ({ size }: any) => (
    <span data-testid="icon-file" data-size={size}>
      FileText
    </span>
  ),
  RefreshCw: ({ size }: any) => (
    <span data-testid="icon-refresh" data-size={size}>
      RefreshCw
    </span>
  ),
  Search: ({ size }: any) => (
    <span data-testid="icon-search" data-size={size}>
      Search
    </span>
  ),
  Send: ({ size }: any) => (
    <span data-testid="icon-send" data-size={size}>
      Send
    </span>
  ),
  Truck: ({ size }: any) => (
    <span data-testid="icon-truck" data-size={size}>
      Truck
    </span>
  ),
  Upload: ({ size }: any) => (
    <span data-testid="icon-upload" data-size={size}>
      Upload
    </span>
  ),
  X: ({ size }: any) => (
    <span data-testid="icon-x" data-size={size}>
      X
    </span>
  ),
  HelpCircle: () => <span>HelpCircle</span>,
  XCircle: ({ size }: any) => (
    <span data-testid="icon-xcircle" data-size={size}>
      XCircle
    </span>
  ),
}));

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
  ButtonGroup: ({ children }: any) => <div>{children}</div>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    status: 'paid',
    ticketImageUrl: null,
    ...overrides,
  };
}

const defaultCallbacks = {
  onFileSelect: vi.fn(),
  onUpload: vi.fn(),
  onCancel: vi.fn(),
  onEdit: vi.fn(),
};

// ── Tests ────────────────────────────────────────────

describe('TicketSection', () => {
  describe('upload form (no ticket)', () => {
    test('renders upload prompt when no ticket exists', () => {
      render(
        <TicketSection
          order={createMockOrder()}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Subir comprobante de envío')).toBeInTheDocument();
      expect(screen.getByText('Seleccionar Imagen')).toBeInTheDocument();
    });

    test('shows preview when ticketFile is selected', () => {
      render(
        <TicketSection
          order={createMockOrder()}
          ticketFile={new File([''], 'test.jpg', { type: 'image/jpeg' })}
          ticketPreview="data:image/jpeg;base64,test"
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Enviar Ticket')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    test('shows loading state during upload', () => {
      render(
        <TicketSection
          order={createMockOrder()}
          ticketFile={new File([''], 'test.jpg', { type: 'image/jpeg' })}
          ticketPreview="data:image/jpeg;base64,test"
          uploading={true}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Subiendo...')).toBeInTheDocument();
    });
  });

  describe('ticket view (has ticket)', () => {
    test('renders ticket image when ticketImageUrl exists', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'completed' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      const img = screen.getByAltText('Comprobante de envío');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/ticket.jpg');
    });

    test('shows edit button for validando status', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'validando' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Editar Ticket')).toBeInTheDocument();
    });

    test('shows re-subir button for disputed status', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'disputed' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Re-subir Ticket')).toBeInTheDocument();
    });

    test('does NOT show Notificar Entrega for delivered/READY_TO_SHIP status', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'READY_TO_SHIP' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.queryByText('Notificar Entrega')).not.toBeInTheDocument();
    });

    test('does NOT show Notificar Llegada for IN_TRANSIT status', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'IN_TRANSIT' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.queryByText('Notificar Llegada')).not.toBeInTheDocument();
    });

    test('shows link indicator directing to Envío phase for delivery actions', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'READY_TO_SHIP' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText(/Andá a la fase Envío/)).toBeInTheDocument();
    });
  });

  describe('editing state', () => {
    test('shows preview with upload button when isEditingTicket with preview', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'validando' })}
          ticketFile={new File([''], 'new.jpg', { type: 'image/jpeg' })}
          ticketPreview="data:image/jpeg;base64,newpreview"
          uploading={false}
          uploadResult={null}
          isEditingTicket={true}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Actualizar Ticket')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    test('shows edit upload selection when isEditingTicket but no preview yet', () => {
      render(
        <TicketSection
          order={createMockOrder({ ticketImageUrl: '/ticket.jpg', status: 'validando' })}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={null}
          isEditingTicket={true}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Editar comprobante de envío')).toBeInTheDocument();
      expect(screen.getByText('Seleccionar Imagen')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    test('shows error message when upload fails', () => {
      render(
        <TicketSection
          order={createMockOrder()}
          ticketFile={null}
          ticketPreview={null}
          uploading={false}
          uploadResult={{ success: false, error: 'Error de prueba' }}
          isEditingTicket={false}
          {...defaultCallbacks}
        />,
      );

      expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    });
  });
});
