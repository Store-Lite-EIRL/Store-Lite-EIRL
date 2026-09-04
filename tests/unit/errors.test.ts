import { getErrorMessage } from '@/utils/errors';
import { describe, expect, it } from 'vitest';

describe('getErrorMessage', () => {
  const FALLBACK = 'fallback message';

  it('returns message from Error instance', () => {
    expect(getErrorMessage(new Error('something broke'), FALLBACK)).toBe('something broke');
  });

  it('returns plain string value', () => {
    expect(getErrorMessage('raw string error', FALLBACK)).toBe('raw string error');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it('returns message from object with string .message property', () => {
    expect(getErrorMessage({ message: 'obj msg' }, FALLBACK)).toBe('obj msg');
  });

  it('returns fallback for Error with empty message', () => {
    expect(getErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback for object with non-string .message', () => {
    expect(getErrorMessage({ message: 42 }, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback for object without .message', () => {
    expect(getErrorMessage({ code: 500 }, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback for numeric value', () => {
    expect(getErrorMessage(42, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback for boolean value', () => {
    expect(getErrorMessage(true, FALLBACK)).toBe(FALLBACK);
  });
});
