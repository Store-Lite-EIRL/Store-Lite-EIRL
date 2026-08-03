import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const submitPlatformComplaintMock = vi.fn();
const captureMock = vi.fn();

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}));

vi.mock('@/features/legal/actions', () => ({
  submitPlatformComplaint: (...args: unknown[]) => submitPlatformComplaintMock(...args),
}));

vi.mock('@/shared/components/ui', () => ({
  AlertSnackbar: ({ open, description }: { open?: boolean; description?: string }) =>
    open ? <div role="alert">{description}</div> : null,
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Checkbox: ({ checked, onChange }: { checked?: boolean; onChange?: (e: unknown) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e as unknown as Event)} />
  ),
  Icon: () => null,
  TextField: ({
    label,
    value,
    onInput,
    onChange,
    type,
    error,
    supportingText,
  }: {
    label?: string;
    value?: string | number;
    onInput?: (e: unknown) => void;
    onChange?: (e: unknown) => void;
    type?: string;
    error?: boolean;
    supportingText?: string;
  }) => {
    const handler = onInput ?? onChange;
    return (
      <label>
        {label}
        {type === 'textarea' ? (
          <textarea value={value} onChange={(e) => handler?.(e as unknown as Event)} />
        ) : (
          <input
            type={type ?? 'text'}
            value={value}
            onChange={(e) => handler?.(e as unknown as Event)}
          />
        )}
        {error && <span role="alert">{supportingText}</span>}
      </label>
    );
  },
}));

import { ComplaintForm } from '../ComplaintForm';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ComplaintForm (platform)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captureMock.mockClear();
  });

  it('rejects submission with client-side field errors and calls no action', async () => {
    const user = userEvent.setup();
    render(<ComplaintForm />);

    await user.click(screen.getByRole('button', { name: 'Presentar reclamo' }));

    expect(screen.getByText('El apellido es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('Corrija los errores en el formulario.')).toBeInTheDocument();
    expect(submitPlatformComplaintMock).not.toHaveBeenCalled();
  });

  it('submits valid data and shows ticket number with SLA note', async () => {
    const user = userEvent.setup();
    submitPlatformComplaintMock.mockResolvedValue({
      success: true,
      ticketNumber: 'LR-2026-DEVKITTO-0001',
      emailFailed: false,
    });

    render(<ComplaintForm />);

    await user.type(screen.getByLabelText('Apellidos'), 'García');
    await user.type(screen.getByLabelText('Nombres'), 'Juan');
    await user.type(screen.getByLabelText('Número de documento'), '12345678');
    await user.type(screen.getByLabelText('Dirección'), 'Av. Principal 123');
    await user.type(screen.getByLabelText('Teléfono'), '999888777');
    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@example.com');
    await user.type(
      screen.getByLabelText('Descripción del bien o servicio contratado'),
      'Plan Pro',
    );
    await user.type(
      screen.getByLabelText('Descripción del reclamo'),
      'El producto llegó dañado y no funciona correctamente.',
    );
    await user.type(
      screen.getByLabelText('Pedido del consumidor'),
      'Solicito el reembolso completo.',
    );

    await user.click(screen.getByRole('button', { name: 'Presentar reclamo' }));

    expect(await screen.findByText('Reclamo registrado')).toBeInTheDocument();
    expect(screen.getByText('LR-2026-DEVKITTO-0001')).toBeInTheDocument();
    expect(screen.getByText(/15 días hábiles para responder/i)).toBeInTheDocument();
    expect(screen.getByText(/INDECOPI/i)).toBeInTheDocument();

    expect(submitPlatformComplaintMock).toHaveBeenCalledTimes(1);
    const payload = submitPlatformComplaintMock.mock.calls[0][0] as Record<string, unknown>;
    // Slug-free contract: the payload carries consumer data only, no slug param
    expect(payload.consumerLastName).toBe('García');
    expect(payload.consumerFirstName).toBe('Juan');
    expect(payload).not.toHaveProperty('slug');
    expect(payload).toHaveProperty('fax');
  });

  it('notes email failure while keeping the success state', async () => {
    const user = userEvent.setup();
    submitPlatformComplaintMock.mockResolvedValue({
      success: true,
      ticketNumber: 'LR-2026-DEVKITTO-0002',
      emailFailed: true,
    });

    render(<ComplaintForm />);

    await user.type(screen.getByLabelText('Apellidos'), 'García');
    await user.type(screen.getByLabelText('Nombres'), 'Juan');
    await user.type(screen.getByLabelText('Número de documento'), '12345678');
    await user.type(screen.getByLabelText('Dirección'), 'Av. Principal 123');
    await user.type(screen.getByLabelText('Teléfono'), '999888777');
    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@example.com');
    await user.type(
      screen.getByLabelText('Descripción del bien o servicio contratado'),
      'Plan Pro',
    );
    await user.type(
      screen.getByLabelText('Descripción del reclamo'),
      'El producto llegó dañado y no funciona correctamente.',
    );
    await user.type(
      screen.getByLabelText('Pedido del consumidor'),
      'Solicito el reembolso completo.',
    );

    await user.click(screen.getByRole('button', { name: 'Presentar reclamo' }));

    expect(await screen.findByText('Reclamo registrado')).toBeInTheDocument();
    expect(screen.getByText('LR-2026-DEVKITTO-0002')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/No se pudo enviar el correo de confirmación/i)).toBeInTheDocument(),
    );
  });
});
