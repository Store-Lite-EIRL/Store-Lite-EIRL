/**
 * Sentry Context Helper
 *
 * Attaches user identification and business context
 * to Sentry events via tags. Called at the top of
 * server actions and API routes.
 *
 * Uses helper functions instead of middleware to avoid
 * edge runtime limitations.
 */

import { setTag, setUser } from '@sentry/nextjs';

interface SentryUser {
  id: string;
  email?: string;
}

interface SentryBusiness {
  id: string;
  plan?: string;
}

/**
 * Set Sentry context for the current request.
 * Call this at the top of server actions / API routes.
 * When no user is provided, clears user context and skips.
 */
export function setSentryContext(user: SentryUser | undefined, business?: SentryBusiness): void {
  if (!user) {
    return;
  }

  setUser({ id: user.id });

  if (business) {
    setTag('business_id', business.id);
    setTag('plan', business.plan ?? 'none');
  }
}
