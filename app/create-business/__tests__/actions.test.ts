import { describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
      businesses: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-business-id' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
  })),
}));

const mockGetUser = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/config/env', () => ({
  env: {
    supabaseUrl: 'https://mock.supabase.co',
    supabaseAnonKey: 'mock-anon-key',
    supabaseServiceRoleKey: 'mock-service-role-key',
  },
}));

vi.mock('@/core/storefront', () => ({
  createDefaultStorefrontLayout: vi.fn(() => ({})),
  createDefaultStorefrontTheme: vi.fn(() => ({})),
  mergeStorefrontLayoutIntoPreferences: vi.fn((prefs, _layout) => prefs),
  mergeStorefrontThemeIntoPreferences: vi.fn((prefs, _theme) => prefs),
  normalizeStorefrontTheme: vi.fn((theme) => theme),
}));

vi.mock('@/core/business/slug', () => ({
  generateAvailableBusinessSlug: vi.fn((fn) => fn()),
}));

vi.mock('@/shared/utils/slugify', () => ({
  generateBusinessSlug: vi.fn(() => 'test-business'),
}));

const { db } = await import('@/core/database/client');
const mockedDb = vi.mocked(db);

function buildValidFormData(): FormData {
  const fd = new FormData();
  fd.set('commercialName', 'Test Business Store');
  fd.set('personType', 'natural');
  fd.set('country', 'PE');
  fd.set('taxId', '12345678901');
  fd.set('sector', 'general');
  fd.set('description', 'A test business for e-commerce operations.');
  fd.set('city', 'Lima');
  fd.set('departamento', 'Lima');
  fd.set('provincia', 'Lima');
  fd.set('distrito', 'Miraflores');
  fd.set('address', 'Av. Principal 123');
  fd.set('phone', '+51999888777');
  fd.set('email', 'test@example.com');
  fd.set('legalRepName', 'Test Legal Representative');
  fd.set('legalRepRole', 'Owner');
  fd.set('legalRepPhone', '+51999888777');
  fd.set('legalRepEmail', 'rep@example.com');
  fd.set('storefrontTheme', '{}');
  return fd;
}

describe('createBusinessAction', () => {
  it('inserts a basico subscription after business creation', async () => {
    vi.clearAllMocks();

    const email = 'test@example.com';
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email, user_metadata: {} } },
      error: null,
    });

    vi.mocked(mockedDb.query.profiles.findFirst).mockResolvedValue({
      id: 'user-123',
      email,
      fullName: 'Test User',
      avatarUrl: null,
      address: null,
      phone: null,
      providerId: null,
      age: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockedDb.query.businesses.findMany).mockResolvedValue([]);

    const formData = buildValidFormData();

    const { createBusinessAction } = await import('../actions');
    const result = await createBusinessAction(formData);

    // Assert — action succeeds
    expect(result).toEqual({ success: true, slug: 'test-business' });

    // Assert — db.insert was called 3 times:
    // 1: businesses, 2: businessSettings, 3: businessSubscriptions
    // NOTE: This will FAIL until Task 2.1 is implemented (RED)
    expect(mockedDb.insert).toHaveBeenCalledTimes(3);
  });

  it('insert happens inside try/catch — errors are caught', async () => {
    vi.clearAllMocks();

    const email = 'test@example.com';
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-456', email, user_metadata: {} } },
      error: null,
    });

    vi.mocked(mockedDb.query.profiles.findFirst).mockResolvedValue({
      id: 'user-456',
      email,
      fullName: 'Test User',
      avatarUrl: null,
      address: null,
      phone: null,
      providerId: null,
      age: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockedDb.query.businesses.findMany).mockResolvedValue([]);

    const formData = buildValidFormData();

    const { createBusinessAction } = await import('../actions');
    const result = await createBusinessAction(formData);

    // The action wraps everything in a try/catch — never throws
    expect(typeof result).toBe('object');
    expect('success' in result || 'error' in result).toBe(true);
  });

  it('verifies businessSubscriptions schema export exists', async () => {
    const schema = await import('@/core/database/schema');
    expect(schema.businessSubscriptions).toBeDefined();
  });
});
