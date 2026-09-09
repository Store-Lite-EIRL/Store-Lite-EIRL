/**
 * Regression suite for the public seller-contact section of the product page.
 *
 * Compliance contract (Peruvian law):
 * - Ley 29733: the legal representative NAME and ROLE are unnecessary personal
 *   data on a public surface — they must never be rendered.
 * - DL 1524: the real RUC (taxId) must appear on public advertising; the
 *   tokenized pseudo-hash (`x3bet...`) must never appear.
 *
 * Contact channels (email / WhatsApp) remain visible — including the legal
 * representative's email/phone used as a fallback channel when the business
 * has no dedicated contact of its own (same policy as BusinessPreviewCard R3).
 */
import {
  SellerContactSection,
  buildSellerContactInfo,
} from '@/app/[slug]/(app)/product/[productId]/components/SellerContactSection';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// ─── Fixtures ──────────────────────────────────────────────────────────────

type SellerBusiness = Parameters<typeof SellerContactSection>[0]['business'];

/** Full business: rep identity + distinct rep contact channels. */
const fullBusiness = {
  name: 'Mi Tienda',
  taxId: '20123456789',
  email: 'hola@mitienda.com',
  whatsappNumber: '+51 999 888 777',
  address: 'Av. Lima 123',
  legalRepName: 'Ana Torres',
  legalRepRole: 'Gerente',
  legalRepEmail: 'ana@mitienda.com',
  legalRepPhone: '+51 111 222 333',
} as unknown as SellerBusiness;

/** Rep contact channels identical to the business ones (even with different casing/formatting). */
const sameContactBusiness = {
  name: 'Mi Tienda',
  taxId: '20123456789',
  email: 'hola@mitienda.com',
  whatsappNumber: '+51 999 888 777',
  legalRepName: 'Ana Torres',
  legalRepRole: 'Gerente',
  legalRepEmail: 'HOLA@MITIENDA.COM',
  legalRepPhone: '+51 999-888-777',
} as unknown as SellerBusiness;

/** Business without own contact channels; rep data is the only contact. */
const repOnlyContactBusiness = {
  name: 'Tienda Básica',
  taxId: null,
  email: null,
  whatsappNumber: null,
  address: null,
  legalRepName: 'Ana Torres',
  legalRepRole: 'Gerente',
  legalRepEmail: 'ana@mitienda.com',
  legalRepPhone: '+51 111 222 333',
} as unknown as SellerBusiness;

/** Everything empty/null. */
const sparseBusiness = {
  name: 'Tienda Básica',
  taxId: null,
  email: null,
  whatsappNumber: null,
  address: null,
  legalRepName: null,
  legalRepRole: null,
  legalRepEmail: null,
  legalRepPhone: null,
} as unknown as SellerBusiness;

const renderSection = (business: SellerBusiness) =>
  render(<SellerContactSection business={business} />);

// ─── Component: public seller contact section ──────────────────────────────

describe('SellerContactSection — public surfaces', () => {
  it('renders business identity and the real RUC without representative identity (Ley 29733 / DL 1524)', () => {
    renderSection(fullBusiness);

    // Business name and REAL RUC are visible.
    expect(screen.getByText('Mi Tienda')).toBeDefined();
    expect(screen.getByText('RUC')).toBeDefined();
    expect(screen.getByText('20123456789')).toBeDefined();

    // Representative identity must NEVER surface: name, role, or block title.
    expect(screen.queryByText('Ana Torres')).toBeNull();
    expect(screen.queryByText('Gerente')).toBeNull();
    expect(screen.queryByText('Representante Legal')).toBeNull();

    // No tokenized RUC pseudo-hash anywhere.
    expect(screen.queryByText(/x3bet/)).toBeNull();
  });

  it('keeps rep contact channels as additional contact when they differ from the business ones', () => {
    renderSection(fullBusiness);

    expect(screen.getByText('Contacto Adicional')).toBeDefined();
    expect(screen.getByText('ana@mitienda.com')).toBeDefined();

    const waLink = screen.getByRole('link', { name: /111 222 333/ });
    expect(waLink).toHaveAttribute('href', 'https://wa.me/51111222333');
    expect(waLink).toHaveAttribute('target', '_blank');
    expect(waLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('deduplicates rep contact identical to the business contact (case/format-insensitive)', () => {
    renderSection(sameContactBusiness);

    expect(screen.queryByText('Contacto Adicional')).toBeNull();
    expect(screen.queryByText('HOLA@MITIENDA.COM')).toBeNull();
    expect(screen.queryByText('+51 999-888-777')).toBeNull();

    // The business email still renders exactly once (no duplicated row).
    expect(screen.getAllByText('hola@mitienda.com')).toHaveLength(1);
  });

  it('uses rep contact as the only contact channel when the business has none', () => {
    renderSection(repOnlyContactBusiness);

    expect(screen.getByText('Tienda Básica')).toBeDefined();
    expect(screen.getByText('ana@mitienda.com')).toBeDefined();
    expect(screen.getByRole('link', { name: /111 222 333/ })).toHaveAttribute(
      'href',
      'https://wa.me/51111222333',
    );

    // No RUC row when taxId is missing — and no fake token fallback.
    expect(screen.queryByText('RUC')).toBeNull();
    expect(screen.queryByText(/x3bet/)).toBeNull();
    expect(screen.queryByText(/00000000000/)).toBeNull();
  });

  it('renders no empty rows or links for a sparse business', () => {
    renderSection(sparseBusiness);

    expect(screen.getByText('Tienda Básica')).toBeDefined();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByText('Contacto Adicional')).toBeNull();
    expect(screen.queryByText('RUC')).toBeNull();
    expect(screen.queryByText('Email')).toBeNull();
    expect(screen.queryByText('WhatsApp')).toBeNull();
  });
});

// ─── Pure builder: buildSellerContactInfo ──────────────────────────────────

describe('buildSellerContactInfo — contact derivation', () => {
  it('maps every business field and keeps differing rep contacts as additional channels', () => {
    expect(buildSellerContactInfo(fullBusiness)).toEqual({
      businessName: 'Mi Tienda',
      taxId: '20123456789',
      email: 'hola@mitienda.com',
      whatsappNumber: '+51 999 888 777',
      waLink: 'https://wa.me/51999888777',
      address: 'Av. Lima 123',
      additionalEmail: 'ana@mitienda.com',
      additionalPhone: '+51 111 222 333',
      additionalWaLink: 'https://wa.me/51111222333',
    });
  });

  it('drops rep email when it equals the business email, ignoring case', () => {
    const info = buildSellerContactInfo({
      ...sameContactBusiness,
      legalRepPhone: '+51 111 222 333', // keep phone different so only email dedup is probed
    });

    expect(info.additionalEmail).toBeUndefined();
    expect(info.additionalPhone).toBe('+51 111 222 333');
  });

  it('drops rep phone when its digits equal the business whatsapp digits', () => {
    const info = buildSellerContactInfo({
      ...sameContactBusiness,
      legalRepEmail: 'ana@mitienda.com', // keep email different so only phone dedup is probed
    });

    expect(info.additionalEmail).toBe('ana@mitienda.com');
    expect(info.additionalPhone).toBeUndefined();
    expect(info.additionalWaLink).toBeUndefined();
  });

  it('keeps rep contact as fallback when the business has no own channels', () => {
    const info = buildSellerContactInfo(repOnlyContactBusiness);

    expect(info.email).toBeUndefined();
    expect(info.whatsappNumber).toBeUndefined();
    expect(info.additionalEmail).toBe('ana@mitienda.com');
    expect(info.additionalPhone).toBe('+51 111 222 333');
    expect(info.additionalWaLink).toBe('https://wa.me/51111222333');
  });

  it('never invents tokenized RUC data for missing taxId (DL 1524)', () => {
    const info = buildSellerContactInfo(sparseBusiness);

    expect(info).toEqual({
      businessName: 'Tienda Básica',
      taxId: undefined,
      email: undefined,
      whatsappNumber: undefined,
      waLink: undefined,
      address: undefined,
      additionalEmail: undefined,
      additionalPhone: undefined,
      additionalWaLink: undefined,
    });
    expect(JSON.stringify(info)).not.toMatch(/x3bet/);
    expect(JSON.stringify(info)).not.toMatch(/00000000000/);
  });
});
