'use client';

import { reportWebVitals } from '@/shared/lib/webVitals';
import { useEffect } from 'react';

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return null;
}
