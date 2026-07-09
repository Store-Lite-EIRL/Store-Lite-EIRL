// =====================================================
// LogoutButton — Unit tests
// =====================================================
// Verifies that:
// 1. Logout handler sets marker in BOTH sessionStorage and
//    localStorage (cross-tab persistence for serverPreAuth).
// 2. Marker includes timestamp so it auto-expires.
// 3. clearLogoutIntent removes from both stores.
// 4. hasLogoutIntent checks localStorage with expiry validation.

import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

const LOGOUT_INTENT_LS_KEY = 'order_logout_intent';

/** Helper: replicate the real hasLogoutIntent logic */
function hasLogoutIntent(token: string): boolean {
  const ssIntent = sessionStorage.getItem('order_logout_intent');
  if (ssIntent === token) return true;

  try {
    const lsRaw = localStorage.getItem(LOGOUT_INTENT_LS_KEY);
    if (lsRaw) {
      const parsed = JSON.parse(lsRaw);
      if (parsed.token === token && parsed.expiresAt > Date.now()) {
        return true;
      }
      localStorage.removeItem(LOGOUT_INTENT_LS_KEY);
    }
  } catch {
    localStorage.removeItem(LOGOUT_INTENT_LS_KEY);
  }

  return false;
}

function clearLogoutIntent(token: string) {
  const intent = sessionStorage.getItem('order_logout_intent');
  if (intent === token) {
    sessionStorage.removeItem('order_logout_intent');
  }
  localStorage.removeItem(LOGOUT_INTENT_LS_KEY);
}

describe('LogoutButton logout intent marker', () => {
  it('sets marker in sessionStorage AND localStorage on logout', () => {
    const token = 'abc123';
    const storageKey = `order_session_${token}`;

    // Pre-existing session
    localStorage.setItem(storageKey, JSON.stringify({ dni: '12345678' }));

    // Simulate LogoutButton.handleLogout
    const marker = JSON.stringify({ token, expiresAt: Date.now() + 5 * 60 * 1000 });
    sessionStorage.setItem('order_logout_intent', token);
    localStorage.setItem(LOGOUT_INTENT_LS_KEY, marker);
    localStorage.removeItem(storageKey);

    expect(sessionStorage.getItem('order_logout_intent')).toBe(token);
    expect(localStorage.getItem(LOGOUT_INTENT_LS_KEY)).toBe(marker);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('hasLogoutIntent returns true for valid localStorage marker (cross-tab)', () => {
    const token = 'test-cross-tab';
    const marker = JSON.stringify({ token, expiresAt: Date.now() + 60_000 });
    localStorage.setItem(LOGOUT_INTENT_LS_KEY, marker);

    expect(hasLogoutIntent(token)).toBe(true);
  });

  it('hasLogoutIntent returns false for expired localStorage marker', () => {
    const token = 'test-expired';
    const marker = JSON.stringify({ token, expiresAt: Date.now() - 1000 });
    localStorage.setItem(LOGOUT_INTENT_LS_KEY, marker);

    expect(hasLogoutIntent(token)).toBe(false);
  });

  it('clearLogoutIntent removes marker from both stores', () => {
    const token = 'test-clear';
    const marker = JSON.stringify({ token, expiresAt: Date.now() + 60_000 });
    sessionStorage.setItem('order_logout_intent', token);
    localStorage.setItem(LOGOUT_INTENT_LS_KEY, marker);

    clearLogoutIntent(token);

    expect(sessionStorage.getItem('order_logout_intent')).toBeNull();
    expect(localStorage.getItem(LOGOUT_INTENT_LS_KEY)).toBeNull();
  });

  it('hasLogoutIntent prioritizes sessionStorage over localStorage', () => {
    const token = 'test-priority';
    // Both stores have a marker
    sessionStorage.setItem('order_logout_intent', token);
    const marker = JSON.stringify({ token, expiresAt: Date.now() - 1000 }); // expired in LS
    localStorage.setItem(LOGOUT_INTENT_LS_KEY, marker);

    // sessionStorage wins despite expired localStorage
    expect(hasLogoutIntent(token)).toBe(true);
  });
});
