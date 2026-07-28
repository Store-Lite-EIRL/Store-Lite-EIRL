import { describe, expect, it } from 'vitest';

// Privacy policy is a server component — can't render in jsdom.
// We verify metadata and content structure by testing the page module.

describe('Privacidad page (server component)', () => {
  it('exports metadata with correct title and description', async () => {
    // Dynamic import resolves during test so the module is loaded
    const mod = await import('@/app/(main)/privacidad/page');
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toContain('Política de Privacidad');
    expect(mod.metadata.description).toBeTruthy();
  });

  it('renders without error at import time', async () => {
    // Verify the module can be loaded without throwing
    const mod = await import('@/app/(main)/privacidad/page');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('has metadata for search engine crawlers', async () => {
    const mod = await import('@/app/(main)/privacidad/page');
    expect(mod.metadata.title).toContain('Política de Privacidad');
    expect(mod.metadata.description).toContain('privacidad');
    expect(mod.metadata.robots).toBeDefined();
  });
});
