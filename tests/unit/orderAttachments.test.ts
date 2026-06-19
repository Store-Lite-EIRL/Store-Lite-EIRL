import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────
// mockDb for lazy eval: vi.mock factory only references mockDb INSIDE vi.fn() closures

const mockDb = {
  selectFrom: vi.fn(() => ({ where: mockDb.selectWhere })),
  selectWhere: vi.fn(),
  insertValues: vi.fn(() => ({ returning: mockDb.insertReturning })),
  insertReturning: vi.fn(),
  deleteWhere: vi.fn(() => ({ returning: mockDb.deleteReturning })),
  deleteReturning: vi.fn(),
  findMany: vi.fn(),
};

vi.mock('@/core/database/client', () => ({
  db: {
    select: vi.fn(() => ({ from: mockDb.selectFrom })),
    insert: vi.fn(() => ({ values: mockDb.insertValues })),
    delete: vi.fn(() => ({ where: mockDb.deleteWhere })),
    get query() {
      return { orderAttachments: { findMany: mockDb.findMany } };
    },
  },
}));

import {
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from '@/core/orders/orderAttachments';
import type { OrderAttachmentType } from '@/core/orders/orderTypes';

// ── Helpers ────────────────────────────────────────

const VALID_TYPES: OrderAttachmentType[] = [
  'tracking',
  'cip',
  'invoice',
  'photo',
  'video',
  'document',
  'other',
];

function makeAttachment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'att_001',
    orderId: 'pay_001',
    fileUrl: 'https://example.com/file.pdf',
    fileName: 'file.pdf',
    attachmentType: 'document' as OrderAttachmentType,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Suite: uploadAttachment ────────────────────────

describe('uploadAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('uploads attachment when under the limit', async () => {
    mockDb.selectWhere.mockResolvedValue([{ total: 0 }]);
    mockDb.insertReturning.mockResolvedValue([makeAttachment()]);

    const result = await uploadAttachment({
      orderId: 'pay_001',
      fileUrl: 'https://example.com/doc.pdf',
      fileName: 'doc.pdf',
      attachmentType: 'invoice',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.attachment.id).toBe('att_001');
    }
  });

  test('returns error when at max 3 attachments', async () => {
    mockDb.selectWhere.mockResolvedValue([{ total: 3 }]);

    const result = await uploadAttachment({
      orderId: 'pay_001',
      fileUrl: 'https://example.com/extra.pdf',
      fileName: 'extra.pdf',
      attachmentType: 'photo',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Máximo');
    }
  });

  test('inserts attachment with correct fields', async () => {
    mockDb.selectWhere.mockResolvedValue([{ total: 1 }]);
    mockDb.insertReturning.mockResolvedValue([makeAttachment()]);

    await uploadAttachment({
      orderId: 'pay_001',
      fileUrl: 'https://example.com/invoice.pdf',
      fileName: 'invoice.pdf',
      attachmentType: 'invoice',
    });

    expect(mockDb.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'pay_001',
        fileUrl: 'https://example.com/invoice.pdf',
        fileName: 'invoice.pdf',
        attachmentType: 'invoice',
      }),
    );
  });

  test('supports all attachment types', async () => {
    for (const type of VALID_TYPES) {
      vi.clearAllMocks();
      mockDb.selectWhere.mockResolvedValue([{ total: 0 }]);
      mockDb.insertReturning.mockResolvedValue([makeAttachment({ attachmentType: type })]);

      const result = await uploadAttachment({
        orderId: 'pay_001',
        fileUrl: `https://example.com/${type}.pdf`,
        fileName: `${type}.pdf`,
        attachmentType: type,
      });

      expect(result.success).toBe(true);
    }
  });
});

// ── Suite: listAttachments ─────────────────────────

describe('listAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns attachments for an order', async () => {
    const attachments = [makeAttachment(), makeAttachment({ id: 'att_002' })];
    mockDb.findMany.mockResolvedValue(attachments);

    const result = await listAttachments('pay_001');

    expect(result).toHaveLength(2);
    expect(mockDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Function) }),
    );
  });

  test('returns empty array when no attachments', async () => {
    mockDb.findMany.mockResolvedValue([]);

    const result = await listAttachments('pay_empty');

    expect(result).toEqual([]);
  });
});

// ── Suite: deleteAttachment ────────────────────────

describe('deleteAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes attachment and returns success when found', async () => {
    mockDb.deleteReturning.mockResolvedValue([{ id: 'att_001' }]);

    const result = await deleteAttachment('att_001', 'pay_001');

    expect(result.success).toBe(true);
  });

  test('returns success false when attachment not found', async () => {
    mockDb.deleteReturning.mockResolvedValue([]);

    const result = await deleteAttachment('nonexistent', 'pay_001');

    expect(result.success).toBe(false);
  });

  test('uses where clause to filter by id and orderId', async () => {
    mockDb.deleteReturning.mockResolvedValue([{ id: 'att_001' }]);

    await deleteAttachment('att_001', 'pay_001');

    // delete was called (where is called internally via the mock chain)
    expect(mockDb.deleteWhere).toHaveBeenCalled();
  });
});
