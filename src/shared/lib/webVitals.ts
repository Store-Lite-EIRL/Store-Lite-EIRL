'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals(): void {
  const handler = (metric: { name: string; value: number; rating: string }): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`);
      return;
    }

    const body = JSON.stringify({
      type: 'web-vital',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/monitoring', body);
    } else {
      fetch('/monitoring', { method: 'POST', body, keepalive: true });
    }
  };

  onCLS(handler);
  onFCP(handler);
  onLCP(handler);
  onTTFB(handler);
  onINP(handler);
}
