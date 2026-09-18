// =====================================================
// AuthPage — rebuilt mockup shell (Slice 1a)
// Covers: R5 no forced dark class, R8 session hygiene once,
// OAuth gating, loading state, D2 in-button phone pill.
// =====================================================

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthPage from '../page';

// ── Mocks ────────────────────────────────────────────

const {
  mockSignInWithGoogle,
  mockSignInWithFacebook,
  mockClearBusinessSessionData,
  mockSetTheme,
  mockEffectiveTheme,
} = vi.hoisted(() => ({
  mockSignInWithGoogle: vi.fn(),
  mockSignInWithFacebook: vi.fn(),
  mockClearBusinessSessionData: vi.fn(),
  mockSetTheme: vi.fn(),
  mockEffectiveTheme: { value: 'dark' as 'dark' | 'light' },
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithFacebook: mockSignInWithFacebook,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBusinessSession', () => ({
  clearBusinessSessionData: mockClearBusinessSessionData,
}));

vi.mock('@/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'system',
    colorScheme: 'default',
    effectiveTheme: mockEffectiveTheme.value,
    setTheme: mockSetTheme,
    setColorScheme: vi.fn(),
  }),
}));

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockEffectiveTheme.value = 'dark';
});

// ── Tests ────────────────────────────────────────────

describe('AuthPage — R5: theme delegation (no forced .dark)', () => {
  it('does not force the global `dark` token class on the root container', () => {
    const { container } = render(<AuthPage />);

    expect(container.firstElementChild?.classList.contains('dark')).toBe(false);
  });

  it('renders the global theme toggle with the pinned "Cambiar tema" label', () => {
    render(<AuthPage />);

    expect(screen.getByRole('button', { name: 'Cambiar tema' })).toBeInTheDocument();
  });
});

describe('AuthPage — R8: session hygiene', () => {
  it('calls clearBusinessSessionData exactly once on mount', () => {
    render(<AuthPage />);

    expect(mockClearBusinessSessionData).toHaveBeenCalledTimes(1);
  });
});

describe('AuthPage — R3: OAuth gating and loading', () => {
  it('disables Google and Facebook until consent and enables both after checking', () => {
    render(<AuthPage />);

    const google = screen.getByRole('button', { name: /Continuar con Google/ });
    const facebook = screen.getByRole('button', { name: /Continuar con Facebook/ });

    expect(google).toBeDisabled();
    expect(facebook).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Accept terms and conditions'));

    expect(google).not.toBeDisabled();
    expect(facebook).not.toBeDisabled();
  });

  it('shows a progress indicator while Google sign-in is pending and blocks a second request', async () => {
    let resolveGoogle: (() => void) | undefined;
    mockSignInWithGoogle.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveGoogle = resolve;
        }),
    );

    render(<AuthPage />);
    fireEvent.click(screen.getByLabelText('Accept terms and conditions'));

    const google = screen.getByRole('button', { name: /Continuar con Google/ });
    fireEvent.click(google);

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    expect(google).toBeDisabled();
    expect(screen.getByText('progress_activity')).toBeInTheDocument();

    // Disabled while pending — a second click must not start a second request
    fireEvent.click(google);
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveGoogle?.();
    });
  });

  it('re-enables the Facebook button after a failed sign-in', async () => {
    mockSignInWithFacebook.mockRejectedValueOnce(new Error('sign-in failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AuthPage />);
    fireEvent.click(screen.getByLabelText('Accept terms and conditions'));

    const facebook = screen.getByRole('button', { name: /Continuar con Facebook/ });
    fireEvent.click(facebook);

    expect(facebook).toBeDisabled();
    expect(screen.getByText('progress_activity')).toBeInTheDocument();

    await act(async () => {});

    expect(facebook).not.toBeDisabled();
    consoleError.mockRestore();
  });
});

describe('AuthPage — R2: provider buttons and D2 in-button pill', () => {
  it('renders exactly three OAuth provider buttons', () => {
    render(<AuthPage />);

    const providers = screen.getAllByRole('button', { name: /Continuar con/ });
    expect(providers).toHaveLength(3);
  });

  it('renders the phone button disabled with the "Próximamente" pill inside the button', () => {
    render(<AuthPage />);

    const phone = screen.getByRole('button', { name: /Continuar con teléfono/ });
    expect(phone).toBeDisabled();
    expect(phone).toHaveAttribute('aria-disabled', 'true');
    expect(phone).toHaveTextContent('Próximamente');
  });

  it('labels the form panel via aria-labelledby="auth-title"', () => {
    render(<AuthPage />);

    const formPanel = screen.getByRole('region', { name: 'Tu tienda, lista para vender.' });
    expect(formPanel).toBeInTheDocument();
  });

  it('hides the decorative background layers from assistive technology (R7)', () => {
    const { container } = render(<AuthPage />);

    const hiddenDecor = container.querySelectorAll('div[aria-hidden="true"]');
    expect(hiddenDecor.length).toBeGreaterThanOrEqual(2);
  });
});

describe('AuthPage — R1/R4: marketing panel wiring (Slice 1b)', () => {
  it('renders the marketing panel into the right shell column', () => {
    render(<AuthPage />);

    expect(screen.getByRole('complementary', { name: 'Store Lite' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Todo lo que vendes, en un solo lugar.',
    );
    // ConsentBar removed (duplicate of global ConsentBanner) — no "Cambiar preferencias" link in MarketingPanel
    expect(screen.queryByRole('link', { name: 'Cambiar preferencias' })).not.toBeInTheDocument();
  });
});
