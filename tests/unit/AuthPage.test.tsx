// =====================================================
// AuthPage — OAuth-only auth tests (email/password removed)
// =====================================================

import AuthPage from '@/app/auth/page';
import { fireEvent, render, screen } from '@testing-library/react';
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

const mockSignInWithGoogle = vi.fn();
const mockSignInWithFacebook = vi.fn();
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

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────

describe('AuthPage — always-dark MD3 tokens (theme fix regression guard)', () => {
  it('applies the global `dark` token class to the root container so MD3 fields/buttons inherit dark tokens', () => {
    const { container } = render(<AuthPage />);

    // The MD3 components (md-outlined-text-field, md-filled-button) read their
    // tokens from the .dark class in src/styles/material-design/dark.css. The
    // layout boot script only sets light/dark on <body> from the saved/system
    // theme, so /auth (dark by design) must force the token class itself.
    expect(container.firstElementChild?.classList.contains('dark')).toBe(true);
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
  it('renders Facebook button disabled until consent, phone button disabled with Próximamente badge', () => {
    render(<AuthPage />);

    const facebookButton = screen.getByRole('button', { name: /Continuar con Facebook/ });
    const phoneButton = screen.getByRole('button', { name: /Continuar con teléfono/ });

    // Facebook: DISABLED until consent (no badge, not "Próximamente")
    expect(facebookButton).toBeDisabled();
    expect(facebookButton).toHaveAttribute('type', 'button');
    expect(facebookButton).not.toHaveAttribute('title', 'Disponible próximamente');
    expect(facebookButton.parentElement?.textContent).not.toContain('Próximamente');
    expect(facebookButton.querySelector('svg')).not.toBeNull();

    // Phone: still DISABLED with badge (UI-only upcoming)
    expect(phoneButton).toBeDisabled();
    expect(phoneButton).toHaveAttribute('type', 'button');
    expect(phoneButton).toHaveAttribute('title', 'Disponible próximamente');
    expect(phoneButton.parentElement?.textContent).toContain('Próximamente');
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

describe('AuthPage — insight panel v2: four tiles + benefits list (UI-only)', () => {
  it('renders the new inventory and orders tiles alongside the original two', () => {
    render(<AuthPage />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Siempre al día')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Bajo control')).toBeInTheDocument();

    // Original tiles survive the v2 iteration
    expect(screen.getByText('Tu tienda')).toBeInTheDocument();
    expect(screen.getByText('Pagos simples')).toBeInTheDocument();

    // Exactly four floating tiles live inside the decorative visual
    const visual = screen.getByText('Tu tienda').closest('[aria-hidden="true"]');
    expect(visual).not.toBeNull();
    expect(visual?.querySelectorAll('strong')).toHaveLength(4);
  });

  it('renders the three benefit rows with their material icons', () => {
    render(<AuthPage />);

    const expected = [
      { text: 'Empieza gratis y crece a tu ritmo', icon: 'check_circle' },
      { text: 'Tus datos, desde cualquier dispositivo', icon: 'cloud_done' },
      { text: 'Una experiencia simple para empezar.', icon: 'verified' },
    ];

    for (const { text, icon } of expected) {
      const row = screen.getByText(text);
      expect(row.querySelector('.material-symbols-rounded')).toHaveTextContent(icon);
    }
  });

  it('keeps the benefits list exposed to assistive technology (not aria-hidden)', () => {
    render(<AuthPage />);

    const list = screen.getByText('Empieza gratis y crece a tu ritmo').closest('ul');
    expect(list).toBeInTheDocument();
    expect(list).not.toHaveAttribute('aria-hidden');
  });
});
