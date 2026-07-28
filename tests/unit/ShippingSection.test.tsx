// =====================================================
// ShippingSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ShippingSection from '../../app/[slug]/(app)/dashboard/components/ShippingSection';

// ── Mock next/image ──────────────────────────────────
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// ── Mock lucide-react icons ──────────────────────────
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="icon-alert">AlertTriangle</span>,
  CheckCircle: () => <span data-testid="icon-check">CheckCircle</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  CreditCard: () => <span data-testid="icon-creditcard">CreditCard</span>,
  Home: () => <span data-testid="icon-home">Home</span>,
  MapPin: () => <span data-testid="icon-map-pin">MapPin</span>,
  Package: () => <span data-testid="icon-package">Package</span>,
  RefreshCw: () => <span data-testid="icon-refresh">RefreshCw</span>,
  Search: () => <span data-testid="icon-search">Search</span>,
  Store: () => <span data-testid="icon-store">Store</span>,
  Truck: () => <span data-testid="icon-truck">Truck</span>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    status: 'paid',
    shippingType: 'domicilio',
    shippingAgency: 'Olva',
    shippingDistrict: 'Miraflores',
    shippingProvince: 'Lima',
    shippingAddress: 'Av. Principal 123',
    shippingReference: 'Cerca al parque',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────

describe('ShippingSection', () => {
  describe('domicilio type', () => {
    test('renders delivery card with address info', () => {
      const order = createMockOrder({ status: 'paid', shippingType: 'domicilio' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Envío a Domicilio')).toBeInTheDocument();
      expect(
        screen.getByText('El paquete va directo al domicilio del comprador.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Miraflores, Lima')).toBeInTheDocument();
      expect(screen.getByText('Av. Principal 123')).toBeInTheDocument();
    });

    test('renders shipping reference when available', () => {
      const order = createMockOrder({ shippingReference: 'Cerca al parque' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText(/Ref: Cerca al parque/)).toBeInTheDocument();
    });

    test('does not show agency-style Destino for domicilio', () => {
      const order = createMockOrder({ shippingType: 'domicilio' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Envío a Domicilio')).toBeInTheDocument();
      expect(screen.queryByText('Envío por Agencia')).not.toBeInTheDocument();
    });
  });

  describe('agencia type', () => {
    test('renders agency card with Destino label', () => {
      const order = createMockOrder({ shippingType: 'agencia' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Envío por Agencia')).toBeInTheDocument();
      expect(screen.getByText('Olva')).toBeInTheDocument();
      expect(screen.getByText('Destino')).toBeInTheDocument();
      expect(screen.getByText('Miraflores, Lima')).toBeInTheDocument();
    });
  });

  describe('recojo type', () => {
    test('renders pickup card without delivery/agency labels', () => {
      const order = createMockOrder({ shippingType: 'recojo' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Recojo en Tienda')).toBeInTheDocument();
      expect(screen.queryByText('Envío a Domicilio')).not.toBeInTheDocument();
      expect(screen.queryByText('Envío por Agencia')).not.toBeInTheDocument();
    });
  });

  describe('status tags', () => {
    test('renders status tag for paid status', () => {
      render(<ShippingSection order={createMockOrder({ status: 'paid' })} />);

      expect(screen.getByText('paid')).toBeInTheDocument();
    });
  });
});
