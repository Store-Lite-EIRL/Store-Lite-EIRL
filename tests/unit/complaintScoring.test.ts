import { describe, expect, it } from 'vitest';

// Test the pure logic functions
import {
  addBusinessDays,
  calculateTierFromScore,
  SCORE_TIERS,
  SCORE_WEIGHTS,
} from '@/lib/complaintScoringCore';

describe('Complaint Scoring - Pure Logic', () => {
  describe('addBusinessDays', () => {
    it('should add business days skipping weekends', () => {
      // Friday + 1 business day = Monday
      const friday = new Date('2024-01-12T10:00:00Z'); // Friday
      const monday = addBusinessDays(friday, 1);
      expect(monday.getDay()).toBe(1); // Monday

      // Monday + 5 business days = next Monday
      const monday2 = new Date('2024-01-15T10:00:00Z');
      const nextMonday = addBusinessDays(monday2, 5);
      expect(nextMonday.getDay()).toBe(1);

      // Wednesday + 3 business days = Monday (skip weekend)
      const wednesday = new Date('2024-01-17T10:00:00Z');
      const nextMon = addBusinessDays(wednesday, 3);
      expect(nextMon.getDay()).toBe(1);
    });

    it('should handle 15 business days for SLA', () => {
      const start = new Date('2024-01-15T10:00:00Z'); // Monday
      const deadline = addBusinessDays(start, 15);
      // 15 business days from Jan 15 = Feb 5 (3 weeks)
      expect(deadline.getTime()).toBe(new Date('2024-02-05T10:00:00Z').getTime());
    });
  });

  describe('Score constants', () => {
    it('should have correct weight values', () => {
      expect(SCORE_WEIGHTS.linkedToOrder).toBe(30);
      expect(SCORE_WEIGHTS.buyerKycVerified).toBe(25);
      expect(SCORE_WEIGHTS.culqiChargeback).toBe(40);
      expect(SCORE_WEIGHTS.slaExpired).toBe(15);
      expect(SCORE_WEIGHTS.patternSimilar).toBe(20);
    });

    it('should have correct tier thresholds', () => {
      expect(SCORE_TIERS.verified).toBe(60);
      expect(SCORE_TIERS.underReview).toBe(30);
      expect(SCORE_TIERS.rejected).toBe(0);
    });
  });

  describe('calculateTierFromScore', () => {
    it('should return rejected for score < 30', () => {
      expect(calculateTierFromScore(0)).toBe('rejected');
      expect(calculateTierFromScore(29)).toBe('rejected');
    });

    it('should return under_review for score 30-59', () => {
      expect(calculateTierFromScore(30)).toBe('under_review');
      expect(calculateTierFromScore(45)).toBe('under_review');
      expect(calculateTierFromScore(59)).toBe('under_review');
    });

    it('should return verified for score >= 60', () => {
      expect(calculateTierFromScore(60)).toBe('verified');
      expect(calculateTierFromScore(75)).toBe('verified');
      expect(calculateTierFromScore(100)).toBe('verified');
    });

    it('should cap at verified for score > 100', () => {
      expect(calculateTierFromScore(150)).toBe('verified');
    });
  });
});

// Integration tests for calculateComplaintScore will be in a separate file
// using a simpler mocking approach with MSW or direct function testing
