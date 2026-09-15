// =====================================================
// src/lib/legal/gracePeriodWorkflow — Unit tests
// =====================================================
// Verifies the DS 011-2011-PCM grace period notification
// workflow:
//  - triggerGracePeriodNotifications sends the deactivation
//    notice and persists the written-notification record
//  - sendGracePeriodReminder sends the 72h reminder
//  - sendAppealReceivedNotification confirms appeal receipt
//  - sendAppealDecisionNotification delivers the decision
// Plus the two cross-cutting rules:
//  - feature flag ENABLE_AUTO_DEACTIVATION gates everything
//  - email failures are NON-FATAL (record still persists)
// =====================================================

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// Must be before module imports (vi.mock is hoisted).

const {
  mockBusinessFindFirst,
  mockNoticeFindFirst,
  mockAppealFindFirst,
  mockInsert,
  capturedInsertValues,
  mockSendEmail,
  mockDeactivationNotice,
  mockGracePeriodNotice,
  mockAppealReceivedNotice,
  mockAppealDecisionNotice,
} = vi.hoisted(() => {
  const capturedInsertValues: unknown[] = [];
  return {
    mockBusinessFindFirst: vi.fn(),
    mockNoticeFindFirst: vi.fn(),
    mockAppealFindFirst: vi.fn(),
    mockInsert: vi.fn(),
    capturedInsertValues,
    mockSendEmail: vi.fn(),
    mockDeactivationNotice: vi.fn(),
    mockGracePeriodNotice: vi.fn(),
    mockAppealReceivedNotice: vi.fn(),
    mockAppealDecisionNotice: vi.fn(),
  };
});

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: { findFirst: mockBusinessFindFirst },
      deactivationNotices: { findFirst: mockNoticeFindFirst },
      appeals: { findFirst: mockAppealFindFirst },
    },
    insert: mockInsert,
  },
}));

vi.mock('@/core/database/schema', () => ({
  businesses: {
    id: 'businesses.id',
    name: 'businesses.name',
    slug: 'businesses.slug',
    taxId: 'businesses.taxId',
    email: 'businesses.email',
    address: 'businesses.address',
    gracePeriodEndsAt: 'businesses.gracePeriodEndsAt',
  },
  deactivationNotices: {
    id: 'deactivationNotices.id',
    businessId: 'deactivationNotices.businessId',
    reason: 'deactivationNotices.reason',
    complaintCount: 'deactivationNotices.complaintCount',
    evidence: 'deactivationNotices.evidence',
    notificationSentAt: 'deactivationNotices.notificationSentAt',
    notificationMethod: 'deactivationNotices.notificationMethod',
    notificationReference: 'deactivationNotices.notificationReference',
    gracePeriodEndsAt: 'deactivationNotices.gracePeriodEndsAt',
    appealDeadline: 'deactivationNotices.appealDeadline',
    createdAt: 'deactivationNotices.createdAt',
  },
  appeals: {
    id: 'appeals.id',
    businessId: 'appeals.businessId',
    deactivationNoticeId: 'appeals.deactivationNoticeId',
  },
}));

vi.mock('@/lib/email/resend', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/legal/notificationTemplates', () => ({
  deactivationNotice: mockDeactivationNotice,
  gracePeriodNotice: mockGracePeriodNotice,
  appealReceivedNotice: mockAppealReceivedNotice,
  appealDecisionNotice: mockAppealDecisionNotice,
}));

import {
  sendAppealDecisionNotification,
  sendAppealReceivedNotification,
  sendGracePeriodReminder,
  triggerGracePeriodNotifications,
} from '@/lib/legal/gracePeriodWorkflow';

// ── Shared fixtures ──────────────────────────────────

function makeBusiness(overrides: Record<string, unknown> = {}) {
  return {
    id: 'biz-1',
    name: 'Mi Tienda SAC',
    slug: 'mi-tienda',
    taxId: '20123456789',
    email: 'tienda@example.com',
    address: 'Av. Lima 123, Miraflores',
    gracePeriodEndsAt: new Date('2026-09-18T12:00:00.000Z'),
    ...overrides,
  };
}

function makeNotice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notice-1',
    businessId: 'biz-1',
    reason: 'verified_complaints',
    gracePeriodEndsAt: new Date('2026-09-18T12:00:00.000Z'),
    appealDeadline: new Date('2026-09-24T12:00:00.000Z'),
    createdAt: new Date('2026-09-15T12:00:00.000Z'),
    ...overrides,
  };
}

function makeAppeal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appeal-1',
    businessId: 'biz-1',
    deactivationNoticeId: 'notice-1',
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('gracePeriodWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedInsertValues.length = 0;
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockBusinessFindFirst.mockResolvedValue(makeBusiness());
    mockNoticeFindFirst.mockResolvedValue(makeNotice());
    mockAppealFindFirst.mockResolvedValue(makeAppeal());

    mockSendEmail.mockResolvedValue(undefined);
    mockDeactivationNotice.mockReturnValue('<html>deactivation-notice</html>');
    mockGracePeriodNotice.mockReturnValue('<html>grace-period-reminder</html>');
    mockAppealReceivedNotice.mockReturnValue('<html>appeal-received</html>');
    mockAppealDecisionNotice.mockReturnValue('<html>appeal-decision</html>');

    mockInsert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((values: unknown) => {
        capturedInsertValues.push(values);
        return { returning: vi.fn().mockResolvedValue([{ id: 'notice-1' }]) };
      }),
    }));
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  describe('triggerGracePeriodNotifications', () => {
    test('returns skipped and touches nothing when feature flag is off', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await triggerGracePeriodNotifications('biz-1', 'verified_complaints', ['c1']);

      expect(result).toEqual({ success: false, skipped: true });
      expect(mockBusinessFindFirst).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when business is not found', async () => {
      mockBusinessFindFirst.mockResolvedValue(null);

      const result = await triggerGracePeriodNotifications('biz-1', 'verified_complaints', ['c1']);

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('sends deactivation notice and persists record with 72h grace period', async () => {
      const result = await triggerGracePeriodNotifications('biz-1', 'verified_complaints', [
        'c1',
        'c2',
      ]);

      // 72h grace window computed from now
      expect(result.success).toBe(true);
      expect(result.noticeId).toBe('notice-1');
      expect(result.graceUntil).toBeInstanceOf(Date);
      const deltaMs = (result.graceUntil as Date).getTime() - Date.now();
      expect(deltaMs).toBeGreaterThan(71.5 * 60 * 60 * 1000);
      expect(deltaMs).toBeLessThan(72.5 * 60 * 60 * 1000);

      // Template rendered with business + reason + complaints + graceUntil
      expect(mockDeactivationNotice).toHaveBeenCalledTimes(1);
      const templateArgs = mockDeactivationNotice.mock.calls[0][0];
      expect(templateArgs.reason).toBe('verified_complaints');
      expect(templateArgs.complaintIds).toEqual(['c1', 'c2']);
      expect(templateArgs.graceUntil).toBeInstanceOf(Date);
      expect(templateArgs.business).toMatchObject({
        id: 'biz-1',
        name: 'Mi Tienda SAC',
        slug: 'mi-tienda',
        legalName: 'Mi Tienda SAC',
        taxId: '20123456789',
        email: 'tienda@example.com',
        address: 'Av. Lima 123, Miraflores',
      });

      // Email sent to the business email with the rendered template
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendEmail.mock.calls[0][0];
      expect(emailParams.to).toBe('tienda@example.com');
      expect(emailParams.subject).toContain('Desactivación');
      expect(emailParams.subject).toContain('Mi Tienda SAC');
      expect(emailParams.html).toBe('<html>deactivation-notice</html>');

      // Written-notification record persisted
      expect(capturedInsertValues).toHaveLength(1);
      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect(insertValues.businessId).toBe('biz-1');
      expect(insertValues.reason).toBe('verified_complaints');
      expect(insertValues.complaintCount).toBe(2);
      expect(insertValues.notificationMethod).toBe('email');
      expect(insertValues.notificationReference).toBe('deactivation');
      expect(insertValues.notificationSentAt).toBeInstanceOf(Date);
      expect(insertValues.gracePeriodEndsAt).toBeInstanceOf(Date);
      expect(insertValues.appealDeadline).toBeInstanceOf(Date);
      expect(insertValues.evidence).toMatchObject({
        complaintIds: ['c1', 'c2'],
        orderIds: [],
        noticeKind: 'deactivation',
        subject: emailParams.subject,
        content: '<html>deactivation-notice</html>',
      });
    });

    test('uses the incomplete_orders reason branch', async () => {
      const result = await triggerGracePeriodNotifications('biz-1', 'incomplete_orders', []);

      expect(result.success).toBe(true);
      const templateArgs = mockDeactivationNotice.mock.calls[0][0];
      expect(templateArgs.reason).toBe('incomplete_orders');
      expect(templateArgs.complaintIds).toEqual([]);
      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect(insertValues.reason).toBe('incomplete_orders');
    });

    test('email failure is non-fatal: record persists and warning is logged', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const result = await triggerGracePeriodNotifications('biz-1', 'verified_complaints', ['c1']);

      expect(result.success).toBe(true);
      expect(result.noticeId).toBe('notice-1');
      expect(capturedInsertValues).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('sendGracePeriodReminder', () => {
    test('returns skipped when feature flag is off', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await sendGracePeriodReminder('biz-1');

      expect(result).toEqual({ success: false, skipped: true });
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when business is not found', async () => {
      mockBusinessFindFirst.mockResolvedValue(null);

      const result = await sendGracePeriodReminder('biz-1');

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    test('returns failure when business has no grace period', async () => {
      mockBusinessFindFirst.mockResolvedValue(makeBusiness({ gracePeriodEndsAt: null }));

      const result = await sendGracePeriodReminder('biz-1');

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when no deactivation notice is on record', async () => {
      mockNoticeFindFirst.mockResolvedValue(null);

      const result = await sendGracePeriodReminder('biz-1');

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('sends grace period reminder using business graceUntil and notice appeal deadline', async () => {
      const result = await sendGracePeriodReminder('biz-1');

      expect(result).toMatchObject({ success: true, noticeId: 'notice-1' });

      expect(mockGracePeriodNotice).toHaveBeenCalledTimes(1);
      const templateArgs = mockGracePeriodNotice.mock.calls[0][0];
      expect(templateArgs.business).toMatchObject({ id: 'biz-1', email: 'tienda@example.com' });
      expect(templateArgs.graceUntil).toEqual(new Date('2026-09-18T12:00:00.000Z'));
      expect(templateArgs.appealDeadline).toEqual(new Date('2026-09-24T12:00:00.000Z'));

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendEmail.mock.calls[0][0];
      expect(emailParams.to).toBe('tienda@example.com');
      expect(emailParams.subject).toContain('Recordatorio');
      expect(emailParams.html).toBe('<html>grace-period-reminder</html>');

      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect(insertValues.notificationReference).toBe('grace_period_reminder');
      expect(insertValues.reason).toBe('verified_complaints');
      expect(insertValues.gracePeriodEndsAt).toEqual(new Date('2026-09-18T12:00:00.000Z'));
      expect(insertValues.appealDeadline).toEqual(new Date('2026-09-24T12:00:00.000Z'));
      expect(insertValues.evidence).toMatchObject({
        noticeKind: 'grace_period_reminder',
        content: '<html>grace-period-reminder</html>',
      });
    });

    test('email failure is non-fatal: record persists and warning is logged', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const result = await sendGracePeriodReminder('biz-1');

      expect(result.success).toBe(true);
      expect(capturedInsertValues).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('sendAppealReceivedNotification', () => {
    test('returns skipped when feature flag is off', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await sendAppealReceivedNotification(
        'biz-1',
        'appeal-1',
        new Date('2026-09-24T12:00:00.000Z'),
      );

      expect(result).toEqual({ success: false, skipped: true });
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when appeal is not found', async () => {
      mockAppealFindFirst.mockResolvedValue(null);

      const result = await sendAppealReceivedNotification(
        'biz-1',
        'appeal-1',
        new Date('2026-09-24T12:00:00.000Z'),
      );

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when linked deactivation notice is not found', async () => {
      mockNoticeFindFirst.mockResolvedValue(null);

      const result = await sendAppealReceivedNotification(
        'biz-1',
        'appeal-1',
        new Date('2026-09-24T12:00:00.000Z'),
      );

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('sends appeal received confirmation and persists appeal_received record', async () => {
      const slaDeadline = new Date('2026-09-24T12:00:00.000Z');
      const result = await sendAppealReceivedNotification('biz-1', 'appeal-1', slaDeadline);

      expect(result).toMatchObject({ success: true, noticeId: 'notice-1' });

      expect(mockAppealReceivedNotice).toHaveBeenCalledTimes(1);
      const templateArgs = mockAppealReceivedNotice.mock.calls[0][0];
      expect(templateArgs.business).toMatchObject({ id: 'biz-1', email: 'tienda@example.com' });
      expect(templateArgs.appealId).toBe('appeal-1');
      expect(templateArgs.slaDeadline).toBe(slaDeadline);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendEmail.mock.calls[0][0];
      expect(emailParams.to).toBe('tienda@example.com');
      expect(emailParams.subject).toContain('Apelación');
      expect(emailParams.html).toBe('<html>appeal-received</html>');

      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect(insertValues.notificationReference).toBe('appeal_received');
      expect(insertValues.reason).toBe('verified_complaints');
      expect(insertValues.gracePeriodEndsAt).toEqual(new Date('2026-09-18T12:00:00.000Z'));
      expect(insertValues.appealDeadline).toEqual(new Date('2026-09-24T12:00:00.000Z'));
      expect(insertValues.evidence).toMatchObject({
        noticeKind: 'appeal_received',
        appealId: 'appeal-1',
        content: '<html>appeal-received</html>',
      });
    });

    test('email failure is non-fatal: record persists and warning is logged', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const result = await sendAppealReceivedNotification(
        'biz-1',
        'appeal-1',
        new Date('2026-09-24T12:00:00.000Z'),
      );

      expect(result.success).toBe(true);
      expect(capturedInsertValues).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('sendAppealDecisionNotification', () => {
    test('returns skipped when feature flag is off', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await sendAppealDecisionNotification('biz-1', 'approved', 'Notes');

      expect(result).toEqual({ success: false, skipped: true });
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('returns failure when no deactivation notice is on record', async () => {
      mockNoticeFindFirst.mockResolvedValue(null);

      const result = await sendAppealDecisionNotification('biz-1', 'approved', 'Notes');

      expect(result.success).toBe(false);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(capturedInsertValues).toHaveLength(0);
    });

    test('sends approved decision with reactivation date and persists appeal_decision record', async () => {
      const reactivatedAt = new Date('2026-09-16T10:00:00.000Z');
      const result = await sendAppealDecisionNotification(
        'biz-1',
        'approved',
        'Evidencia suficiente',
        reactivatedAt,
      );

      expect(result).toMatchObject({ success: true, noticeId: 'notice-1' });

      expect(mockAppealDecisionNotice).toHaveBeenCalledTimes(1);
      const templateArgs = mockAppealDecisionNotice.mock.calls[0][0];
      expect(templateArgs.business).toMatchObject({ id: 'biz-1', email: 'tienda@example.com' });
      expect(templateArgs.decision).toBe('approved');
      expect(templateArgs.adminNotes).toBe('Evidencia suficiente');
      expect(templateArgs.reactivatedAt).toBe(reactivatedAt);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendEmail.mock.calls[0][0];
      expect(emailParams.subject).toContain('Aprobada');
      expect(emailParams.html).toBe('<html>appeal-decision</html>');

      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect(insertValues.notificationReference).toBe('appeal_decision');
      expect(insertValues.evidence).toMatchObject({
        noticeKind: 'appeal_decision',
        decision: 'approved',
        adminNotes: 'Evidencia suficiente',
        reactivatedAt: '2026-09-16T10:00:00.000Z',
      });
    });

    test('sends rejected decision branch', async () => {
      const result = await sendAppealDecisionNotification('biz-1', 'rejected', 'Sin sustento');

      expect(result.success).toBe(true);
      const templateArgs = mockAppealDecisionNotice.mock.calls[0][0];
      expect(templateArgs.decision).toBe('rejected');
      expect(templateArgs.reactivatedAt).toBeUndefined();
      const emailParams = mockSendEmail.mock.calls[0][0];
      expect(emailParams.subject).toContain('Rechazada');
      const insertValues = capturedInsertValues[0] as Record<string, unknown>;
      expect((insertValues.evidence as Record<string, unknown>).decision).toBe('rejected');
    });

    test('email failure is non-fatal: record persists and warning is logged', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const result = await sendAppealDecisionNotification('biz-1', 'approved', 'Notes');

      expect(result.success).toBe(true);
      expect(capturedInsertValues).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
