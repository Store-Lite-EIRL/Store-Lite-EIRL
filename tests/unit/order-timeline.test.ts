import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────
// mockDb is a plain object evaluated BEFORE imports trigger the mock factory.
// vi.mock factory only references mockDb INSIDE vi.fn() callbacks (lazy eval),
// avoiding the temporal-dead-zone issue with hoisted vi.mock().

const mockDb = {
  insertValues: vi.fn(() => ({ returning: mockDb.insertReturning })),
  insertReturning: vi.fn(),
  findMany: vi.fn(),
};

vi.mock('@/core/database/client', () => ({
  db: {
    insert: vi.fn(() => ({ values: mockDb.insertValues })),
    get query() {
      return { orderTimelineEvents: { findMany: mockDb.findMany } };
    },
  },
}));

import { getTimeline, recordEvent } from '@/core/orders/order-timeline';

// ── Helpers ────────────────────────────────────────

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_001',
    orderId: 'pay_001',
    eventType: 'ORDER_PAID' as const,
    actorType: 'system' as const,
    actorId: null,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Suite: recordEvent ─────────────────────────────

describe('recordEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts event and returns it', async () => {
    mockDb.insertReturning.mockResolvedValue([makeEvent()]);

    const event = await recordEvent({
      orderId: 'pay_001',
      eventType: 'ORDER_PAID',
      actorType: 'system',
    });

    expect(event.id).toBe('evt_001');
    expect(event.eventType).toBe('ORDER_PAID');
  });

  test('passes correct values to insert', async () => {
    mockDb.insertReturning.mockResolvedValue([makeEvent()]);

    await recordEvent({
      orderId: 'pay_001',
      eventType: 'ORDER_PREPARING',
      actorType: 'seller',
      actorId: 'usr_123',
    });

    expect(mockDb.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'pay_001',
        eventType: 'ORDER_PREPARING',
        actorType: 'seller',
        actorId: 'usr_123',
      }),
    );
  });

  test('sets actorId to null when not provided', async () => {
    mockDb.insertReturning.mockResolvedValue([makeEvent()]);

    await recordEvent({
      orderId: 'pay_001',
      eventType: 'ORDER_PAID',
      actorType: 'system',
    });

    expect(mockDb.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: null }),
    );
  });

  test('stores metadata as passed', async () => {
    mockDb.insertReturning.mockResolvedValue([makeEvent()]);
    const meta = { fromStatus: 'PAID', toStatus: 'PREPARING_ORDER' };

    await recordEvent({
      orderId: 'pay_001',
      eventType: 'ORDER_PREPARING',
      actorType: 'system',
      metadata: meta,
    });

    expect(mockDb.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: meta }),
    );
  });
});

// ── Suite: getTimeline ─────────────────────────────

describe('getTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns events for an order', async () => {
    const events = [makeEvent(), makeEvent({ id: 'evt_002', eventType: 'ORDER_COMPLETED' })];
    mockDb.findMany.mockResolvedValue(events);

    const result = await getTimeline('pay_001');

    expect(result).toHaveLength(2);
    expect(mockDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Function) }),
    );
  });

  test('includes desc orderBy on createdAt', async () => {
    mockDb.findMany.mockResolvedValue([makeEvent()]);

    await getTimeline('pay_001');

    expect(mockDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: expect.any(Function) }),
    );
  });

  test('returns empty array for order with no events', async () => {
    mockDb.findMany.mockResolvedValue([]);

    const result = await getTimeline('pay_nonexistent');

    expect(result).toEqual([]);
  });
});
