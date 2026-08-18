// =====================================================
// AuthProvider — signInWithEmail tests
// Spec: openspec/changes/culqi-validation-email-password-auth/specs/email-password-login/spec.md
// =====================================================

import { AuthProvider, useAuth } from '@/features/auth';
import type { AuthContextType } from '@/types/auth';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockMaybeSingle = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    }),
  }),
}));

// ── Helpers ──────────────────────────────────────────

const TEST_EMAIL = 'admin@store-lite.com';
const TEST_CREDENTIAL = 'correct-horse-battery-staple';

// The probe reports the context through a callback created outside the
// component body, so react-hooks/globals does not flag outer-state writes.
function renderProvider(): AuthContextType {
  let captured: AuthContextType | undefined;
  function Probe({ onAuth }: { onAuth: (auth: AuthContextType) => void }) {
    const auth = useAuth();
    onAuth(auth);
    return <div>{auth.user ? 'signed-in' : 'signed-out'}</div>;
  }
  render(
    <AuthProvider>
      <Probe
        onAuth={(auth) => {
          captured = auth;
        }}
      />
    </AuthProvider>,
  );
  if (!captured) throw new Error('Auth context was not captured during render');
  return captured;
}

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
});

// ── Tests ────────────────────────────────────────────

describe('AuthProvider — signInWithEmail', () => {
  it('signs in with valid credentials and navigates to /onboarding', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: { user: { id: 'user-1' } } },
      error: null,
    });
    const auth = renderProvider();

    const result = await auth.signInWithEmail(TEST_EMAIL, TEST_CREDENTIAL);

    expect(result.error).toBeUndefined();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: TEST_EMAIL,
      password: TEST_CREDENTIAL,
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/onboarding');
  });

  it('returns es-PE message for invalid credentials and does not navigate', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const auth = renderProvider();

    const result = await auth.signInWithEmail(TEST_EMAIL, 'wrong-password');

    expect(result.error).toBe('Correo o contraseña incorrectos.');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('returns confirm-email message when the account is not confirmed', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });
    const auth = renderProvider();

    const result = await auth.signInWithEmail(TEST_EMAIL, TEST_CREDENTIAL);

    expect(result.error).toBe('Debes confirmar tu correo electrónico antes de iniciar sesión.');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for unknown errors and never navigates', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'unexpected_failure', message: 'Something broke' },
    });
    const auth = renderProvider();

    const result = await auth.signInWithEmail(TEST_EMAIL, TEST_CREDENTIAL);

    expect(result.error).toBe('No se pudo iniciar sesión. Inténtalo de nuevo.');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe('AuthProvider — profile sync after sign-in', () => {
  it('tolerates a missing profile (PGRST116) without crashing', async () => {
    let authStateCallback: ((event: string, session: unknown) => void) | undefined;
    mockOnAuthStateChange.mockImplementation(
      (callback: (event: string, session: unknown) => void) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    });

    const auth = renderProvider();

    await act(async () => {
      authStateCallback?.('SIGNED_IN', { user: { id: 'user-1' } });
    });

    await waitFor(() => expect(screen.getByText('signed-in')).toBeInTheDocument());
    expect(auth.user?.profile).toBeUndefined();
  });
});
