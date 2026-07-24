// =====================================================
// RecentOrders — Unit tests
// =====================================================

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { RecentOrders } from '../../app/[slug]/dashboard/components/RecentOrders';

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-biz/dashboard',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/shared/components/ui/inputs/TextField', () => ({
  TextField: ({ label, value, onChange, onKeyDown, className }: any) => (
    <input
      placeholder={label}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      data-testid="search-input"
      className={className}
    />
  ),
}));

vi.mock('@/shared/components/ui/inputs/Select', () => ({
  Select: ({ label, value, onChange, children, className }: any) => (
    <select value={value} onChange={onChange} data-testid={`select-${label}`} className={className}>
      {children}
    </select>
  ),
  SelectOption: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
  CreditCard: () => <span>CreditCard</span>,
  Eye: ({ size }: any) => (
    <span data-testid="icon-eye" data-size={size}>
      Eye
    </span>
  ),
  FileText: () => <span>FileText</span>,
  IdCard: () => <span>IdCard</span>,
  Loader2: ({ size }: any) => (
    <span data-testid="icon-loader" data-size={size}>
      Loader2
    </span>
  ),
  Package: () => <span>Package</span>,
  Phone: () => <span>Phone</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  Search: ({ size }: any) => (
    <span data-testid="icon-search" data-size={size}>
      Search
    </span>
  ),
  Send: () => <span>Send</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
  Store: () => <span>Store</span>,
  Truck: () => <span>Truck</span>,
  Upload: () => <span>Upload</span>,
  User: () => <span>User</span>,
  X: () => <span>X</span>,
}));

// Mock OrderModal to avoid rendering its full content
vi.mock('../../app/[slug]/dashboard/components/OrderModal', () => ({
  default: ({ order, onClose }: any) => (
    <div data-testid="order-modal">
      <span>Modal for {order.orderNumber || order.id}</span>
      <button onClick={onClose} data-testid="modal-close">
        Close
      </button>
    </div>
  ),
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-001',
    productId: 'prod-1',
    productTitle: 'Test Product',
    productSlug: 'test-product',
    productImage: '/img.jpg',
    amount: '150.00',
    currency: 'PEN',
    paymentMethod: 'yape',
    status: 'paid',
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
    metadata: {},
    createdAt: new Date('2026-06-22T12:00:00').toISOString(),
    businessId: 'biz-1',
    ...overrides,
  };
}

function createManyOrders(count: number) {
  return Array.from({ length: count }, (_, i) =>
    createMockOrder({
      id: `order-${i + 1}`,
      orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
      productTitle: `Product ${i + 1}`,
      amount: `${(i + 1) * 50}.00`,
      status: i % 2 === 0 ? 'paid' : 'completed',
    }),
  );
}

const defaultProps = {
  totalPages: 3,
  currentPage: 1,
  currentStatus: '',
  currentSearch: '',
  currentDate: '',
  businessSlug: 'test-biz',
};

// ── Tests ────────────────────────────────────────────

describe('RecentOrders', () => {
  test('renders order rows with correct data', () => {
    const orders = createManyOrders(3);
    render(<RecentOrders orders={orders} {...defaultProps} />);

    // Each order number should be visible
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();

    // Each product title should be visible
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();

    // Status badges should render (also appears in filter dropdown, use getAllByText)
    expect(screen.getAllByText('Pagado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Finalizado').length).toBeGreaterThanOrEqual(1);
  });

  test('search input works and shows search button for long queries', () => {
    const orders = createManyOrders(3);
    render(<RecentOrders orders={orders} {...defaultProps} />);

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();

    // Type a long query (over 12 chars to trigger search button)
    fireEvent.change(searchInput, { target: { value: 'ORD-001-long-query' } });

    // Search button should now be visible (inside .searchContainer)
    const searchIcons = screen.getAllByTestId('icon-search');
    expect(searchIcons.length).toBeGreaterThan(0);
  });

  test('clicking a row opens order modal', () => {
    const orders = createManyOrders(2);
    render(<RecentOrders orders={orders} {...defaultProps} />);

    // Click the "Ver" button for the first order
    const verButtons = screen.getAllByTitle('Ver detalles del pedido');
    expect(verButtons.length).toBe(2);
    fireEvent.click(verButtons[0]);

    // Modal should appear
    expect(screen.getByTestId('order-modal')).toBeInTheDocument();
    expect(screen.getByText(/Modal for ORD-001/)).toBeInTheDocument();
  });

  test('renders empty state when no orders', () => {
    render(<RecentOrders orders={[]} {...defaultProps} />);

    expect(screen.getByText('No se encontraron pedidos.')).toBeInTheDocument();
  });

  test('renders pagination when totalPages > 1', () => {
    const orders = createManyOrders(10);
    render(<RecentOrders orders={orders} totalPages={3} currentPage={2} {...defaultProps} />);

    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByText(/Página/)).toBeInTheDocument();
  });
});
