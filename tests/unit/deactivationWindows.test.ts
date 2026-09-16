// =====================================================
// computeDeactivationWindows — DS 011-2011-PCM windows
// =====================================================
// Verifies the deactivation timeline used at soft-deactivation:
//  - gracePeriodEndsAt: 72 hours (CALENDAR) from `now`
//  - appealDeadline: 10 BUSINESS days from `now` (weekends skipped)
// This is the legal contract from DS 011-2011-PCM ("10 días hábiles").
// =====================================================

import { describe, expect, it } from 'vitest';

import {
  APPEAL_BUSINESS_DAYS,
  GRACE_PERIOD_HOURS,
  addBusinessDays,
  computeDeactivationWindows,
} from '@/lib/complaintScoringCore';

describe('computeDeactivationWindows', () => {
  it('keeps the 72-hour CALENDAR grace period', () => {
    const now = new Date('2026-09-15T12:00:00.000Z'); // Tuesday

    const { gracePeriodEndsAt } = computeDeactivationWindows(now);

    expect(GRACE_PERIOD_HOURS).toBe(72);
    expect(gracePeriodEndsAt.getTime()).toBe(
      new Date('2026-09-18T12:00:00.000Z').getTime(), // exactly +72h
    );
  });

  it('computes the appeal deadline as 10 BUSINESS days from a Monday start', () => {
    // Monday 2026-09-14 -> 10 business days = exactly 2 weeks = Monday 2026-09-28
    const monday = new Date('2026-09-14T12:00:00.000Z');

    const { appealDeadline } = computeDeactivationWindows(monday);

    expect(APPEAL_BUSINESS_DAYS).toBe(10);
    expect(appealDeadline.getTime()).toBe(
      new Date('2026-09-28T12:00:00.000Z').getTime(), // 14 calendar days later
    );
    expect(appealDeadline.getDay()).toBe(1); // Monday
  });

  it('skips weekends: 10 business days from a Friday lands on a Friday 2 weeks later', () => {
    // Friday 2026-09-18 -> 10 business days = Friday 2026-10-02 (13 calendar days)
    const friday = new Date('2026-09-18T12:00:00.000Z');

    const { appealDeadline } = computeDeactivationWindows(friday);

    expect(appealDeadline.getTime()).toBe(new Date('2026-10-02T12:00:00.000Z').getTime());
    expect(appealDeadline.getDay()).toBe(5); // Friday
  });

  it('treats a weekend start as the following Monday (no business-day credit)', () => {
    // Saturday 2026-09-19 -> first business day is Monday 2026-09-21 -> Friday 2026-10-02
    const saturday = new Date('2026-09-19T12:00:00.000Z');

    const { appealDeadline } = computeDeactivationWindows(saturday);

    expect(appealDeadline.getTime()).toBe(new Date('2026-10-02T12:00:00.000Z').getTime());
  });

  it('matches addBusinessDays(now, 10) — the canonical business-day implementation', () => {
    const now = new Date('2026-09-15T12:00:00.000Z'); // Tuesday

    const { appealDeadline } = computeDeactivationWindows(now);

    expect(appealDeadline.getTime()).toBe(addBusinessDays(now, 10).getTime());
  });
});
