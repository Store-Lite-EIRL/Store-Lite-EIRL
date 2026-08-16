import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  businessSettingsFindFirst: vi.fn(),
  businessesFindFirst: vi.fn(),
  complaintBookRecordsFindFirst: vi.fn(),
  // select(...).from(...).where(...) is used for BOTH the 24h rate-limit
  // count query and the MAX(seq) ticket query. We control each via a row queue.
  selectRows: [] as unknown[][],
  insertReturning: vi.fn(),
  updateSet: vi.fn(),
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businessSettings: { findFirst: mocks.businessSettingsFindFirst },
      businesses: { findFirst: mocks.businessesFindFirst },
      complaintBookRecords: { findFirst: mocks.complaintBookRecordsFindFirst },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const rows = mocks.selectRows.shift() ?? [];
          const arr = [...rows] as unknown[] & { limit?: unknown };
          arr.limit = () => Promise.resolve(arr);
          return arr;
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: mocks.insertReturning })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: mocks.updateSet })),
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
import { sendEmail } from '@/lib/email/resend';
import { revalidatePath } from 'next/cache';
import {
  respondToComplaint,
  saveLegalContent,
  submitComplaint,
  submitPlatformComplaint,
} from '../actions';

// Get the mocked db
const { db } = await import('@/core/database/client');

// Shared valid complaint payload (platform & per-store)
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
  fax: '',
};

function seedSelectQueueRows(...rows: unknown[][]) {
  mocks.selectRows.push(...rows);
}

describe('saveLegalContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectRows.length = 0;
  });

  it('saves legal content successfully', async () => {
    mocks.businessSettingsFindFirst.mockResolvedValue({
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
    mocks.businessSettingsFindFirst.mockResolvedValue(undefined);

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
    mocks.selectRows.length = 0;
  });

  it('rejects invalid form data', async () => {
    const result = await submitComplaint('test-slug', {
      ...validForm,
      consumerEmail: 'bad-email',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('handles business not found', async () => {
    mocks.businessesFindFirst.mockResolvedValue(undefined);

    const result = await submitComplaint('nonexistent-slug', validForm);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Tienda no encontrada');
  });

  it('submits a valid complaint end-to-end', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'bus-123',
      name: 'Mi Tienda',
    });
    seedSelectQueueRows([], []);
    mocks.insertReturning.mockResolvedValue([{ id: 'record-1' }]);

    const result = await submitComplaint('test-slug', validForm);

    expect(result.success).toBe(true);
    expect(result.ticketNumber).toMatch(/^LR-2026-/);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('calculates SLA deadline as 15 business days', () => {
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

    const monday = new Date(2026, 6, 13);
    const deadline = addBusinessDays(monday, 15);
    expect(deadline.getDay()).toBe(1); // Monday
    expect(deadline.getMonth()).toBe(7); // August (0-indexed)
    expect(deadline.getDate()).toBe(3);
  });
});

describe('submitPlatformComplaint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectRows.length = 0;
  });

  it('resolves the platform business and returns a ticket + insert', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'platform-bus-id',
      name: 'Devkittop',
    });
    seedSelectQueueRows([], []);
    mocks.insertReturning.mockResolvedValue([{ id: 'record-9' }]);

    const result = await submitPlatformComplaint(validForm);

    expect(mocks.businessesFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.anything() }),
    );
    expect(result.success).toBe(true);
    expect(result.ticketNumber).toMatch(/^LR-2026-/);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid form data without inserting', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'dev-bus',
      name: 'Devkittop',
    });

    const result = await submitPlatformComplaint({
      ...validForm,
      consumerEmail: 'not-an-email',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns fake success for honeypot-triggering bots and inserts nothing', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'dev-bus',
      name: 'Devkittop',
    });

    const result = await submitPlatformComplaint({ ...validForm, fax: 'spam' });

    expect(result.success).toBe(true);
    expect(result.ticketNumber).toBe('LR-0000-00000000-0000');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('blocks a duplicate complaint from the same email within 24h', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'dev-bus',
      name: 'Devkittop',
    });
    seedSelectQueueRows([{ count: '1' }]);

    const result = await submitPlatformComplaint(validForm);

    expect(result.success).toBe(false);
    expect(result.error).toContain('24 horas');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('fails with a generic error when the platform business is missing', async () => {
    mocks.businessesFindFirst.mockResolvedValue(undefined);

    const result = await submitPlatformComplaint(validForm);

    expect(result.success).toBe(false);
    // Must NOT leak the platform business detail in a public generic path
    expect(result.error).not.toContain('devkittop');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('keeps the record when the confirmation email fails', async () => {
    mocks.businessesFindFirst.mockResolvedValue({
      id: 'dev-bus',
      name: 'Devkittop',
    });
    seedSelectQueueRows([], []);
    mocks.insertReturning.mockResolvedValue([{ id: 'record-10' }]);

    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP down'));

    const result = await submitPlatformComplaint(validForm);

    expect(result.success).toBe(true);
    expect(result.emailFailed).toBe(true);
    expect(result.ticketNumber).toMatch(/^LR-2026-/);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});

describe('respondToComplaint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectRows.length = 0;
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
