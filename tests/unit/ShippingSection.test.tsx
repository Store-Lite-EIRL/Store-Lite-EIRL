// =====================================================
// ShippingSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ShippingSection from '../../app/[slug]/dashboard/components/ShippingSection';

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
    test('renders route from Inicio to Destino through Agencia', () => {
      const order = createMockOrder({ status: 'paid', shippingType: 'domicilio' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Ruta de Entrega')).toBeInTheDocument();
      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Agencia')).toBeInTheDocument();
      expect(screen.getByText('Destino')).toBeInTheDocument();
      expect(screen.getByText('Miraflores, Lima')).toBeInTheDocument();
      expect(screen.getByText('Av. Principal 123')).toBeInTheDocument();
    });

    test('renders shipping reference when available', () => {
      const order = createMockOrder({ shippingReference: 'Cerca al parque' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText(/Ref: Cerca al parque/)).toBeInTheDocument();
    });

    test('does not render Destino when shipping type is not domicilio', () => {
      const order = createMockOrder({ shippingType: 'agencia' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Agencia')).toBeInTheDocument();
      expect(screen.queryByText('Destino')).not.toBeInTheDocument();
    });
  });

  describe('recojo type', () => {
    test('renders only Inicio without Agencia/Destino', () => {
      const order = createMockOrder({ shippingType: 'recojo' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.queryByText('Agencia')).not.toBeInTheDocument();
      expect(screen.queryByText('Destino')).not.toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    test('renders progress bar with percentage', () => {
      const order = createMockOrder({ status: 'paid' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText(/10%/)).toBeInTheDocument();
    });

    test('shows 100% for completed status', () => {
      const order = createMockOrder({ status: 'completed' });
      render(<ShippingSection order={order} />);

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });
});
