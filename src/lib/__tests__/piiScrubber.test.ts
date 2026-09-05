import { describe, expect, it } from 'vitest';

import { scrubPII } from '../piiScrubber';

describe('scrubPII', () => {
  describe('email scrubbing', () => {
    it('redacts email address in a string', () => {
      const result = scrubPII('User email: test@example.com');
      expect(result).toBe('User email: [REDACTED_EMAIL]');
    });

    it('redacts multiple email addresses', () => {
      const result = scrubPII('Contact a@b.com or c@d.org');
      expect(result).toBe('Contact [REDACTED_EMAIL] or [REDACTED_EMAIL]');
    });

    it('handles emails with subdomains', () => {
      const result = scrubPII('mail user@mail.example.co.uk');
      expect(result).toBe('mail [REDACTED_EMAIL]');
    });

    it('handles emails with plus addressing', () => {
      const result = scrubPII('send to user+tag@domain.com');
      expect(result).toBe('send to [REDACTED_EMAIL]');
    });
  });

  describe('phone scrubbing', () => {
    it('redacts international phone number', () => {
      const result = scrubPII('Call +1234567890');
      expect(result).toBe('Call [REDACTED_PHONE]');
    });

    it('redacts phone number with dashes', () => {
      const result = scrubPII('Phone: 123-456-7890');
      expect(result).toBe('Phone: [REDACTED_PHONE]');
    });

    it('redacts phone number with parentheses', () => {
      const result = scrubPII('Call (123) 456-7890');
      expect(result).toBe('Call [REDACTED_PHONE]');
    });

    it('redacts phone with spaces', () => {
      const result = scrubPII('Dial +1 234 567 890');
      expect(result).toBe('Dial [REDACTED_PHONE]');
    });
  });

  describe('object scrubbing', () => {
    it('scrubs PII from object values', () => {
      const data = { message: 'User test@example.com logged in' };
      const result = scrubPII(data);
      expect(result).toEqual({ message: 'User [REDACTED_EMAIL] logged in' });
    });

    it('scrubs PII from nested object values', () => {
      const data = {
        context: {
          email: 'user@company.org',
          action: 'login',
        },
      };
      const result = scrubPII(data);
      expect(result).toEqual({
        context: {
          email: '[REDACTED_EMAIL]',
          action: 'login',
        },
      });
    });

    it('handles mixed PII types in one object', () => {
      const data = {
        msg: 'Contact a@b.com or call +1234567890',
      };
      const result = scrubPII(data);
      expect(result).toEqual({
        msg: 'Contact [REDACTED_EMAIL] or call [REDACTED_PHONE]',
      });
    });
  });

  describe('edge cases', () => {
    it('returns non-string non-object input unchanged', () => {
      expect(scrubPII(42)).toBe(42);
      expect(scrubPII(null)).toBe(null);
      expect(scrubPII(undefined)).toBe(undefined);
    });

    it('returns string with no PII unchanged', () => {
      expect(scrubPII('Hello world')).toBe('Hello world');
    });

    it('returns object with no PII unchanged', () => {
      const data = { action: 'click', count: 5 };
      expect(scrubPII(data)).toEqual(data);
    });

    it('does not treat fake emails without TLD as emails', () => {
      const result = scrubPII('Not an email: @broken');
      expect(result).toBe('Not an email: @broken');
    });
  });
});
