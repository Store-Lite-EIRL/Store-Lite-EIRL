import { BusinessPreviewCard } from '@/shared/components/business/BusinessPreviewCard';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/storefront', () => ({
  normalizeStorefrontColorScheme: () => 'light',
  getStorefrontColorConfig: () => ({
    palette: { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899' },
  }),
  getReadableTextColor: () => '#ffffff',
  createRandomStorefrontTheme: () => ({ version: 2, fontFamily: 'roboto' }),
}));

vi.mock('@/shared/components/ui', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  Icon: ({ children, size = 24, style }: any) => (
    <md-icon size={size} style={style}>
      {children}
    </md-icon>
  ),
}));

const baseProps = {
  commercialName: 'Mi Tienda',
  sector: 'Ropa',
  country: 'Perú',
  city: 'Lima',
  address: 'Av. Lima 123',
  email: 'hola@mitienda.com',
  description: 'Ropa moderna para todos.',
  taxId: '20123456789',
  legalRepName: 'Ana Torres',
  legalRepRole: 'Gerente',
  storefrontTheme: {},
};

describe('BusinessPreviewCard — public profile props', () => {
  it('renders exactly as before when the new optional props are absent', () => {
    render(<BusinessPreviewCard {...baseProps} />);

    expect(screen.getByText('Mi Tienda')).toBeDefined();
    expect(screen.getByText('Ropa • Perú')).toBeDefined();
    expect(screen.getByText(/Av\. Lima 123/)).toBeDefined();
    expect(screen.getByText('hola@mitienda.com')).toBeDefined();
    expect(screen.getByText(/RUC:/)).toBeDefined();

    // Legacy card has no links and no status badge.
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText('Verificado')).toBeNull();
  });

  it.each([
    ['verified', 'Verificado'],
    ['pending', 'En verificación'],
    ['unverified', 'Sin verificar'],
    ['rejected', 'No verificado'],
  ])('renders the %s badge when verificationStatus is set', (status, label) => {
    render(<BusinessPreviewCard {...baseProps} verificationStatus={status as any} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveAttribute('aria-label', label);
  });

  it('never shows the verified style for any other status (R2)', () => {
    render(<BusinessPreviewCard {...baseProps} verificationStatus="unverified" />);

    expect(screen.queryByText('Verificado')).toBeNull();
  });

  it('renders social links as safe external anchors when socialLinks is provided', () => {
    render(
      <BusinessPreviewCard
        {...baseProps}
        socialLinks={{
          instagram: 'https://instagram.com/mitienda',
          facebook: 'https://facebook.com/mitienda',
        }}
      />,
    );

    const instagram = screen.getByRole('link', { name: 'Síguenos en Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://instagram.com/mitienda');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');

    const facebook = screen.getByRole('link', { name: 'Síguenos en Facebook' });
    expect(facebook).toHaveAttribute('href', 'https://facebook.com/mitienda');
    expect(facebook).toHaveAttribute('target', '_blank');
    expect(facebook).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a wa.me link from whatsappNumber digits only', () => {
    render(<BusinessPreviewCard {...baseProps} whatsappNumber="+51 999 888 777" />);

    const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/51999888777');
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('falls back to legalRepPhone for the wa.me link (R3)', () => {
    render(<BusinessPreviewCard {...baseProps} legalRepPhone="+51 111 222 333" />);

    const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/51111222333');
  });
});
