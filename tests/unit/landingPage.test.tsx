// =====================================================
// Landing page (app/page.tsx) — crawlable server-rendered
// content for crawlers, with auth-gated redirect preserved.
// Spec: seo-fundamentals — landing SSR must NOT gate markup
// on auth state; logged-in users still get redirected.
//
// NOTE: AuthProvider resolves its initial session ONLY through the
// supabase onAuthStateChange callback (the real client emits
// INITIAL_SESSION). Tests must fire that callback manually, same
// pattern as tests/unit/AuthProvider.test.tsx.
// =====================================================

import HomePage from '@/app/page';
import { AuthProvider } from '@/features/auth';
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

const mockOnAuthStateChange = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ── Helpers ──────────────────────────────────────────

function renderLanding() {
  return render(
    <AuthProvider>
      <HomePage />
    </AuthProvider>,
  );
}

/** Emits the supabase INITIAL_SESSION event, as the real client does on mount. */
async function emitInitialSession(session: unknown) {
  const callback = vi.mocked(mockOnAuthStateChange).mock.calls[0]?.[0] as
    | ((event: string, session: unknown) => void)
    | undefined;
  await act(async () => {
    callback?.('INITIAL_SESSION', session);
  });
}

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockOnAuthStateChange.mockImplementation(
    (_callback: (event: string, session: unknown) => void) => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  );
});

// ── Tests ────────────────────────────────────────────

describe('Landing page — crawlable server-rendered content', () => {
  it('renders the full landing content without any authenticated session', async () => {
    renderLanding();
    await emitInitialSession(null);

    // Hero copy must be present in the rendered tree (crawlable HTML)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu vitrina digital');
    const createLinks = screen.getAllByRole('link', { name: /crear mi tienda/i });
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks[0]).toHaveAttribute('href', '/auth');
    expect(screen.getByRole('link', { name: /ver planes/i })).toHaveAttribute('href', '/pricing');

    // No redirect for anonymous visitors
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('still renders crawlable landing content when a session exists and redirects to /onboarding', async () => {
    renderLanding();
    await emitInitialSession({ user: { id: 'user-1' } });

    // THE SEO CONTRACT: authenticated users get redirected to onboarding,
    // but the landing markup is never gated behind auth state — crawlers
    // always see real content regardless of session.
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu vitrina digital');
  });
});
