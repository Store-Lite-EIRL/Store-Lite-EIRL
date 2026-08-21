// =====================================================
// ROOT PROXY — Unit tests
// =====================================================
// Verifies that platform-only routes (/auth, /pricing, ...) are
// redirected to the platform domain when requested from a tenant
// subdomain, instead of being rewritten to app/[slug]/... where
// they do not exist (404) or trigger auth redirect loops.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks (must be before module imports — vi.mock is hoisted) ──

const mockUpdateProxy = vi.fn();

vi.mock('@/config/env', () => ({
  env: {
    featureSubdomainRewrite: true,
    nextPublicAppUrl: 'https://storelite.app',
  },
}));

vi.mock('@/lib/supabase/proxy', () => ({
  updateProxy: mockUpdateProxy,
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, resetInMs: 60_000 })),
  getClientIdentifier: vi.fn(() => 'test-client-ip'),
  RATE_LIMITS: { auth: {}, api: {} },
}));

// NOTE: extractTenantSlugFromHost / isTenantHost are NOT mocked —
// the real implementations are deterministic for the hosts used here
// and exercising them keeps the tests closer to production behavior.

// ── Helpers ──────────────────────────────────────────

const TENANT_HOST = 'tienda1.storelite.app';
const PLATFORM_HOST = 'storelite.app';

function createRequest(pathWithQuery: string, host: string = TENANT_HOST): NextRequest {
  return new NextRequest(`https://${host}${pathWithQuery}`);
}

async function expectNoRedirect(pathWithQuery: string, host: string = TENANT_HOST) {
  const { proxy } = await import('../../proxy');
  const request = createRequest(pathWithQuery, host);
  const response = await proxy(request);

  expect(response.headers.get('location')).toBeNull();
  expect(response.status).not.toBe(301);
  expect(response.status).not.toBe(302);
  expect(response.status).not.toBe(307);
  expect(response.status).not.toBe(308);

  return response;
}

// ── Suite ────────────────────────────────────────────

describe('proxy — platform routes on tenant subdomains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: session layer allows the request through (200).
    mockUpdateProxy.mockReturnValue(NextResponse.next());
  });

  describe('platform-only routes redirect to the platform domain', () => {
    test.each([
      ['/pricing', '/pricing'],
      ['/auth', '/auth'],
      ['/auth/customer', '/auth/customer'],
      ['/onboarding', '/onboarding'],
      ['/created', '/created'],
      ['/list-business', '/list-business'],
    ])('%s redirects (302) to the platform domain', async (path, expectedPath) => {
      const { proxy } = await import('../../proxy');
      const request = createRequest(path);
      const response = await proxy(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(`https://storelite.app${expectedPath}`);
      expect(mockUpdateProxy).not.toHaveBeenCalled();
    });

    test('/pricing preserves the query string in the redirect', async () => {
      const { proxy } = await import('../../proxy');
      const request = createRequest('/pricing?slug=mi-tienda&utm_source=email');
      const response = await proxy(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        'https://storelite.app/pricing?slug=mi-tienda&utm_source=email',
      );
    });
  });

  describe('prefix safety', () => {
    test('/pricingxyz is NOT treated as a platform route', async () => {
      const response = await expectNoRedirect('/pricingxyz');

      // It must flow through the regular tenant rewrite path.
      expect(mockUpdateProxy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });
  });

  describe('storefront behavior on tenant hosts is preserved', () => {
    test('/ keeps the slug rewrite (no redirect)', async () => {
      const response = await expectNoRedirect('/');

      expect(mockUpdateProxy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('/product/abc keeps the slug rewrite (no redirect)', async () => {
      const response = await expectNoRedirect('/product/abc');

      expect(mockUpdateProxy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('/terminos keeps the slug rewrite (no redirect)', async () => {
      const response = await expectNoRedirect('/terminos');

      expect(mockUpdateProxy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });
  });

  describe('non-tenant hosts', () => {
    test('/pricing on the platform domain is not redirected by this logic', async () => {
      const response = await expectNoRedirect('/pricing', PLATFORM_HOST);

      expect(mockUpdateProxy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });
  });
});
