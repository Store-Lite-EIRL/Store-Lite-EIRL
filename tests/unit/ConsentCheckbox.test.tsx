import ConsentCheckbox from '@/features/auth/ConsentCheckbox';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ConsentCheckbox', () => {
  describe('default state', () => {
    it('renders unchecked by default', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('does not fire onConsentChange on initial render', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('interaction', () => {
    it('fires onConsentChange(true) when checked', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('fires onConsentChange(false) when unchecked after being checked', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox); // check
      fireEvent.click(checkbox); // uncheck

      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('links', () => {
    it('renders a link to /privacidad', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      const privacyLink = screen.getByText(/Política de Privacidad/i);
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacidad');
    });

    it('renders a link to /terminos', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      const termsLink = screen.getByText(/Términos de Servicio/i);
      expect(termsLink).toBeInTheDocument();
      expect(termsLink.closest('a')).toHaveAttribute('href', '/terminos');
    });
  });

  describe('storeName prop', () => {
    it('includes storeName in the label when provided', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} storeName="MiTienda" />);

      expect(screen.getByText(/MiTienda/)).toBeInTheDocument();
    });

    it('uses default text when storeName is not provided', () => {
      const onChange = vi.fn();
      render(<ConsentCheckbox onConsentChange={onChange} />);

      expect(screen.getByText(/Términos de Servicio/)).toBeInTheDocument();
      expect(screen.getByText(/Política de Privacidad/)).toBeInTheDocument();
    });
  });
});
