import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database client and schema
vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: {
        findFirst: vi.fn(),
      },
      complaintBookRecords: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      deactivationNotices: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      appeals: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'notice-1' }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@/core/database/schema', () => ({
  businesses: {
    id: 'id',
    businessId: 'businessId',
    isActive: 'isActive',
    appealStatus: 'appealStatus',
    deactivationReason: 'deactivationReason',
    deactivationDate: 'deactivationDate',
    gracePeriodEndsAt: 'gracePeriodEndsAt',
  },
  complaintBookRecords: {
    id: 'id',
    businessId: 'businessId',
    isVerified: 'isVerified',
    verifiedAt: 'verifiedAt',
  },
  deactivationNotices: {
    id: 'id',
    businessId: 'businessId',
    isResolved: 'isResolved',
    gracePeriodEndsAt: 'gracePeriodEndsAt',
    appealDeadline: 'appealDeadline',
  },
  appeals: {
    id: 'id',
    businessId: 'businessId',
    deactivationNoticeId: 'deactivationNoticeId',
    status: 'status',
    slaDeadline: 'slaDeadline',
    slaBreached: 'slaBreached',
  },
  payments: {},
  eq: vi.fn((col, val) => `${col}=${val}`),
  and: vi.fn((...args) => args.join(' AND ')),
  gte: vi.fn((col, val) => `${col}>=${val}`),
  lt: vi.fn((col, val) => `${col}<${val}`),
  desc: vi.fn((col) => `${col} DESC`),
  sql: vi.fn((strings, ...values) => strings.join('?')),
  count: vi.fn((col) => `count(${col})`),
}));

vi.mock('@/lib/complaintScoring', () => ({
  calculateComplaintScore: vi.fn(),
  updateComplaintScore: vi.fn(),
}));

vi.mock('@/lib/incompleteOrderRate', () => ({
  checkIncompleteOrderDeactivation: vi.fn(),
}));

vi.mock('@/lib/incompleteOrderRateCore', () => ({
  get30DayWindowStart: vi.fn(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
}));

import { db } from '@/core/database/client';
import {
  checkComplaintDeactivation,
  executeDeactivation,
  processAppealSLABreaches,
  processComplaintSubmission,
  processExpiredGracePeriods,
  processOrderCompletion,
  reviewAppeal,
  submitAppeal,
} from '@/lib/deactivation';

describe('Deactivation Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  describe('checkComplaintDeactivation', () => {
    it('should return false when feature flag is disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await checkComplaintDeactivation('biz-1');

      expect(result.shouldDeactivate).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('should return false when less than 3 verified complaints', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]),
        }),
      });
      (db as any).select = mockSelect;

      const result = await checkComplaintDeactivation('biz-1');

      expect(result.shouldDeactivate).toBe(false);
      expect(result.complaintCount).toBe(2);
    });

    it('should return true when >=3 verified complaints', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }]),
        }),
      });
      (db as any).select = mockSelect;

      const result = await checkComplaintDeactivation('biz-1');

      expect(result.shouldDeactivate).toBe(true);
      expect(result.reason).toBe('verified_complaints');
      expect(result.complaintCount).toBe(3);
      expect(result.evidence?.complaintIds).toEqual(['c1', 'c2', 'c3']);
    });

    it('should return true when >3 verified complaints', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([
              { id: 'c1' },
              { id: 'c2' },
              { id: 'c3' },
              { id: 'c4' },
              { id: 'c5' },
            ]),
        }),
      });
      (db as any).select = mockSelect;

      const result = await checkComplaintDeactivation('biz-1');

      expect(result.shouldDeactivate).toBe(true);
      expect(result.complaintCount).toBe(5);
    });
  });

  describe('executeDeactivation', () => {
    it('should return error when feature flag is disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-deactivation disabled');
    });

    it('should return error when business already inactive', async () => {
      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: false,
        appealStatus: null,
      });

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Business already inactive');
    });

    it('should return error when appeal already pending', async () => {
      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: true,
        appealStatus: 'pending',
      });

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appeal already pending');
    });

    it('should return error when already in grace period', async () => {
      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: true,
        appealStatus: null,
      });
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue({
        id: 'notice-1',
        gracePeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already in grace period');
    });

    it('should return error when appeal pending', async () => {
      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: true,
        appealStatus: null,
      });
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue(null);
      (db.query.appeals.findFirst as any).mockResolvedValue({
        id: 'appeal-1',
        status: 'pending',
      });

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appeal pending');
    });

    it('should execute deactivation successfully', async () => {
      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: true,
        appealStatus: null,
      });
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue(null);
      (db.query.appeals.findFirst as any).mockResolvedValue(null);

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'notice-1' }]),
        }),
      });
      (db as any).insert = mockInsert;

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      const result = await executeDeactivation('biz-1', {
        shouldDeactivate: true,
        reason: 'verified_complaints',
        complaintCount: 3,
      });

      expect(result.success).toBe(true);
      expect(result.deactivationNoticeId).toBe('notice-1');
      expect(result.gracePeriodEndsAt).toBeInstanceOf(Date);
      expect(result.appealDeadline).toBeInstanceOf(Date);

      // Verify business was updated
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('processComplaintSubmission', () => {
    it('should return early when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const { calculateComplaintScore, updateComplaintScore } =
        await import('@/lib/complaintScoring');
      (calculateComplaintScore as any).mockResolvedValue({
        score: 75,
        tier: 'verified',
        breakdown: {},
      });

      await processComplaintSubmission('complaint-1', 'biz-1');

      expect(calculateComplaintScore).not.toHaveBeenCalled();
    });

    it('should calculate score and update complaint', async () => {
      const { calculateComplaintScore, updateComplaintScore } =
        await import('@/lib/complaintScoring');
      (calculateComplaintScore as any).mockResolvedValue({
        score: 75,
        tier: 'verified',
        breakdown: {},
      });
      (updateComplaintScore as any).mockResolvedValue(undefined);

      // Mock checkComplaintDeactivation to return false
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      (db as any).select = mockSelect;

      await processComplaintSubmission('complaint-1', 'biz-1');

      expect(calculateComplaintScore).toHaveBeenCalledWith('complaint-1', 'biz-1');
      expect(updateComplaintScore).toHaveBeenCalledWith('complaint-1', expect.any(Object));
    });

    it('should not check deactivation if complaint not verified', async () => {
      const { calculateComplaintScore } = await import('@/lib/complaintScoring');
      (calculateComplaintScore as any).mockResolvedValue({
        score: 25,
        tier: 'rejected',
        breakdown: {},
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      (db as any).select = mockSelect;

      await processComplaintSubmission('complaint-1', 'biz-1');

      expect(calculateComplaintScore).toHaveBeenCalled();
      // executeDeactivation should not be called
    });
  });

  describe('processOrderCompletion', () => {
    it('should return early when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const { checkIncompleteOrderDeactivation } = await import('@/lib/incompleteOrderRate');
      (checkIncompleteOrderDeactivation as any).mockResolvedValue({
        shouldDeactivate: true,
        rate: { exceedsThreshold: true },
      });

      await processOrderCompletion('biz-1');

      expect(checkIncompleteOrderDeactivation).not.toHaveBeenCalled();
    });

    it('should check incomplete order rate and deactivate if needed', async () => {
      const { checkIncompleteOrderDeactivation } = await import('@/lib/incompleteOrderRate');
      (checkIncompleteOrderDeactivation as any).mockResolvedValue({
        shouldDeactivate: true,
        rate: { exceedsThreshold: true, incompleteRate: 5000 },
      });

      (db.query.businesses.findFirst as any).mockResolvedValue({
        isActive: true,
        appealStatus: null,
      });
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue(null);
      (db.query.appeals.findFirst as any).mockResolvedValue(null);

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'notice-1' }]),
        }),
      });
      (db as any).insert = mockInsert;

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      await processOrderCompletion('biz-1');

      expect(checkIncompleteOrderDeactivation).toHaveBeenCalledWith('biz-1');
    });
  });

  describe('submitAppeal', () => {
    it('should return error when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await submitAppeal('biz-1', 'notice-1', 'Statement', {
        documents: [],
        arguments: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-deactivation disabled');
    });

    it('should return error when no active notice', async () => {
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue(null);

      const result = await submitAppeal('biz-1', 'notice-1', 'Statement', {
        documents: [],
        arguments: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active deactivation notice found');
    });

    it('should return error when appeal already submitted', async () => {
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue({
        id: 'notice-1',
        gracePeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      (db.query.appeals.findFirst as any).mockResolvedValue({
        id: 'appeal-1',
      });

      const result = await submitAppeal('biz-1', 'notice-1', 'Statement', {
        documents: [],
        arguments: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appeal already submitted');
    });

    it('should return error when grace period expired', async () => {
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue({
        id: 'notice-1',
        gracePeriodEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      (db.query.appeals.findFirst as any).mockResolvedValue(null);

      const result = await submitAppeal('biz-1', 'notice-1', 'Statement', {
        documents: [],
        arguments: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Grace period expired');
    });

    it('should submit appeal successfully', async () => {
      (db.query.deactivationNotices.findFirst as any).mockResolvedValue({
        id: 'notice-1',
        gracePeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        appealDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      (db.query.appeals.findFirst as any).mockResolvedValue(null);

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'appeal-1' }]),
        }),
      });
      (db as any).insert = mockInsert;

      const result = await submitAppeal('biz-1', 'notice-1', 'Statement', {
        documents: [],
        arguments: [],
      });

      expect(result.success).toBe(true);
      expect(result.appealId).toBe('appeal-1');
    });
  });

  describe('reviewAppeal', () => {
    it('should return error when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await reviewAppeal('appeal-1', 'admin-1', 'approved', 'Notes');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-deactivation disabled');
    });

    it('should return error when appeal not found', async () => {
      (db.query.appeals.findFirst as any).mockResolvedValue(null);

      const result = await reviewAppeal('appeal-1', 'admin-1', 'approved', 'Notes');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appeal not found');
    });

    it('should return error when appeal already reviewed', async () => {
      (db.query.appeals.findFirst as any).mockResolvedValue({
        id: 'appeal-1',
        status: 'approved',
      });

      const result = await reviewAppeal('appeal-1', 'admin-1', 'approved', 'Notes');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appeal already reviewed');
    });

    it('should approve appeal and reactivate business', async () => {
      (db.query.appeals.findFirst as any).mockResolvedValue({
        id: 'appeal-1',
        businessId: 'biz-1',
        deactivationNoticeId: 'notice-1',
        status: 'pending',
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      const result = await reviewAppeal('appeal-1', 'admin-1', 'approved', 'Notes');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledTimes(3); // business, notice, appeal
    });

    it('should reject appeal and uphold deactivation', async () => {
      (db.query.appeals.findFirst as any).mockResolvedValue({
        id: 'appeal-1',
        businessId: 'biz-1',
        deactivationNoticeId: 'notice-1',
        status: 'pending',
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      const result = await reviewAppeal('appeal-1', 'admin-1', 'rejected', 'Notes');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('processExpiredGracePeriods', () => {
    it('should return zeros when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await processExpiredGracePeriods();

      expect(result.processed).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should process expired notices', async () => {
      (db.query.deactivationNotices.findMany as any).mockResolvedValue([
        { id: 'notice-1', deactivationNoticeId: 'notice-1' },
        { id: 'notice-2', deactivationNoticeId: 'notice-2' },
      ]);

      // First notice has pending appeal - skip
      (db.query.appeals.findFirst as any)
        .mockResolvedValueOnce({ id: 'appeal-1', status: 'pending' }) // for notice-1
        .mockResolvedValueOnce(null); // for notice-2

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      const result = await processExpiredGracePeriods();

      expect(result.processed).toBe(1); // Only notice-2 processed
      expect(result.errors).toBe(0);
    });
  });

  describe('processAppealSLABreaches', () => {
    it('should return zeros when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';

      const result = await processAppealSLABreaches();

      expect(result.processed).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should mark SLA breached for overdue appeals', async () => {
      // Only return the breached appeal (the function's query filters by date and slaBreached=false)
      (db.query.appeals.findMany as any).mockResolvedValue([
        {
          id: 'appeal-1',
          slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
          slaBreached: false,
        },
      ]);

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db as any).update = mockUpdate;

      const result = await processAppealSLABreaches();

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
    });
  });
});
