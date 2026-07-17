import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/database/client', () => {
  class MockDb {
    query = {};
    select = vi.fn();
    insert = vi.fn();
    update = vi.fn();
  }
  return { db: new MockDb() };
});

import { complaintFormSchema, legalContentSchema } from '../actions';

describe('legalContentSchema', () => {
  it('accepts valid content', () => {
    const result = legalContentSchema.safeParse({
      termsContent: 'Términos y condiciones de la tienda...',
      returnsContent: 'Política de devoluciones...',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null content (clearing a field)', () => {
    const result = legalContentSchema.safeParse({
      termsContent: null,
      returnsContent: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts missing fields (undefined)', () => {
    const result = legalContentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects content over 10,000 characters', () => {
    const result = legalContentSchema.safeParse({
      termsContent: 'x'.repeat(10001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10,000');
    }
  });

  it('converts empty string to null', () => {
    const result = legalContentSchema.safeParse({
      termsContent: '',
      returnsContent: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.termsContent).toBeNull();
      expect(result.data.returnsContent).toBeNull();
    }
  });
});

describe('complaintFormSchema', () => {
  const validInput = {
    consumerLastName: 'García',
    consumerFirstName: 'Juan',
    consumerDocumentType: 'dni' as const,
    consumerDocumentId: '12345678',
    consumerAddress: 'Av. Principal 123',
    consumerPhone: '999888777',
    consumerEmail: 'juan@example.com',
    minorAge: false,
    guardianName: null,
    contractDescription: 'Compra de un teléfono celular',
    claimedAmount: null,
    claimDescription: 'El producto llegó dañado y no funciona correctamente. ',
    consumerRequest: 'Solicito el reembolso completo del producto.',
  };

  it('passes with valid complete input', () => {
    const result = complaintFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts Carné de Extranjería', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      consumerDocumentType: 'ce',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      consumerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('consumerEmail'));
      expect(emailError?.message).toContain('Correo');
    }
  });

  it('rejects claimDescription under 20 characters', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      claimDescription: 'Corto',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find((i) => i.path.includes('claimDescription'));
      expect(descError?.message).toContain('20');
    }
  });

  it('rejects claimDescription over 2000 characters', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      claimDescription: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find((i) => i.path.includes('claimDescription'));
      expect(descError?.message).toContain('2,000');
    }
  });

  it('rejects missing required fields', () => {
    const result = complaintFormSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have errors for all required fields
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('consumerLastName');
      expect(paths).toContain('consumerFirstName');
      expect(paths).toContain('consumerDocumentType');
      expect(paths).toContain('consumerDocumentId');
      expect(paths).toContain('consumerAddress');
      expect(paths).toContain('consumerPhone');
      expect(paths).toContain('consumerEmail');
      expect(paths).toContain('contractDescription');
      expect(paths).toContain('claimDescription');
      expect(paths).toContain('consumerRequest');
    }
  });

  it('accepts claimed amount as number', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      claimedAmount: 150.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.claimedAmount).toBe(150.5);
    }
  });

  it('accepts minor with guardian name', () => {
    const result = complaintFormSchema.safeParse({
      ...validInput,
      minorAge: true,
      guardianName: 'María López',
    });
    expect(result.success).toBe(true);
  });
});
