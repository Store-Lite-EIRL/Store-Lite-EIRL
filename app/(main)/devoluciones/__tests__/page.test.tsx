import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DevolucionesPage, { metadata } from '../page';

describe('DevolucionesPage', () => {
  it('renders the 7-calendar-day refund window per plan payment', () => {
    render(<DevolucionesPage />);
    expect(screen.getAllByText(/7 días calendario/i).length).toBeGreaterThan(0);
  });

  it('states the no-refund-when-service-consumed exclusion', () => {
    render(<DevolucionesPage />);
    expect(screen.getByText(/el servicio haya sido consumido/i)).toBeInTheDocument();
  });

  it('states refunds are issued via the same payment method used', () => {
    render(<DevolucionesPage />);
    expect(screen.getByText(/el mismo método de pago utilizado/i)).toBeInTheDocument();
  });

  it('states plans are paid manually each month without auto-renewal', () => {
    render(<DevolucionesPage />);
    expect(screen.getByText(/pagan de forma manual cada mes/i)).toBeInTheDocument();
    expect(screen.queryByText(/renuevan automáticamente/i)).not.toBeInTheDocument();
  });

  it('exposes WhatsApp as the only refund channel', () => {
    render(<DevolucionesPage />);
    const whatsapp = screen.getByRole('link', { name: /whatsapp/i });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/958119418');
  });

  it('does not render email, phone, or a refund form', () => {
    const { container } = render(<DevolucionesPage />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.startsWith('mailto:'))).toBe(false);
    expect(links.some((l) => l.getAttribute('href')?.startsWith('tel:'))).toBe(false);
    expect(container.querySelector('form')).toBeNull();
  });

  it('uses the sibling legal-page layout and indexable metadata', () => {
    const { container } = render(<DevolucionesPage />);
    expect(container.firstChild).toHaveClass('legal-page');
    expect(metadata.title).toContain('Reembolsos');
    expect(metadata.description).toContain('reembolso');
    expect(metadata.robots?.index).toBe(true);
    expect(metadata.robots?.follow).toBe(true);
  });
});
