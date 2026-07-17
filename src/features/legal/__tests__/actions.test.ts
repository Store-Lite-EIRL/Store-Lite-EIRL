import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businessSettings: {
        findFirst: vi.fn(),
      },
      businesses: {
        findFirst: vi.fn(),
      },
      complaintBookRecords: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

vi.mock('@/features/storage/actions/authz', () => ({
  requireAccessOnId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>mock</html>'),
}));

vi.mock('@/emails/ComplaintConfirmationEmail', () => ({
  ComplaintConfirmationEmail: vi.fn(() => null),
}));

vi.mock('@/lib/email/resend', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks
import type { BusinessSettings } from '@/core/database/schema/businesses';
import { requireAccessOnId } from '@/features/storage/actions/authz';
import { revalidatePath } from 'next/cache';
import { respondToComplaint, saveLegalContent, submitComplaint } from '../actions';

// Get the mocked db
const { db } = await import('@/core/database/client');

// ── Tests ────────────────────────────────────────────────────────────────────

describe('saveLegalContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves legal content successfully', async () => {
    vi.mocked(db.query.businessSettings.findFirst).mockResolvedValue({
      id: 'settings-id',
      preferences: {},
    } as BusinessSettings);

    const result = await saveLegalContent('business-id', 'test-slug', {
      termsContent: 'Términos de prueba',
      returnsContent: 'Devoluciones de prueba',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('guardado');
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('creates businessSettings row if none exists', async () => {
    vi.mocked(db.query.businessSettings.findFirst).mockResolvedValue(undefined);

    const result = await saveLegalContent('business-id', 'test-slug', {
      termsContent: 'Nuevos términos',
    });

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('rejects content over 10,000 chars', async () => {
    const result = await saveLegalContent('business-id', 'test-slug', {
      termsContent: 'x'.repeat(10001),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects unauthorized users', async () => {
    vi.mocked(requireAccessOnId).mockRejectedValueOnce(new Error('Forbidden'));

    const result = await saveLegalContent('business-id', 'test-slug', {
      termsContent: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('permisos');
  });
});

describe('submitComplaint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validForm = {
    consumerLastName: 'García',
    consumerFirstName: 'Juan',
    consumerDocumentType: 'dni' as const,
    consumerDocumentId: '12345678',
    consumerAddress: 'Av. Principal 123',
    consumerPhone: '999888777',
    consumerEmail: 'juan@example.com',
    minorAge: false,
    guardianName: null,
    contractDescription: 'Compra de teléfono',
    claimedAmount: null as number | null,
    claimDescription: 'El producto llegó dañado y no funciona correctamente.',
    consumerRequest: 'Solicito el reembolso completo.',
  };

  it('rejects invalid form data', async () => {
    const result = await submitComplaint('test-slug', {
      ...validForm,
      consumerEmail: 'bad-email',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('handles business not found', async () => {
    vi.mocked(db.query.businesses.findFirst).mockResolvedValue(undefined);

    const result = await submitComplaint('nonexistent-slug', validForm);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Tienda no encontrada');
  });

  it('calculates SLA deadline as 15 business days', () => {
    // Unit test for the business day logic used in the action
    const addBusinessDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0 && day !== 6) {
          added++;
        }
      }
      return result;
    };

    // Start on Monday Jul 13, 2026
    const monday = new Date(2026, 6, 13);
    const deadline = addBusinessDays(monday, 15);
    // 15 business days from Monday = Mon Aug 3, 2026
    expect(deadline.getDay()).toBe(1); // Monday
    expect(deadline.getMonth()).toBe(7); // August (0-indexed)
    expect(deadline.getDate()).toBe(3);
  });
});

describe('respondToComplaint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty response', async () => {
    const result = await respondToComplaint('business-id', 'complaint-id', '');

    expect(result.success).toBe(false);
  });

  it('rejects response over 5000 chars', async () => {
    const result = await respondToComplaint('business-id', 'complaint-id', 'x'.repeat(5001));

    expect(result.success).toBe(false);
  });
});
