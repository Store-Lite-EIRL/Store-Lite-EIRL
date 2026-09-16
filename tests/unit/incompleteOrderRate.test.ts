import { describe, expect, it } from 'vitest';

import {
  calculateIncompleteRate,
  COMPLETE_ORDER_STATUSES,
  exceedsIncompleteOrderThreshold,
  get30DayWindowStart,
  INCOMPLETE_ORDER_STATUSES,
  INCOMPLETE_ORDER_THRESHOLD,
  isCompleteOrderStatus,
  isIncompleteOrderStatus,
} from '@/lib/incompleteOrderRateCore';

describe('Incomplete Order Rate - Pure Logic', () => {
  describe('calculateIncompleteRate', () => {
    it('should return 0% for zero orders', () => {
      const result = calculateIncompleteRate(0, 0);
      expect(result.totalOrders).toBe(0);
      expect(result.incompleteOrders).toBe(0);
      expect(result.incompleteRate).toBe(0);
      expect(result.exceedsThreshold).toBe(false);
    });

    it('should calculate correct rate for all incomplete orders', () => {
      const result = calculateIncompleteRate(10, 10);
      expect(result.incompleteRate).toBe(10000); // 100%
      expect(result.exceedsThreshold).toBe(true);
    });

    it('should calculate correct rate for no incomplete orders', () => {
      const result = calculateIncompleteRate(10, 0);
      expect(result.incompleteRate).toBe(0); // 0%
      expect(result.exceedsThreshold).toBe(false);
    });

    it('should calculate correct rate for 50% incomplete', () => {
      const result = calculateIncompleteRate(10, 5);
      expect(result.incompleteRate).toBe(5000); // 50%
      expect(result.exceedsThreshold).toBe(true);
    });

    it('should calculate correct rate for 40% incomplete (threshold boundary)', () => {
      const result = calculateIncompleteRate(10, 4);
      expect(result.incompleteRate).toBe(4000); // 40%
      expect(result.exceedsThreshold).toBe(false); // Not > 40%
    });

    it('should calculate correct rate for 41% incomplete (exceeds threshold)', () => {
      const result = calculateIncompleteRate(100, 41);
      expect(result.incompleteRate).toBe(4100); // 41%
      expect(result.exceedsThreshold).toBe(true);
    });

    it('should handle fractional percentages correctly', () => {
      const result = calculateIncompleteRate(3, 1); // 33.33%
      expect(result.incompleteRate).toBe(3333); // Rounded
      expect(result.exceedsThreshold).toBe(false);
    });

    it('should handle large numbers', () => {
      const result = calculateIncompleteRate(1000, 450); // 45%
      expect(result.incompleteRate).toBe(4500);
      expect(result.exceedsThreshold).toBe(true);
    });
  });

  describe('exceedsIncompleteOrderThreshold', () => {
    it('should return false for rate at threshold', () => {
      expect(exceedsIncompleteOrderThreshold(4000)).toBe(false);
    });

    it('should return true for rate above threshold', () => {
      expect(exceedsIncompleteOrderThreshold(4001)).toBe(true);
      expect(exceedsIncompleteOrderThreshold(5000)).toBe(true);
    });

    it('should return false for rate below threshold', () => {
      expect(exceedsIncompleteOrderThreshold(3999)).toBe(false);
      expect(exceedsIncompleteOrderThreshold(0)).toBe(false);
    });
  });

  describe('get30DayWindowStart', () => {
    it('should return date 30 days ago', () => {
      const now = Date.now();
      const windowStart = get30DayWindowStart();
      const diffDays = (now - windowStart.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(30, 1); // Within 0.1 days
    });
  });

  describe('Status constants', () => {
    it('should have correct incomplete statuses', () => {
      expect(INCOMPLETE_ORDER_STATUSES).toContain('pending');
      expect(INCOMPLETE_ORDER_STATUSES).toContain('paid');
      expect(INCOMPLETE_ORDER_STATUSES).toContain('disputed');
      expect(INCOMPLETE_ORDER_STATUSES).toContain('cancelled');
      expect(INCOMPLETE_ORDER_STATUSES).not.toContain('completed');
    });

    it('should have correct complete statuses', () => {
      expect(COMPLETE_ORDER_STATUSES).toContain('completed');
      expect(COMPLETE_ORDER_STATUSES).not.toContain('pending');
    });
  });

  describe('isIncompleteOrderStatus', () => {
    it('should return true for incomplete statuses', () => {
      expect(isIncompleteOrderStatus('pending')).toBe(true);
      expect(isIncompleteOrderStatus('paid')).toBe(true);
      expect(isIncompleteOrderStatus('disputed')).toBe(true);
      expect(isIncompleteOrderStatus('cancelled')).toBe(true);
    });

    it('should return false for complete statuses', () => {
      expect(isIncompleteOrderStatus('completed')).toBe(false);
    });

    it('should return false for unknown statuses', () => {
      expect(isIncompleteOrderStatus('unknown')).toBe(false);
    });
  });

  describe('isCompleteOrderStatus', () => {
    it('should return true for completed', () => {
      expect(isCompleteOrderStatus('completed')).toBe(true);
    });

    it('should return false for incomplete statuses', () => {
      expect(isCompleteOrderStatus('pending')).toBe(false);
      expect(isCompleteOrderStatus('disputed')).toBe(false);
    });
  });

  describe('Threshold constant', () => {
    it('should be 40%', () => {
      expect(INCOMPLETE_ORDER_THRESHOLD).toBe(40);
    });
  });
});
