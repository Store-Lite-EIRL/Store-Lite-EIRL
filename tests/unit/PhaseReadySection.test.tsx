// =====================================================
// PhaseReadySection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseReadySection from '../../app/[slug]/dashboard/components/PhaseReadySection';

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
  CreditCard: () => <span>CreditCard</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  IdCard: () => <span>IdCard</span>,
  MapPin: () => <span>MapPin</span>,
  Phone: () => <span>Phone</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
  User: () => <span>User</span>,
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
    currency: 'PEN',
    paymentMethod: 'yape',
    shippingType: 'domicilio',
    shippingAgency: 'Olva',
    shippingAddress: 'Av. Test 123',
    shippingDistrict: 'Miraflores',
    shippingProvince: 'Lima',
    shippingDepartment: 'Lima',
    shippingReference: 'Cerca al parque',
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
};

// ── Tests ────────────────────────────────────────────

describe('PhaseReadySection', () => {
  test('renders buyer and product section', () => {
    render(<PhaseReadySection order={createMockOrder()} {...defaultProps} />);

    expect(screen.getByText('Comprador y Producto')).toBeInTheDocument();
    expect(screen.getByText(/DNI: 12345678/)).toBeInTheDocument();
    expect(screen.getByText(/Tel: 999888777/)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('renders payment section', () => {
    render(<PhaseReadySection order={createMockOrder()} {...defaultProps} />);

    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Yape')).toBeInTheDocument();
  });

  test('renders card payment method', () => {
    render(
      <PhaseReadySection order={createMockOrder({ paymentMethod: 'card' })} {...defaultProps} />,
    );

    expect(screen.getByText('Tarjeta de Crédito/Débito')).toBeInTheDocument();
  });

  test('renders shipping info section', () => {
    render(
      <PhaseReadySection
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
        {...defaultProps}
      />,
    );

    expect(screen.getByText('Datos del Envío')).toBeInTheDocument();
    expect(screen.getByText(/Jr. Las Flores 123/)).toBeInTheDocument();
    expect(screen.getByText(/Miraflores/)).toBeInTheDocument();
    expect(screen.getByText('Olva')).toBeInTheDocument();
    expect(screen.getByText(/Cerca al parque/)).toBeInTheDocument();
  });

  test('renders recojo shipping type', () => {
    render(
      <PhaseReadySection
        order={createMockOrder({
          shippingType: 'recojo',
          shippingAddress: null,
          shippingDistrict: null,
          shippingProvince: null,
        })}
        {...defaultProps}
      />,
    );

    expect(screen.getAllByText('Recojo en tienda').length).toBeGreaterThanOrEqual(1);
  });
});
