// =====================================================
// ThemeToggle — global theme delegation (design D4)
// =====================================================

import ThemeToggle from '@/app/auth/components/ThemeToggle';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSetTheme, mockEffectiveTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockEffectiveTheme: { value: 'dark' as 'dark' | 'light' },
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

describe('ThemeToggle — fixed top-right circle delegating to global setTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the pinned "Cambiar tema" label', () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole('button', { name: 'Cambiar tema' });
    expect(toggle).toBeInTheDocument();
  });

  it('shows the light_mode icon (mode you switch to) when the effective theme is dark', () => {
    mockEffectiveTheme.value = 'dark';
    render(<ThemeToggle />);

    expect(screen.getByText('light_mode')).toBeInTheDocument();
    expect(screen.queryByText('dark_mode')).not.toBeInTheDocument();
  });

  it('shows the dark_mode icon (mode you switch to) when the effective theme is light', () => {
    mockEffectiveTheme.value = 'light';
    render(<ThemeToggle />);

    expect(screen.getByText('dark_mode')).toBeInTheDocument();
    expect(screen.queryByText('light_mode')).not.toBeInTheDocument();
  });

  it('calls setTheme with the flipped theme for both directions', () => {
    mockEffectiveTheme.value = 'dark';
    const { container: darkContainer } = render(<ThemeToggle />);
    fireEvent.click(within(darkContainer).getByRole('button', { name: 'Cambiar tema' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');

    vi.clearAllMocks();
    mockEffectiveTheme.value = 'light';
    const { container: lightContainer } = render(<ThemeToggle />);
    fireEvent.click(within(lightContainer).getByRole('button', { name: 'Cambiar tema' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
