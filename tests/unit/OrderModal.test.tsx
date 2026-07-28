// =====================================================
// OrderModal — Component tests
// =====================================================

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import OrderModal from '../../app/[slug]/(app)/dashboard/components/OrderModal';

// ── Mocks ────────────────────────────────────────────

// Mock actions
const mockNotifyDelivery = vi.fn();
const mockUploadTicketAndUpdatePayment = vi.fn();
const mockRequestFinalization = vi.fn();

vi.mock('@/features/dashboard/actions/ticketActions', () => ({
  notifyDelivery: (...args: any[]) => mockNotifyDelivery(...args),
  uploadTicketAndUpdatePayment: (...args: any[]) => mockUploadTicketAndUpdatePayment(...args),
}));

vi.mock('@/features/dashboard/actions/finalizationActions', () => ({
  requestFinalization: (...args: any[]) => mockRequestFinalization(...args),
}));

// Mock child components
vi.mock('../../app/[slug]/(app)/dashboard/components/HelpPanel', () => ({
  default: ({ selectedPhase }: any) => (
    <div data-testid="help-panel" data-phase={selectedPhase}>
      HelpPanel
    </div>
  ),
}));

vi.mock('../../app/[slug]/(app)/dashboard/components/PhaseContent', () => ({
  default: ({ order, selectedPhase, ...props }: any) => (
    <div data-testid="phase-content" data-phase={selectedPhase}>
      PhaseContent for {order.id} phase {selectedPhase}
    </div>
  ),
}));

vi.mock('../../app/[slug]/(app)/dashboard/components/SellerPhaseGuide', () => ({
  __esModule: true,
  default: ({ selectedPhase, phases, onSelect }: any) => (
    <div data-testid="seller-phase-guide" data-selected={selectedPhase}>
      <button onClick={() => onSelect(1)} data-testid="phase-btn-1">
        Phase 1
      </button>
    </div>
  ),
  getSellerPhase: (status: string) => {
    return { currentPhase: 0, phaseStates: ['current', 'locked', 'locked', 'locked'] };
  },
  SELLER_PHASES: [
    { label: 'Pedido', icon: 'payments', description: 'Pedido recibido y pagado' },
    { label: 'Validación', icon: 'fact_check', description: 'Ticket de envío' },
    { label: 'Envío', icon: 'local_shipping', description: 'Paquete en tránsito' },
    { label: 'Cerrado', icon: 'verified', description: 'Pedido finalizado' },
  ],
  PICKUP_SELLER_PHASES: [
    { label: 'Pedido', icon: 'payments', description: 'Pedido recibido y pagado' },
    { label: 'Recojo', icon: 'store', description: 'Cliente recoge en tienda' },
    { label: 'Cerrado', icon: 'verified', description: 'Pedido finalizado' },
  ],
}));

// Mock @/shared
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

vi.mock('@/shared/components/ui/buttons/IconButton', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="icon-button" {...props}>
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="icon-button" {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span>AlertTriangle</span>,
  Calendar: () => <span>Calendar</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
  CreditCard: () => <span>CreditCard</span>,
  HelpCircle: () => <span>HelpCircle</span>,
  Info: () => <span>Info</span>,
  Package: () => <span>Package</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  Search: () => <span>Search</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
  Store: () => <span>Store</span>,
  Truck: () => <span>Truck</span>,
  X: () => <span>X</span>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-001',
    businessId: 'biz-1',
    status: 'paid',
    productTitle: 'Test Product',
    productId: 'prod-1',
    productSlug: 'test-product',
    productImage: '/img.jpg',
    amount: '150.00',
    currency: 'PEN',
    paymentMethod: 'yape',
    shippingType: 'domicilio',
    shippingAgency: 'Olva',
    shippingAddress: 'Av. Test 123',
    shippingDistrict: 'Miraflores',
    shippingProvince: 'Lima',
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
    createdAt: new Date('2026-06-22T12:00:00').toISOString(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────

describe('OrderModal', () => {
  const onClose = vi.fn();
  const onOrderUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal with order header', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('shows Cerrar button in footer', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    expect(screen.getByText('Cerrar')).toBeInTheDocument();
  });

  test('calls onClose when Cerrar is clicked', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    fireEvent.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders tabs and switches between them', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    // Default shows Detalles tab content
    expect(screen.getByTestId('phase-content')).toBeInTheDocument();

    // Click Ayuda tab
    fireEvent.click(screen.getByText('Ayuda'));
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('phase-content')).not.toBeInTheDocument();

    // Click Detalles tab
    fireEvent.click(screen.getByText('Detalles'));
    expect(screen.getByTestId('phase-content')).toBeInTheDocument();
    expect(screen.queryByTestId('help-panel')).not.toBeInTheDocument();
  });

  test('renders SellerPhaseGuide', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    expect(screen.getByTestId('seller-phase-guide')).toBeInTheDocument();
  });

  test('updates selectedPhase when SellerPhaseGuide triggers onSelect', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    // Click phase 1 button in the phase guide mock
    fireEvent.click(screen.getByTestId('phase-btn-1'));

    // PhaseContent should now show phase 1
    expect(screen.getByTestId('phase-content')).toHaveAttribute('data-phase', '1');
  });

  test('switches back to Detalles tab when phase changes during Ayuda tab', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    // Switch to Ayuda tab
    fireEvent.click(screen.getByText('Ayuda'));
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();

    // Click phase button — should switch back to Detalles
    fireEvent.click(screen.getByTestId('phase-btn-1'));
    expect(screen.getByTestId('phase-content')).toBeInTheDocument();
    expect(screen.queryByTestId('help-panel')).not.toBeInTheDocument();
  });

  test('renders status badge in hero header', () => {
    render(
      <OrderModal
        order={createMockOrder()}
        businessSlug="test-biz"
        onClose={onClose}
        onOrderUpdate={onOrderUpdate}
      />,
    );

    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });
});
