// =====================================================
// AuthPage — OAuth-only auth tests (email/password removed)
// Updated for Slice 1a of auth-md3-mockup:
//   - R5: page no longer forces the `dark` token class (global ThemeContext)
//   - D2: "Próximamente" pill renders INSIDE the phone button
// The insight-panel v2 assertions (four tiles + benefits list) moved to
// app/auth/__tests__/marketing.test.tsx with the MarketingPanel in Slice 1b.
// =====================================================

import AuthPage from '@/app/auth/page';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const { mockSignInWithGoogle, mockSignInWithFacebook, mockEffectiveTheme } = vi.hoisted(() => ({
  mockSignInWithGoogle: vi.fn(),
  mockSignInWithFacebook: vi.fn(),
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
  clearBusinessSessionData: vi.fn(),
}));

vi.mock('@/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'system',
    colorScheme: 'default',
    effectiveTheme: mockEffectiveTheme.value,
    setTheme: vi.fn(),
    setColorScheme: vi.fn(),
  }),
}));

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockEffectiveTheme.value = 'dark';
});

// ── Tests ────────────────────────────────────────────

describe('AuthPage — theme delegation (R5: no forced .dark)', () => {
  it('does not force the global `dark` token class on the root container', () => {
    const { container } = render(<AuthPage />);

    // Theming is delegated to the global ThemeContext (design D4); the page
    // must never force a token class itself (spec R5).
    expect(container.firstElementChild?.classList.contains('dark')).toBe(false);
  });
});

describe('AuthPage — left panel hero copy (Peruvian tuteo refresh)', () => {
  it('renders the refreshed eyebrow, H1 and subtitle', () => {
    render(<AuthPage />);

    expect(screen.getByText('Bienvenido a Store Lite')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tu tienda, lista para vender.',
    );
    expect(
      screen.getByText(/Publica tus productos y recibe pagos en minutos\./),
    ).toBeInTheDocument();
  });

  it('does not render any of the retired hero copy', () => {
    render(<AuthPage />);

    expect(screen.queryByText('Bienvenido de nuevo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tu tienda global comienza aquí/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lanza tus productos virtuales/i)).not.toBeInTheDocument();
  });
});

describe('AuthPage — Facebook sign-in (enabled, gated by consent) + phone (UI-only upcoming)', () => {
  it('renders Facebook button disabled until consent, phone button disabled with in-button Próximamente pill (D2)', () => {
    render(<AuthPage />);

    const facebookButton = screen.getByRole('button', { name: /Continuar con Facebook/ });
    const phoneButton = screen.getByRole('button', { name: /Continuar con teléfono/ });

    // Facebook: DISABLED until consent (no badge, not "Próximamente")
    expect(facebookButton).toBeDisabled();
    expect(facebookButton).toHaveAttribute('type', 'button');
    expect(facebookButton).not.toHaveAttribute('title', 'Disponible próximamente');
    expect(facebookButton).not.toHaveTextContent('Próximamente');
    expect(facebookButton.querySelector('svg')).not.toBeNull();

    // Phone: DISABLED with the pill INSIDE the button (design D2)
    expect(phoneButton).toBeDisabled();
    expect(phoneButton).toHaveAttribute('type', 'button');
    expect(phoneButton).toHaveAttribute('title', 'Disponible próximamente');
    expect(phoneButton).toHaveTextContent('Próximamente');
    const phoneIcon = phoneButton.querySelector('.material-symbols-rounded');
    expect(phoneIcon).not.toBeNull();
    expect(phoneIcon).toHaveTextContent('sms');

    // Clicking either should NOT trigger auth flow (both disabled)
    fireEvent.click(facebookButton);
    fireEvent.click(phoneButton);
    expect(mockSignInWithGoogle).not.toHaveBeenCalled();
    expect(mockSignInWithFacebook).not.toHaveBeenCalled();
  });

  it('enables Facebook button when consent is given', () => {
    render(<AuthPage />);

    const facebookButton = screen.getByRole('button', { name: /Continuar con Facebook/ });
    const consentCheckbox = screen.getByLabelText(/accept terms and conditions/i);

    // Initially disabled
    expect(facebookButton).toBeDisabled();

    // Give consent
    fireEvent.click(consentCheckbox);

    // Now enabled
    expect(facebookButton).not.toBeDisabled();
  });
});
