/**
 * PII Scrubber
 *
 * Regex-based removal of emails and phone numbers from
 * log messages and event properties before sending to
 * Sentry or PostHog. NEVER send real PII to observability tools.
 */

/* eslint-disable security/detect-object-injection, security/detect-unsafe-regex, sonarjs/regex-complexity */

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-!#$&'*/=?^`{|}~]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

function scrubString(text: string): string {
  return text.replace(EMAIL_REGEX, '[REDACTED_EMAIL]').replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

function scrubObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = scrubString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Scrub PII from a string or object.
 * - Strings: emails and phones are replaced with [REDACTED_*]
 * - Objects: recursively scrubs all string values
 * - Other types: returned unchanged
 */
export function scrubPII<T>(input: T): T {
  if (typeof input === 'string') return scrubString(input) as T;
  if (typeof input === 'object' && input !== null && !Array.isArray(input))
    return scrubObject(input as Record<string, unknown>) as T;
  return input;
}
