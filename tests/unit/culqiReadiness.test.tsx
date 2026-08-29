import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks (vi.hoisted ensures availability in vi.mock factories) ────

const {
  mockProductsFindMany,
  mockProductMediaFindMany,
  mockBusinessesFindFirst,
  mockBusinessSettingsFindFirst,
} = vi.hoisted(() => ({
  mockProductsFindMany: vi.fn(),
  mockProductMediaFindMany: vi.fn(),
  mockBusinessesFindFirst: vi.fn(),
  mockBusinessSettingsFindFirst: vi.fn(),
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      products: { findMany: mockProductsFindMany },
      productMedia: { findMany: mockProductMediaFindMany },
      businesses: { findFirst: mockBusinessesFindFirst },
      businessSettings: { findFirst: mockBusinessSettingsFindFirst },
    },
  },
}));

import CulqiReadinessCheck from '@/app/[slug]/(app)/settings/components/CulqiReadinessCheck';
import * as culqiReadiness from '@/features/settings/actions/culqiReadiness';
import { evaluateCulqiReadiness } from '@/features/settings/lib/culqiReadiness';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// ── Test Data ────────────────────────────────────────

const defaultPreferences = {
  terms: 'Terms text',
  returns: 'Returns text',
  complaintsEnabled: true,
  complaintBookEnabled: false,
};

const defaultSocialLinks = { facebook: 'https://facebook.com/test' };

function makeBusiness(overrides: Record<string, unknown> = {}) {
  return {
    id: 'business-1',
    email: 'test@example.com',
    address: '123 Main St',
    socialLinks: defaultSocialLinks,
    ...overrides,
  };
}

function makeSettings(overrides: Record<string, unknown> = {}) {
  return {
    id: 'settings-1',
    businessId: 'business-1',
    preferences: defaultPreferences,
    ...overrides,
  };
}

function makeProducts(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    businessId: 'business-1',
    isAvailable: true,
    description: `Product ${i} description`,
    price: '19.99',
    ...overrides,
  }));
}

function makeMedia(productId: string) {
  return [{ id: 'media-1', productId, mediaUrl: 'https://example.com/img.jpg' }];
}

// ── Server Action Tests ──────────────────────────────

describe('checkCulqiReadiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns ready=true when all 9 checks pass', async () => {
    const business = makeBusiness();
    const settings = makeSettings();
    const products = makeProducts(5);
    const media = products.map((p) => makeMedia(p.id));

    mockBusinessesFindFirst.mockResolvedValue(business);
    mockBusinessSettingsFindFirst.mockResolvedValue(settings);
    mockProductsFindMany.mockResolvedValue(products);
    mockProductMediaFindMany.mockResolvedValue(media.flat());

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    expect(result.ready).toBe(true);
    expect(result.checks).toHaveLength(9);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  test('product_count fails with zero products', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue([]);
    mockProductMediaFindMany.mockResolvedValue([]);

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const productCount = result.checks.find((c) => c.id === 'product_count')!;
    expect(productCount.passed).toBe(false);
    expect(productCount.message).toContain('0');
  });

  test('product_count fails with fewer than 5 products', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(makeProducts(3));
    mockProductMediaFindMany.mockResolvedValue([]);

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const productCount = result.checks.find((c) => c.id === 'product_count')!;
    expect(productCount.passed).toBe(false);
    expect(productCount.message).toContain('3');
  });

  test('product_images fails when a product has no media', async () => {
    const products = makeProducts(5);
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(products);
    mockProductMediaFindMany.mockResolvedValue(makeMedia(products[0].id));

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'product_images')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('4');
  });

  test('product_descriptions fails when description is null', async () => {
    const products = makeProducts(5, { description: null });
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(products);
    mockProductMediaFindMany.mockResolvedValue(products.map((p) => makeMedia(p.id)).flat());

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'product_descriptions')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('5');
  });

  test('product_prices fails when price is 0', async () => {
    const products = makeProducts(5, { price: '0' });
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(products);
    mockProductMediaFindMany.mockResolvedValue(products.map((p) => makeMedia(p.id)).flat());

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'product_prices')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('5');
  });

  test('terms fails when preferences.terms is missing', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(
      makeSettings({ preferences: { ...defaultPreferences, terms: '' } }),
    );
    mockProductsFindMany.mockResolvedValue(makeProducts(5));
    mockProductMediaFindMany.mockResolvedValue(
      makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    );

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'terms')!;
    expect(check.passed).toBe(false);
  });

  test('returns fails when preferences.returns is empty string', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(
      makeSettings({ preferences: { ...defaultPreferences, returns: '' } }),
    );
    mockProductsFindMany.mockResolvedValue(makeProducts(5));
    mockProductMediaFindMany.mockResolvedValue(
      makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    );

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'returns')!;
    expect(check.passed).toBe(false);
  });

  test('complaints_book fails when complaintsEnabled is false', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness());
    mockBusinessSettingsFindFirst.mockResolvedValue(
      makeSettings({
        preferences: {
          ...defaultPreferences,
          complaintsEnabled: false,
          complaintBookEnabled: false,
        },
      }),
    );
    mockProductsFindMany.mockResolvedValue(makeProducts(5));
    mockProductMediaFindMany.mockResolvedValue(
      makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    );

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'complaints_book')!;
    expect(check.passed).toBe(false);
  });

  test('contact_info fails when email is null', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness({ email: null }));
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(makeProducts(5));
    mockProductMediaFindMany.mockResolvedValue(
      makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    );

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'contact_info')!;
    expect(check.passed).toBe(false);
  });

  test('social_media fails when social_links is empty object', async () => {
    mockBusinessesFindFirst.mockResolvedValue(makeBusiness({ socialLinks: {} }));
    mockBusinessSettingsFindFirst.mockResolvedValue(makeSettings());
    mockProductsFindMany.mockResolvedValue(makeProducts(5));
    mockProductMediaFindMany.mockResolvedValue(
      makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    );

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    const check = result.checks.find((c) => c.id === 'social_media')!;
    expect(check.passed).toBe(false);
  });

  test('business not found returns all checks failing', async () => {
    mockBusinessesFindFirst.mockResolvedValue(null);
    mockBusinessSettingsFindFirst.mockResolvedValue(null);
    mockProductsFindMany.mockResolvedValue([]);
    mockProductMediaFindMany.mockResolvedValue([]);

    const { checkCulqiReadiness } = await import('@/features/settings/actions/culqiReadiness');
    const result = await checkCulqiReadiness('business-1');

    expect(result.ready).toBe(false);
    expect(result.checks).toHaveLength(9);
    expect(result.checks.every((c) => c.passed === false)).toBe(true);
  });
});

// ── evaluateCulqiReadiness (Pure Function) Tests ─────

describe('evaluateCulqiReadiness', () => {
  test('all checks pass with valid data', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings(),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    expect(result.ready).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  test('all checks fail when data is empty', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness({ email: null, address: null, socialLinks: null }),
      settings: makeSettings({ preferences: {} }),
      products: [],
      media: [],
    });

    expect(result.ready).toBe(false);
    expect(result.checks.every((c) => c.passed === false)).toBe(true);
  });

  test('product_images fails when product has no media', () => {
    const products = makeProducts(5);
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings(),
      products,
      media: makeMedia(products[0].id),
    });

    const check = result.checks.find((c) => c.id === 'product_images')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('4');
  });

  test('product_descriptions fails when description is empty', () => {
    const products = makeProducts(5, { description: '' });
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings(),
      products,
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'product_descriptions')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('5');
  });

  test('product_prices fails when price is 0', () => {
    const products = makeProducts(5, { price: '0' });
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings(),
      products,
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'product_prices')!;
    expect(check.passed).toBe(false);
    expect(check.message).toContain('5');
  });

  test('terms fails when missing from preferences', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings({ preferences: { ...defaultPreferences, terms: '' } }),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'terms')!;
    expect(check.passed).toBe(false);
  });

  test('returns fails when missing from preferences', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings({ preferences: { ...defaultPreferences, returns: '' } }),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'returns')!;
    expect(check.passed).toBe(false);
  });

  test('complaints_book passes when complaintsEnabled is true', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings(),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'complaints_book')!;
    expect(check.passed).toBe(true);
  });

  test('complaints_book passes when complaintBookEnabled is true', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness(),
      settings: makeSettings({
        preferences: {
          ...defaultPreferences,
          complaintsEnabled: false,
          complaintBookEnabled: true,
        },
      }),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'complaints_book')!;
    expect(check.passed).toBe(true);
  });

  test('contact_info fails when address is null', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness({ address: null }),
      settings: makeSettings(),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'contact_info')!;
    expect(check.passed).toBe(false);
  });

  test('social_media fails when social_links is null', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness({ socialLinks: null }),
      settings: makeSettings(),
      products: makeProducts(5),
      media: makeProducts(5)
        .map((p) => makeMedia(p.id))
        .flat(),
    });

    const check = result.checks.find((c) => c.id === 'social_media')!;
    expect(check.passed).toBe(false);
  });

  test('reports correct passedCount', () => {
    const result = evaluateCulqiReadiness({
      business: makeBusiness({ email: null }),
      settings: makeSettings({ preferences: { ...defaultPreferences, terms: '' } }),
      products: makeProducts(3),
      media: [],
    });

    const passed = result.checks.filter((c) => c.passed).length;
    expect(result.checks).toHaveLength(9);
    expect(result.passedCount).toBe(passed);
    expect(passed).toBeGreaterThanOrEqual(0);
    expect(passed).toBeLessThanOrEqual(9);
  });
});

// ── CulqiReadinessCheck Component Tests ──────────────

describe('CulqiReadinessCheck', () => {
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    spy = vi.spyOn(culqiReadiness, 'checkCulqiReadiness');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test('shows loading skeleton while fetching', () => {
    spy.mockReturnValue(new Promise(() => {})); // never resolves

    render(<CulqiReadinessCheck businessId="business-1" />);

    expect(screen.getAllByTestId('skeleton-line').length).toBeGreaterThan(0);
  });

  test('shows progress bar and check list when results load', async () => {
    spy.mockResolvedValue({
      ready: true,
      passedCount: 9,
      checks: Array.from({ length: 9 }, (_, i) => ({
        id: `check-${i}`,
        label: `Check ${i}`,
        passed: true,
        message: 'Passed',
      })),
    });

    render(<CulqiReadinessCheck businessId="business-1" />);

    await waitFor(() => {
      expect(screen.getByText('9 de 9 requisitos cumplidos')).toBeInTheDocument();
    });

    expect(screen.getByText('Check 0')).toBeInTheDocument();
    expect(screen.getByText('Check 8')).toBeInTheDocument();
  });

  test('shows pending hint when not ready instead of a dead button', async () => {
    spy.mockResolvedValue({
      ready: false,
      passedCount: 7,
      checks: Array.from({ length: 9 }, (_, i) => ({
        id: `check-${i}`,
        label: `Check ${i}`,
        passed: i < 7,
        message: i < 7 ? 'Passed' : 'Failed',
      })),
    });

    render(<CulqiReadinessCheck businessId="business-1" />);

    await waitFor(() => {
      expect(screen.getByText('7 de 9 requisitos cumplidos')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Faltan 2 requisito(s) para solicitar la aprobación de Culqi.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Solicitar aprobación Culqi')).toBeNull();
  });

  test('button is enabled when all checks pass', async () => {
    spy.mockResolvedValue({
      ready: true,
      passedCount: 9,
      checks: Array.from({ length: 9 }, (_, i) => ({
        id: `check-${i}`,
        label: `Check ${i}`,
        passed: true,
        message: 'Passed',
      })),
    });

    render(<CulqiReadinessCheck businessId="business-1" />);

    await waitFor(() => {
      expect(screen.getByText('9 de 9 requisitos cumplidos')).toBeInTheDocument();
    });

    const button = screen.getByText('Solicitar aprobación Culqi');
    expect(button.closest('[disabled]')).toBeFalsy();
  });

  test('shows plan-gating hint when not interactive even if ready', async () => {
    spy.mockResolvedValue({
      ready: true,
      passedCount: 9,
      checks: Array.from({ length: 9 }, (_, i) => ({
        id: `check-${i}`,
        label: `Check ${i}`,
        passed: true,
        message: 'Passed',
      })),
    });

    render(<CulqiReadinessCheck businessId="business-1" interactive={false} />);

    await waitFor(() => {
      expect(screen.getByText('9 de 9 requisitos cumplidos')).toBeInTheDocument();
    });

    expect(screen.getByText('Disponible en planes Business Pro o superior.')).toBeInTheDocument();
    expect(screen.queryByText('Solicitar aprobación Culqi')).toBeNull();
  });

  test('opens Culqi affiliation page when ready and interactive', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    spy.mockResolvedValue({
      ready: true,
      passedCount: 9,
      checks: Array.from({ length: 9 }, (_, i) => ({
        id: `check-${i}`,
        label: `Check ${i}`,
        passed: true,
        message: 'Passed',
      })),
    });

    render(<CulqiReadinessCheck businessId="business-1" />);

    await waitFor(() => {
      expect(screen.getByText('9 de 9 requisitos cumplidos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Solicitar aprobación Culqi'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://afiliate.culqi.com',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });

  test('shows error state with retry button when action fails', async () => {
    spy.mockRejectedValue(new Error('Network error'));

    render(<CulqiReadinessCheck businessId="business-1" />);

    await waitFor(() => {
      expect(screen.getByText(/error al verificar/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
