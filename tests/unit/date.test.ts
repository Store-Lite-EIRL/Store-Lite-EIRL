import { describe, expect, it, vi } from 'vitest';
import { formatDateTime, formatRelativeDate } from '../../src/shared/utils/date';

// Helper: create a fixed reference date so tests are time-independent
function referenceDate(): Date {
  return new Date(2026, 6, 13, 10, 0, 0); // July 13, 2026 10:00 AM
}

describe('formatRelativeDate', () => {
  describe('Same day', () => {
    it('returns "Hoy" for the same calendar day', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 13, 8, 30, 0));
      expect(result).toBe('Hoy');

      vi.useRealTimers();
    });
  });

  describe('Yesterday', () => {
    it('returns "Ayer" for 1 calendar day before today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 12, 23, 59, 0));
      expect(result).toBe('Ayer');

      vi.useRealTimers();
    });
  });

  describe('2–6 days ago', () => {
    it('returns "Hace 5 días" for 5 calendar days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 8, 14, 0, 0));
      expect(result).toBe('Hace 5 días');

      vi.useRealTimers();
    });

    it('returns "Hace 2 días" for 2 calendar days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 11, 8, 0, 0));
      expect(result).toBe('Hace 2 días');

      vi.useRealTimers();
    });
  });

  describe('7–29 days ago (weeks)', () => {
    it('returns "Hace 1 semana" for exactly 7 days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 6, 10, 0, 0));
      expect(result).toBe('Hace 1 semana');

      vi.useRealTimers();
    });

    it('returns "Hace 3 semanas" for 21 calendar days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 5, 22, 10, 0, 0));
      expect(result).toBe('Hace 3 semanas');

      vi.useRealTimers();
    });

    it('returns "Hace 2 semanas" for 14 calendar days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 5, 29, 10, 0, 0));
      expect(result).toBe('Hace 2 semanas');

      vi.useRealTimers();
    });
  });

  describe('30+ days ago (absolute date)', () => {
    it('returns zero-padded dd/mm/aaaa for 45 days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 4, 29, 10, 0, 0));
      // May 29, 2026
      expect(result).toBe('29/05/2026');

      vi.useRealTimers();
    });

    it('returns zero-padded dd/mm/aaaa for 60 days ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 4, 14, 10, 0, 0));
      // May 14, 2026
      expect(result).toBe('14/05/2026');

      vi.useRealTimers();
    });
  });

  describe('Future dates', () => {
    it('returns "Hoy" if the future date is the same calendar day', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      // Same day, later time
      const result = formatRelativeDate(new Date(2026, 6, 13, 23, 59, 0));
      expect(result).toBe('Hoy');

      vi.useRealTimers();
    });

    it('returns dd/mm/aaaa for a future date in a different calendar day', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date(2026, 6, 16, 10, 0, 0));
      expect(result).toBe('16/07/2026');

      vi.useRealTimers();
    });
  });

  describe('Invalid date', () => {
    it('returns dd/mm/aaaa for an invalid date string', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      const result = formatRelativeDate(new Date('not-a-date'));
      // Invalid Date → returns fallback placeholder
      expect(result).toBe('00/00/0000');

      vi.useRealTimers();
    });
  });

  describe('String input', () => {
    it('normalizes an ISO string to a Date and returns correct relative output', () => {
      vi.useFakeTimers();
      vi.setSystemTime(referenceDate());

      // July 12, 2026 — yesterday
      const result = formatRelativeDate('2026-07-12T14:00:00Z');
      expect(result).toBe('Ayer');

      vi.useRealTimers();
    });
  });

  describe('Midnight boundary', () => {
    it('returns "Ayer" for 23:59 yesterday when current time is 00:01 today', () => {
      vi.useFakeTimers();
      // Current time: July 14, 2026 00:01
      vi.setSystemTime(new Date(2026, 6, 14, 0, 1, 0));

      // Notification time: July 12, 2026 23:59 — this is 2 calendar days before
      // July 12 = 2 days before July 14
      const result = formatRelativeDate(new Date(2026, 6, 12, 23, 59, 0));
      expect(result).toBe('Hace 2 días');

      // Notification time: July 13, 2026 23:59 — this is yesterday
      const result2 = formatRelativeDate(new Date(2026, 6, 13, 23, 59, 0));
      expect(result2).toBe('Ayer');

      vi.useRealTimers();
    });
  });
});

describe('formatDateTime', () => {
  it('formats a typical date in Spanish format', () => {
    const d = new Date(2026, 6, 14, 15, 30); // Jul 14 2026, 15:30
    expect(formatDateTime(d)).toBe('14 jul 2026, 15:30');
  });

  it('pads single-digit hours and minutes', () => {
    const d = new Date(2026, 0, 5, 3, 5); // Jan 5 2026, 03:05
    expect(formatDateTime(d)).toBe('5 ene 2026, 03:05');
  });

  it('handles end of year', () => {
    const d = new Date(2026, 11, 31, 23, 59);
    expect(formatDateTime(d)).toBe('31 dic 2026, 23:59');
  });

  it('handles midnight', () => {
    const d = new Date(2026, 0, 1, 0, 0);
    expect(formatDateTime(d)).toBe('1 ene 2026, 00:00');
  });

  it('handles string input', () => {
    expect(formatDateTime('2026-07-14T15:30:00')).toBe('14 jul 2026, 15:30');
  });

  it('returns "—" for invalid date', () => {
    expect(formatDateTime(new Date('not-a-date'))).toBe('—');
  });

  it('returns "—" for invalid string input', () => {
    expect(formatDateTime('invalid-date')).toBe('—');
  });
});
