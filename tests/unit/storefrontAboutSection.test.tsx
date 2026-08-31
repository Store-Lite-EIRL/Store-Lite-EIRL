import {
  StorefrontAboutSection,
  getPersonTypeLabel,
  getVerificationConfig,
} from '@/app/[slug]/(app)/StorefrontAboutSection';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const fullBusiness = {
  id: 'b1',
  ownerId: 'u1',
  name: 'Mi Tienda',
  slug: 'mi-tienda',
  coverImageUrl: null,
  heroImages: [],
  logoUrl: null,
  address: 'Av. Lima 123',
  storeType: 'Ropa',
  description: 'Ropa moderna para todos.',
  whatsappNumber: '+51 999 888 777',
  email: 'hola@mitienda.com',
  socialLinks: {
    instagram: 'https://instagram.com/mitienda',
    facebook: 'https://facebook.com/mitienda',
  },
  taxId: '20123456789',
  personType: 'natural',
  country: 'Perú',
  city: 'Lima',
  departamento: null,
  provincia: null,
  distrito: null,
  legalRepPhone: null,
  legalRepName: 'Ana Torres',
  legalRepRole: 'Gerente',
  verificationStatus: 'verified',
} as unknown as Parameters<typeof StorefrontAboutSection>[0]['business'];

const sparseBusiness = {
  id: 'b2',
  ownerId: 'u1',
  name: 'Tienda Básica',
  slug: 'tienda-basica',
  coverImageUrl: null,
  heroImages: [],
  logoUrl: null,
  address: null,
  storeType: null,
  description: 'Vendemos lo esencial.',
  whatsappNumber: null,
  email: null,
  socialLinks: null,
  taxId: '',
  personType: null,
  country: null,
  city: null,
  departamento: null,
  provincia: null,
  distrito: null,
  legalRepPhone: null,
  legalRepName: null,
  legalRepRole: null,
  verificationStatus: 'unverified',
} as unknown as Parameters<typeof StorefrontAboutSection>[0]['business'];

const renderSection = (business: Parameters<typeof StorefrontAboutSection>[0]['business']) =>
  render(
    <StorefrontAboutSection business={business} storefrontTheme={null} previewCardTheme={null} />,
  );

// ─── Section rendering ─────────────────────────────────────────────────────

describe('StorefrontAboutSection — public profile', () => {
  it('renders the full public profile with exact links', () => {
    renderSection(fullBusiness);

    // Description (section only — the card render adds quotes).
    expect(screen.getByText('Ropa moderna para todos.')).toBeDefined();

    // personType + storeType row.
    expect(screen.getByText('Persona Natural con Negocio • Ropa')).toBeDefined();

    // Email → mailto anchor.
    const mailto = screen.getByRole('link', { name: 'Enviar correo a hola@mitienda.com' });
    expect(mailto).toHaveAttribute('href', 'mailto:hola@mitienda.com');
    expect(mailto).toHaveAttribute('target', '_blank');
    expect(mailto).toHaveAttribute('rel', 'noopener noreferrer');

    // Phone → wa.me anchor built from digits only (section + card both render it).
    const waLinks = screen.getAllByRole('link', { name: /WhatsApp al \+51 999 888 777/ });
    expect(waLinks.length).toBeGreaterThan(0);
    for (const link of waLinks) {
      expect(link).toHaveAttribute('href', 'https://wa.me/51999888777');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }

    // Verification badge (section + card).
    expect(screen.getAllByText('Verificado').length).toBeGreaterThan(0);

    // Social links (section + card), safe external anchors.
    const instagram = screen.getAllByRole('link', { name: 'Síguenos en Instagram' });
    expect(instagram.length).toBeGreaterThan(0);
    for (const link of instagram) {
      expect(link).toHaveAttribute('href', 'https://instagram.com/mitienda');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    const facebook = screen.getAllByRole('link', { name: 'Síguenos en Facebook' });
    expect(facebook.length).toBeGreaterThan(0);
    expect(facebook[0]).toHaveAttribute('href', 'https://facebook.com/mitienda');
  });

  it.each([
    ['verified', 'Verificado'],
    ['pending', 'En verificación'],
    ['unverified', 'Sin verificar'],
    ['rejected', 'No verificado'],
  ])('shows the %s badge', (status, label) => {
    renderSection({ ...fullBusiness, verificationStatus: status });

    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    if (label !== 'Verificado') {
      expect(screen.queryAllByText('Verificado')).toHaveLength(0);
    }
  });

  it('renders no empty rows or links for a sparse business (R1)', () => {
    renderSection(sparseBusiness);

    expect(screen.getByText('Vendemos lo esencial.')).toBeDefined();

    // No mailto / wa.me / social anchors anywhere (no card extras either).
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByText('No hay descripción disponible.')).toBeNull();
    expect(screen.queryByText('—')).toBeNull();
    expect(screen.queryByText('Persona Jurídica')).toBeNull();

    // The truthful default badge still renders.
    expect(screen.getAllByText('Sin verificar').length).toBeGreaterThan(0);
  });

  it('renders no description placeholder when description is missing', () => {
    const { unmount } = renderSection({ ...sparseBusiness, description: null });
    expect(screen.queryAllByText('No hay descripción disponible.')).toHaveLength(0);
    unmount();
  });
});

// ─── Pure business-logic helpers ───────────────────────────────────────────

describe('getPersonTypeLabel', () => {
  it('maps natural and juridica to Spanish labels', () => {
    expect(getPersonTypeLabel('natural')).toBe('Persona Natural con Negocio');
    expect(getPersonTypeLabel('juridica')).toBe('Persona Jurídica');
  });

  it('falls back to an em-dash for missing values', () => {
    expect(getPersonTypeLabel(null)).toBe('—');
    expect(getPersonTypeLabel(undefined)).toBe('—');
  });
});

describe('getVerificationConfig', () => {
  it('maps every status to a badge config', () => {
    expect(getVerificationConfig('verified')).toEqual({
      label: 'Verificado',
      icon: 'verified',
      tone: 'verified',
    });
    expect(getVerificationConfig('pending')).toEqual({
      label: 'En verificación',
      icon: 'hourglass_top',
      tone: 'pending',
    });
    expect(getVerificationConfig('unverified')).toEqual({
      label: 'Sin verificar',
      icon: 'info',
      tone: 'unverified',
    });
    expect(getVerificationConfig('rejected')).toEqual({
      label: 'No verificado',
      icon: 'cancel',
      tone: 'rejected',
    });
  });

  it('falls back to the unverified tone for unknown or missing statuses', () => {
    for (const status of [null, undefined, 'bogus', '']) {
      expect(getVerificationConfig(status)).toEqual({
        label: 'Sin verificar',
        icon: 'info',
        tone: 'unverified',
      });
    }
  });

  it('never derives the verified tone from another status (R2)', () => {
    for (const status of ['pending', 'unverified', 'rejected', null, undefined, 'bogus']) {
      expect(getVerificationConfig(status as string).tone).not.toBe('verified');
    }
  });
});
