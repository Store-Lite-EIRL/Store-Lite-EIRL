import { describe, expect, test } from 'vitest';

// =====================================================
// CREATE ORDER REQUEST SCHEMA — Unit tests
// =====================================================

describe('createOrderRequestSchema', () => {
  test('accepts valid input with all required fields', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 5000,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(5000);
      expect(result.data.email).toBe('buyer@test.com');
      expect(result.data.businessId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.currency).toBe('PEN'); // default
    }
  });

  test('accepts valid input with all optional fields', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 3000,
      currency: 'USD',
      email: 'buyer@test.com',
      phone: '999888777',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      productId: '660e8400-e29b-41d4-a716-446655440001',
      description: 'Test order',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('999888777');
      expect(result.data.productId).toBe('660e8400-e29b-41d4-a716-446655440001');
      expect(result.data.description).toBe('Test order');
      expect(result.data.currency).toBe('USD');
    }
  });

  test('rejects amount less than 100', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 50,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Monto mínimo');
    }
  });

  test('rejects invalid email', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'not-an-email',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Email');
    }
  });

  test('rejects missing businessId', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'buyer@test.com',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod v4: missing required field — mentions 'Required'
      expect(result.error.issues.some((i) => i.path.includes('businessId'))).toBe(true);
    }
  });

  test('rejects invalid businessId UUID', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'buyer@test.com',
      businessId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de negocio inválido');
    }
  });

  test('rejects non-integer amount', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 100.5,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(false);
  });

  test('allows phone to be optional and nullable', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const withoutPhone = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(withoutPhone.success).toBe(true);

    const nullPhone = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      phone: null,
    });
    expect(nullPhone.success).toBe(true);
  });

  test('defaults currency to PEN when not provided', async () => {
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');

    const result = createOrderRequestSchema.safeParse({
      amount: 1000,
      email: 'buyer@test.com',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('PEN');
    }
  });
});
