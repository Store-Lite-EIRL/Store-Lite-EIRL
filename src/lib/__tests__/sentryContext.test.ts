import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setSentryContext } from '../sentryContext';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockSetUser = vi.fn();
const mockSetTag = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  setUser: (...args: unknown[]) => mockSetUser(...args),
  setTag: (...args: unknown[]) => mockSetTag(...args),
}));

describe('setSentryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets user id when authenticated', () => {
    setSentryContext({ id: 'user-123' });

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' });
  });

  it('does not set user when called without user', () => {
    setSentryContext(undefined);

    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('sets business_id and plan tags when business is provided', () => {
    setSentryContext({ id: 'user-1' }, { id: 'biz-42', plan: 'pro' });

    expect(mockSetTag).toHaveBeenCalledWith('business_id', 'biz-42');
    expect(mockSetTag).toHaveBeenCalledWith('plan', 'pro');
  });

  it('sets business_id with "none" when plan is not provided', () => {
    setSentryContext({ id: 'user-1' }, { id: 'biz-99' });

    expect(mockSetTag).toHaveBeenCalledWith('business_id', 'biz-99');
    expect(mockSetTag).toHaveBeenCalledWith('plan', 'none');
  });

  it('does not set business tags when business is not provided', () => {
    setSentryContext({ id: 'user-1' });

    expect(mockSetTag).not.toHaveBeenCalled();
  });
});
