'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// posthog.init() runs in instrumentation-client.ts (earlier lifecycle).
// This provider wraps with React context so usePostHog() works in components.
export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
