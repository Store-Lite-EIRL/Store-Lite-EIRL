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
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
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

/** Checks consent and fills valid credentials on the password form */
function fillAndConsent(
  container: HTMLElement,
  email = 'admin@store-lite.com',
  password = 'correct-horse-battery-staple',
) {
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

describe('AuthPage — password form rendering', () => {
  it('renders email and password inputs plus submit, without signup or reset links', () => {
    const { container } = render(<AuthPage />);

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

describe('AuthPage — consent gating (auth-consent.r5)', () => {
  it('disables the submit button until consent is given and does not sign in', () => {
    const { container } = render(<AuthPage />);

    const submitButton = getSubmitButton(container)!;
    expect(submitButton).toHaveAttribute('disabled');

    // Even an explicit form submission must not trigger sign-in without consent
    fireEvent.submit(getForm(container)!);
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it('enables the submit button after consent and signs in with the form values', () => {
    const { container } = render(<AuthPage />);
    const submitButton = getSubmitButton(container)!;

    fillAndConsent(container);

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
