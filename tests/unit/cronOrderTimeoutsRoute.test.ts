// =====================================================
// Cron route: order-timeouts — DS 011 wiring tests (FU-1)
// processExpiredGracePeriods + processAppealSLABreaches
// hooked into the EXISTING T16 cron (no new cron routes).
// =====================================================

import { GET } from '@/app/api/cron/order-timeouts/route';
import { env } from '@/config/env';
import { processTimeouts } from '@/core/orders/orderTimeouts';
import { processAppealSLABreaches, processExpiredGracePeriods } from '@/lib/deactivation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

vi.mock('@/config/env', () => ({
  env: { cronSecret: 'test-cron-secret' },
}));

vi.mock('@/core/orders/orderTimeouts', () => ({
  processTimeouts: vi.fn(),
}));

vi.mock('@/lib/deactivation', () => ({
  processExpiredGracePeriods: vi.fn(),
  processAppealSLABreaches: vi.fn(),
}));

const mockedProcessTimeouts = vi.mocked(processTimeouts);
const mockedGracePeriods = vi.mocked(processExpiredGracePeriods);
const mockedAppealSla = vi.mocked(processAppealSLABreaches);

// ── Helpers ──────────────────────────────────────────

function cronRequest(options: { token?: string; bearer?: string } = {}): Request {
  const url =
    options.token !== undefined
      ? `http://localhost/api/cron/order-timeouts?token=${options.token}`
      : 'http://localhost/api/cron/order-timeouts';
  const headers: Record<string, string> = {};
  if (options.bearer !== undefined) {
    headers.Authorization = `Bearer ${options.bearer}`;
  }
  return new Request(url, { method: 'GET', headers });
}

// ── Suite ────────────────────────────────────────────

describe('GET /api/cron/order-timeouts — DS 011 wiring (FU-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedProcessTimeouts.mockResolvedValue({ processed: 7, errors: 0 });
    mockedGracePeriods.mockResolvedValue({ processed: 2, errors: 0 });
    mockedAppealSla.mockResolvedValue({ processed: 1, errors: 0 });
  });

  test('401 when no token is provided', async () => {
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
    expect(mockedProcessTimeouts).not.toHaveBeenCalled();
  });

  test('401 when the token does not match CRON_SECRET', async () => {
    const res = await GET(cronRequest({ token: 'wrong' }));
    expect(res.status).toBe(401);
    expect(mockedProcessTimeouts).not.toHaveBeenCalled();
  });

  test('flag ON: runs the timeouts AND the two DS 011 deactivation sweeps', async () => {
    vi.stubEnv('ENABLE_AUTO_DEACTIVATION', 'true');
    const res = await GET(cronRequest({ bearer: env.cronSecret }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockedProcessTimeouts).toHaveBeenCalled();
    expect(mockedGracePeriods).toHaveBeenCalled();
    expect(mockedAppealSla).toHaveBeenCalled();
    expect(body).toMatchObject({
      success: true,
      processed: 7,
      errors: 0,
      gracePeriodsProcessed: 2,
      appealSlaProcessed: 1,
      autoDeactivationErrors: 0,
    });
  });

  test('flag OFF: only the standard timeouts run; DS 011 sweeps are skipped', async () => {
    vi.stubEnv('ENABLE_AUTO_DEACTIVATION', 'false');
    const res = await GET(cronRequest({ token: 'test-cron-secret' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockedProcessTimeouts).toHaveBeenCalled();
    expect(mockedGracePeriods).not.toHaveBeenCalled();
    expect(mockedAppealSla).not.toHaveBeenCalled();
    expect(body.autoDeactivationErrors).toBeUndefined();
  });

  test('non-fatal: a throwing sweep still yields success with its error count', async () => {
    vi.stubEnv('ENABLE_AUTO_DEACTIVATION', 'true');
    mockedGracePeriods.mockRejectedValueOnce(new Error('db hiccup'));
    const res = await GET(cronRequest({ token: 'test-cron-secret' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(7);
    expect(body.autoDeactivationErrors).toBe(1);
    expect(mockedAppealSla).toHaveBeenCalled(); // second sweep still attempted
  });

  test('500 when the standard timeout processing itself fails (existing behavior preserved)', async () => {
    mockedProcessTimeouts.mockRejectedValueOnce(new Error('boom'));
    const res = await GET(cronRequest({ token: 'test-cron-secret' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
