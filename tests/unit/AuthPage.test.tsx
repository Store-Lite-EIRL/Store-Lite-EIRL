// =====================================================
// AuthPage — email/password form tests
// Specs: email-password-login/spec.md + auth-consent/spec.md (R5, R6)
// =====================================================

import AuthPage from '@/app/auth/page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const mockSignInWithEmail = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithFacebook = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithFacebook: mockSignInWithFacebook,
    signInWithEmail: mockSignInWithEmail,
    signOut: vi.fn(),
  }),
}));

// ── Helpers ──────────────────────────────────────────

function getEmailField(container: HTMLElement): HTMLElement | null {
  return container.querySelector('md-outlined-text-field[name="email"]');
}

function getPasswordField(container: HTMLElement): HTMLElement | null {
  return container.querySelector('md-outlined-text-field[name="password"]');
}

function getSubmitButton(container: HTMLElement): HTMLElement | null {
  return container.querySelector('md-filled-button');
}

function getForm(container: HTMLElement): HTMLFormElement | null {
  return container.querySelector('form');
}

/**
 * The discreet expand/collapse toggle for the email/password form. Identified
 * by its aria-controls target, which is stable across both states (the visible
 * label switches between expand/collapse wording, so name-based queries would
 * break after the first click).
 */
function getToggleButton(container: HTMLElement): HTMLElement | null {
  return (
    Array.from(container.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-controls') === 'password-sign-in',
    ) ?? null
  );
}

/** Expands the (hidden by default) email/password form via the toggle */
function clickToggle(container: HTMLElement) {
  const toggle = getToggleButton(container);
  if (!toggle) throw new Error('Auth toggle button not rendered');
  fireEvent.click(toggle);
}

/** Expands the hidden form, checks consent and fills valid credentials */
function fillAndConsent(
  container: HTMLElement,
  email = 'admin@store-lite.com',
  password = 'correct-horse-battery-staple',
) {
  clickToggle(container);
  fireEvent.click(screen.getByRole('checkbox'));
  setFieldValue(getEmailField(container), email);
  setFieldValue(getPasswordField(container), password);
}

/**
 * Sets a value on an MD3 custom text field and fires the native change event.
 * jsdom's HTMLUnknownElement has no value setter, so fireEvent.change cannot be
 * used directly; React 19 attaches custom-element handlers via addEventListener.
 */
function setFieldValue(field: HTMLElement | null, value: string) {
  if (!field) throw new Error('MD3 text field not rendered');
  Object.defineProperty(field, 'value', { configurable: true, value, writable: true });
  fireEvent(field, new Event('change', { bubbles: true }));
}

// ── Setup ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSignInWithEmail.mockResolvedValue({});
});

// ── Tests ────────────────────────────────────────────

describe('AuthPage — email/password form toggle (hidden by default)', () => {
  it('keeps the form hidden initially — only the toggle, Google button and consent render', () => {
    const { container } = render(<AuthPage />);

    // Form (divider + fields + submit) is NOT in the DOM until expanded
    expect(getEmailField(container)).toBeNull();
    expect(getPasswordField(container)).toBeNull();
    expect(getSubmitButton(container)).toBeNull();
    expect(getForm(container)).toBeNull();
    expect(screen.queryByText(/INSTANT ACCESS/i)).not.toBeInTheDocument();

    // The discreet toggle is present, collapsed, and wired to the form container
    const toggle = getToggleButton(container);
    expect(toggle).not.toBeNull();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'password-sign-in');
    expect(toggle).toHaveTextContent(/correo electrónico/i);
  });

  it('reveals the email and password fields when the toggle is expanded', () => {
    const { container } = render(<AuthPage />);

    clickToggle(container);

    expect(getEmailField(container)).not.toBeNull();
    expect(getPasswordField(container)).not.toBeNull();
    expect(getPasswordField(container)).toHaveAttribute('type', 'password');
    expect(getSubmitButton(container)).not.toBeNull();
    expect(screen.getByText(/INSTANT ACCESS/i)).toBeInTheDocument();
    expect(getToggleButton(container)).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses again on a second click and removes the fields from the DOM', () => {
    const { container } = render(<AuthPage />);
    expect(getToggleButton(container)).toHaveAttribute('aria-expanded', 'false');

    clickToggle(container);
    expect(getToggleButton(container)).toHaveAttribute('aria-expanded', 'true');

    clickToggle(container);
    expect(getToggleButton(container)).toHaveAttribute('aria-expanded', 'false');
    expect(getEmailField(container)).toBeNull();
    expect(getSubmitButton(container)).toBeNull();
    expect(screen.queryByText(/INSTANT ACCESS/i)).not.toBeInTheDocument();
  });
});

describe('AuthPage — password form rendering', () => {
  it('renders email and password inputs plus submit, without signup or reset links', () => {
    const { container } = render(<AuthPage />);
    clickToggle(container);

    const emailField = getEmailField(container);
    const passwordField = getPasswordField(container);
    expect(emailField).not.toBeNull();
    expect(passwordField).not.toBeNull();
    expect(passwordField).toHaveAttribute('type', 'password');
    expect(getSubmitButton(container)).not.toBeNull();

    // email-password-login.r3: login-only — no signup or password-reset links
    expect(screen.queryByText(/registr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/olvid|recuper/i)).not.toBeInTheDocument();
  });
});

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

describe('AuthPage — consent gating (auth-consent.r5)', () => {
  it('disables the submit button until consent is given and does not sign in', () => {
    const { container } = render(<AuthPage />);
    clickToggle(container);

    const submitButton = getSubmitButton(container)!;
    expect(submitButton).toHaveAttribute('disabled');

    // Even an explicit form submission must not trigger sign-in without consent
    fireEvent.submit(getForm(container)!);
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it('enables the submit button after consent and signs in with the form values', () => {
    const { container } = render(<AuthPage />);

    fillAndConsent(container);

    const submitButton = getSubmitButton(container)!;
    expect(submitButton).not.toHaveAttribute('disabled');
    fireEvent.submit(getForm(container)!);

    expect(mockSignInWithEmail).toHaveBeenCalledWith(
      'admin@store-lite.com',
      'correct-horse-battery-staple',
    );
  });
});

describe('AuthPage — sign-in outcomes', () => {
  it('navigates to /onboarding on success', async () => {
    mockSignInWithEmail.mockImplementation(async () => {
      mockRouter.push('/onboarding');
      return {};
    });
    const { container } = render(<AuthPage />);
    fillAndConsent(container);

    fireEvent.submit(getForm(container)!);

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an inline error and stays on /auth when sign-in fails', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: 'Correo o contraseña incorrectos.' });
    const { container } = render(<AuthPage />);
    fillAndConsent(container);

    fireEvent.submit(getForm(container)!);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('keeps consent checked and the submit enabled after a sign-in error (auth-consent.r6)', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: 'Correo o contraseña incorrectos.' });
    const { container } = render(<AuthPage />);
    fillAndConsent(container);

    fireEvent.submit(getForm(container)!);

    await screen.findByRole('alert');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(getSubmitButton(container)).not.toHaveAttribute('disabled');
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
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
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

describe('AuthPage — double submit guard (email-password-login.r6)', () => {
  it('ignores repeated submissions while a request is in flight', async () => {
    let resolveSignIn: (value: { error?: string }) => void = () => {};
    mockSignInWithEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    const { container } = render(<AuthPage />);
    fillAndConsent(container);

    fireEvent.submit(getForm(container)!);

    // Wait until the loading state disables the submit button
    await waitFor(() => expect(getSubmitButton(container)).toHaveAttribute('disabled'));

    fireEvent.submit(getForm(container)!);
    expect(mockSignInWithEmail).toHaveBeenCalledTimes(1);

    resolveSignIn({});
  });
});
