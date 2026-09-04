// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Free tier: 5M spans/month — 10% sampling in production
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Release tracking from Vercel build
  release: process.env.NEXT_SENTRY_DSN_RELEASE,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  dataCollection: {
    // Disable automatic user data collection — we set context manually
    userInfo: false,
  },
});
