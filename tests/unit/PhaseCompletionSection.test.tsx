// =====================================================
// PhaseCompletionSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseCompletionSection from '../../app/[slug]/dashboard/components/PhaseCompletionSection';

// ── Mocks ────────────────────────────────────────────

vi.mock('@/shared', () => ({
  Icon: ({ children, ...props }: any) => <span data-testid="shared-icon" {...props}>{children}</span>,
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    status: 'paid',
    finalizationDeadline: null,
    completedAt: null,
    createdAt: new Date('2026-06-01').toISOString(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────

describe('PhaseCompletionSection', () => {
  test('renders guidance banner for phase 3', () => {
    render(<PhaseCompletionSection order={createMockOrder()} />);

    expect(
      screen.getByText(/El pedido está en su fase final/)
    ).toBeInTheDocument();
  });

  test('shows countdown when pending with finalizationDeadline', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'esperando_confirmacion',
          finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
        })}
      />
    );

    expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
  });

  test('shows countdown for DELIVERED status with deadline', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'DELIVERED',
          finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
        })}
      />
    );

    expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
  });

  test('shows completed seal for completed status', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'completed',
          completedAt: new Date('2026-06-15').toISOString(),
        })}
      />
    );

    expect(screen.getByText('Pedido Finalizado')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  test('shows completed for finalizado and COMPLETED status', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'COMPLETED',
          completedAt: new Date('2026-06-15').toISOString(),
        })}
      />
    );

    expect(screen.getByText('Pedido Finalizado')).toBeInTheDocument();
  });

  test('shows locked message for inactive phase 3', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({ status: 'paid' })}
      />
    );

    expect(screen.getByText(/estará disponible/)).toBeInTheDocument();
  });

  test('expanded timeline shows 6 items for completed orders', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'completed',
          completedAt: new Date('2026-06-15').toISOString(),
          createdAt: new Date('2026-06-01').toISOString(),
        })}
      />
    );

    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Validado')).toBeInTheDocument();
    expect(screen.getByText('En Reparto')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });
});
