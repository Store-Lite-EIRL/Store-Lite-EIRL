import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks (must be declared before vi.mock calls) ──────────────

const { mockSentryLogger } = vi.hoisted(() => ({
  mockSentryLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@sentry/nextjs', () => ({
  logger: mockSentryLogger,
}));

import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('dual-write', () => {
    it('writes to both Sentry logger and console.info', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('test message', { key: 'value' });

      expect(mockSentryLogger.info).toHaveBeenCalledWith('test message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('writes to both Sentry logger and console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('something broke');

      expect(mockSentryLogger.error).toHaveBeenCalledWith('something broke', undefined);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('level filtering', () => {
    it('drops debug messages in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('should not appear');

      expect(mockSentryLogger.debug).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('allows debug messages in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('dev debug');

      expect(mockSentryLogger.debug).toHaveBeenCalledWith('dev debug', undefined);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('PII scrubbing integration', () => {
    it('scrubs emails from log messages before sending to Sentry', () => {
      logger.info('User email: test@example.com');

      expect(mockSentryLogger.info).toHaveBeenCalledWith('User email: [REDACTED_EMAIL]', undefined);
    });

    it('scrubs emails from metadata before sending to Sentry', () => {
      logger.warn('Login event', { email: 'user@domain.com' });

      expect(mockSentryLogger.warn).toHaveBeenCalledWith('Login event', {
        email: '[REDACTED_EMAIL]',
      });
    });
  });
});
