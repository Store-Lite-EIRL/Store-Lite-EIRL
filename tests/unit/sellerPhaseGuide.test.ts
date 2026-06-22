import { getSellerPhase } from '@/app/[slug]/dashboard/components/SellerPhaseGuide';
import { describe, expect, test } from 'vitest';

// =====================================================
// SELLER PHASE GUIDE — getSellerPhase() unit tests
// =====================================================
// Table-driven tests covering all V1/V2 statuses and edge cases

type PhaseState = 'completed' | 'current' | 'locked';

interface TestCase {
  status: string;
  expectedPhase: number;
  expectedStates: PhaseState[];
}

const V2_CASES: TestCase[] = [
  {
    status: 'CREATED',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  { status: 'PAID', expectedPhase: 0, expectedStates: ['current', 'locked', 'locked', 'locked'] },
  {
    status: 'PREPARING_ORDER',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'WAITING_CUSTOMER_CONFIRMATION',
    expectedPhase: 1,
    expectedStates: ['completed', 'current', 'locked', 'locked'],
  },
  {
    status: 'READY_TO_SHIP',
    expectedPhase: 1,
    expectedStates: ['completed', 'current', 'locked', 'locked'],
  },
  {
    status: 'IN_TRANSIT',
    expectedPhase: 2,
    expectedStates: ['completed', 'completed', 'current', 'locked'],
  },
  {
    status: 'DELIVERED',
    expectedPhase: 2,
    expectedStates: ['completed', 'completed', 'current', 'locked'],
  },
  {
    status: 'COMPLETED',
    expectedPhase: 3,
    expectedStates: ['completed', 'completed', 'completed', 'current'],
  },
];

const V1_CASES: TestCase[] = [
  {
    status: 'pending',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  { status: 'paid', expectedPhase: 0, expectedStates: ['current', 'locked', 'locked', 'locked'] },
  {
    status: 'processing',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'analizando',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'validando',
    expectedPhase: 1,
    expectedStates: ['completed', 'current', 'locked', 'locked'],
  },
  {
    status: 'aceptado',
    expectedPhase: 1,
    expectedStates: ['completed', 'current', 'locked', 'locked'],
  },
  {
    status: 'delivered',
    expectedPhase: 1,
    expectedStates: ['completed', 'current', 'locked', 'locked'],
  },
  {
    status: 'en_reparto',
    expectedPhase: 2,
    expectedStates: ['completed', 'completed', 'current', 'locked'],
  },
  {
    status: 'esperando_confirmacion',
    expectedPhase: 2,
    expectedStates: ['completed', 'completed', 'current', 'locked'],
  },
  {
    status: 'completed',
    expectedPhase: 3,
    expectedStates: ['completed', 'completed', 'completed', 'current'],
  },
  {
    status: 'finalizado',
    expectedPhase: 3,
    expectedStates: ['completed', 'completed', 'completed', 'current'],
  },
];

const TERMINAL_CASES: TestCase[] = [
  {
    status: 'CANCELLED',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'DISPUTE',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'ISSUE_REPORTED',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'SELLER_TIMEOUT',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  { status: 'failed', expectedPhase: 0, expectedStates: ['current', 'locked', 'locked', 'locked'] },
  {
    status: 'disputed',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'refunded',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'cancelled',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'rechazado',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'refund_requested',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'expired',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  {
    status: 'reported',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
];

const EDGE_CASES: TestCase[] = [
  {
    status: 'unknown_random_status',
    expectedPhase: 0,
    expectedStates: ['current', 'locked', 'locked', 'locked'],
  },
  { status: '', expectedPhase: 0, expectedStates: ['current', 'locked', 'locked', 'locked'] },
];

function runCases(label: string, cases: TestCase[]) {
  describe(label, () => {
    for (const { status, expectedPhase, expectedStates } of cases) {
      test(`${status} → phase ${expectedPhase}`, () => {
        const result = getSellerPhase(status);
        expect(result.currentPhase).toBe(expectedPhase);
        expect(result.phaseStates).toEqual(expectedStates);
      });
    }
  });
}

describe('getSellerPhase', () => {
  runCases('V2 statuses', V2_CASES);
  runCases('V1 legacy statuses', V1_CASES);
  runCases('Terminal statuses', TERMINAL_CASES);
  runCases('Edge cases', EDGE_CASES);

  test('phaseStates always has exactly 4 entries', () => {
    const allStatuses = [...V2_CASES, ...V1_CASES, ...TERMINAL_CASES, ...EDGE_CASES];
    for (const { status } of allStatuses) {
      expect(getSellerPhase(status).phaseStates).toHaveLength(4);
    }
  });
});
