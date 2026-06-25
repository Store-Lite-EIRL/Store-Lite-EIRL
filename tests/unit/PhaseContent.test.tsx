// =====================================================
// PhaseContent — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseContent from '../../app/[slug]/dashboard/components/PhaseContent';

// ── Mocks ────────────────────────────────────────────

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  Calendar: () => <span>Calendar</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
  CreditCard: () => <span>CreditCard</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  IdCard: () => <span>IdCard</span>,
  MapPin: () => <span>MapPin</span>,
  Phone: () => <span>Phone</span>,
  Receipt: () => <span>Receipt</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
  Truck: () => <span>Truck</span>,
  User: () => <span>User</span>,
}));

vi.mock('@/shared', () => ({
  Icon: ({ children, ...props }: any) => (
    <span data-testid="shared-icon" {...props}>
      {children}
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
}));

vi.mock('@/shared/utils/url', () => ({
  getBusinessPath: (slug: string, path: string) => `/${slug}${path}`,
}));

vi.mock('../../app/[slug]/dashboard/components/ShippingSection', () => ({
  default: ({ order }: any) => (
    <div data-testid="shipping-section">
      {order?.courierName && <span>{order.courierName}</span>}
      {order?.trackingNumber && <span>{order.trackingNumber}</span>}
      {order?.pickupCode && <span>{order.pickupCode}</span>}
    </div>
  ),
}));

vi.mock('../../app/[slug]/dashboard/components/TicketSection', () => ({
  default: () => (
    <div data-testid="ticket-section">
      <span>Validación de Ticket</span>
    </div>
  ),
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    status: 'paid',
    orderNumber: 'ORD-001',
    productId: 'prod-1',
    productTitle: 'Test Product',
    productSlug: 'test-product',
    productImage: '/img.jpg',
    amount: '150.00',
    shippingCost: '20.00',
    currency: 'PEN',
    paymentMethod: 'yape',
    shippingType: 'domicilio',
    shippingAgency: 'Olva',
    shippingAddress: 'Av. Test 123',
    shippingDistrict: 'Miraflores',
    shippingProvince: 'Lima',
    shippingDepartment: 'Lima',
    shippingReference: '',
    shippingPhone: '999888777',
    buyerEmail: 'test@example.com',
    maskedDni: '12345678',
    ticketImageUrl: null,
    finalizationDeadline: null,
    completedAt: null,
    courierName: null,
    trackingNumber: null,
    pickupCode: null,
    createdAt: new Date('2026-06-10').toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  businessSlug: 'test-biz',
  onNotifyDelivery: vi.fn(),
  onFinalizeOrder: vi.fn(),
  notifyingDelivery: false,
  finalizingOrder: false,
  ticketFile: null as File | null,
  ticketPreview: null as string | null,
  uploading: false,
  uploadResult: null,
  isEditingTicket: false,
  onTicketFileSelect: vi.fn(),
  onUploadTicket: vi.fn(),
  onCancelUpload: vi.fn(),
  onEditTicket: vi.fn(),
};

// ── Tests ────────────────────────────────────────────

describe('PhaseContent', () => {
  describe('Phase 0 — PEDIDO', () => {
    test('renders buyer and product section', () => {
      render(<PhaseContent order={createMockOrder()} selectedPhase={0} {...defaultProps} />);

      expect(screen.getByText('Comprador y Producto')).toBeInTheDocument();
      expect(screen.getByText(/DNI: 12345678/)).toBeInTheDocument();
      expect(screen.getByText(/Tel: 999888777/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    test('renders payment section', () => {
      render(<PhaseContent order={createMockOrder()} selectedPhase={0} {...defaultProps} />);

      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText('Yape')).toBeInTheDocument();
    });

    test('renders card payment method', () => {
      render(
        <PhaseContent
          order={createMockOrder({ paymentMethod: 'card' })}
          selectedPhase={0}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('Tarjeta de Crédito/Débito')).toBeInTheDocument();
    });

    test('renders shipping info section', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            shippingType: 'agencia',
            shippingAddress: 'Jr. Las Flores 123',
            shippingDistrict: 'Miraflores',
            shippingProvince: 'Lima',
            shippingDepartment: 'Lima',
            shippingAgency: 'Olva',
            shippingPhone: '999888777',
            shippingReference: 'Cerca al parque',
          })}
          selectedPhase={0}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('Datos del Envío')).toBeInTheDocument();
      expect(screen.getAllByText('Agencia').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Jr. Las Flores 123/)).toBeInTheDocument();
      expect(screen.getByText(/Miraflores/)).toBeInTheDocument();
      expect(screen.getByText('Olva')).toBeInTheDocument();
      expect(screen.getByText(/Cerca al parque/)).toBeInTheDocument();
    });

    test('renders recojo shipping type', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            shippingType: 'recojo',
            shippingAddress: null,
            shippingDistrict: null,
            shippingProvince: null,
          })}
          selectedPhase={0}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('Recojo en tienda')).toBeInTheDocument();
    });
  });

  describe('Phase 1 — VALIDACIÓN', () => {
    test('renders ticket validation section', () => {
      render(<PhaseContent order={createMockOrder()} selectedPhase={1} {...defaultProps} />);

      expect(screen.getByText('Validación de Ticket')).toBeInTheDocument();
      expect(screen.getByTestId('ticket-section')).toBeInTheDocument();
    });
  });

  describe('Phase 2 — ENVÍO', () => {
    test('renders shipping section with courier info', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            courierName: 'Shalom',
            trackingNumber: 'TRK-123',
            pickupCode: 'PC-456',
          })}
          selectedPhase={2}
          {...defaultProps}
        />,
      );

      expect(screen.getByTestId('shipping-section')).toBeInTheDocument();
      expect(screen.getByText('Shalom')).toBeInTheDocument();
      expect(screen.getByText('TRK-123')).toBeInTheDocument();
      expect(screen.getByText('PC-456')).toBeInTheDocument();
    });

    test('shows Notificar Entrega for READY_TO_SHIP status', () => {
      render(
        <PhaseContent
          order={createMockOrder({ status: 'READY_TO_SHIP' })}
          selectedPhase={2}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('Notificar Entrega')).toBeInTheDocument();
    });

    test('shows Notificar Llegada for IN_TRANSIT status', () => {
      render(
        <PhaseContent
          order={createMockOrder({ status: 'IN_TRANSIT' })}
          selectedPhase={2}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('Notificar Llegada')).toBeInTheDocument();
    });
  });

  describe('Phase 3 — CERRADO', () => {
    test('shows pending confirmation for esperando_confirmacion', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            status: 'esperando_confirmacion',
            finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
          })}
          selectedPhase={3}
          {...defaultProps}
        />,
      );

      expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
      expect(screen.getByText(/julio/)).toBeInTheDocument();
    });

    test('shows completed seal for completed status', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            status: 'completed',
            completedAt: new Date('2026-06-15').toISOString(),
          })}
          selectedPhase={3}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('¡Pedido Finalizado!')).toBeInTheDocument();
    });

    test('shows locked message for inactive phase 3', () => {
      render(
        <PhaseContent
          order={createMockOrder({ status: 'paid' })}
          selectedPhase={3}
          {...defaultProps}
        />,
      );

      expect(screen.getByText(/estará disponible/)).toBeInTheDocument();
    });

    test('shows countdown when pending with finalizationDeadline', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            status: 'esperando_confirmacion',
            finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
          })}
          selectedPhase={3}
          {...defaultProps}
        />,
      );

      expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
      expect(screen.getByText(/julio de 2026/)).toBeInTheDocument();
    });

    test('shows timeline when completed', () => {
      render(
        <PhaseContent
          order={createMockOrder({
            status: 'completed',
            completedAt: new Date('2026-06-15').toISOString(),
            createdAt: new Date('2026-06-01').toISOString(),
          })}
          selectedPhase={3}
          {...defaultProps}
        />,
      );

      expect(screen.getByText('¡Pedido Finalizado!')).toBeInTheDocument();
      expect(screen.getByText('Creado')).toBeInTheDocument();
      expect(screen.getByText('Completado')).toBeInTheDocument();
    });
  });

  describe('Pickup (recojo) phase mapping', () => {
    test('renders shipping section at phase 1 for pickup', () => {
      render(
        <PhaseContent
          order={createMockOrder({ shippingType: 'recojo', status: 'READY_TO_SHIP' })}
          selectedPhase={1}
          {...defaultProps}
          shippingType="recojo"
        />,
      );

      expect(screen.getByTestId('shipping-section')).toBeInTheDocument();
      expect(screen.queryByTestId('ticket-section')).not.toBeInTheDocument();
    });

    test('renders completion section at phase 2 for pickup', () => {
      render(
        <PhaseContent
          order={createMockOrder({ shippingType: 'recojo', status: 'COMPLETED' })}
          selectedPhase={2}
          {...defaultProps}
          shippingType="recojo"
        />,
      );

      expect(screen.getByText('¡Pedido Finalizado!')).toBeInTheDocument();
    });
  });
});
