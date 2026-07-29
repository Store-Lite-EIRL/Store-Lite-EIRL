import { describe, expect, it } from 'vitest';

describe('Terminos page (server component)', () => {
  it('exports metadata with correct title and description', async () => {
    const mod = await import('@/app/(main)/terminos/page');
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toContain('Términos de Servicio');
    expect(mod.metadata.description).toBeTruthy();
  });

  it('renders without error at import time', async () => {
    const mod = await import('@/app/(main)/terminos/page');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('has metadata for search engine crawlers', async () => {
    const mod = await import('@/app/(main)/terminos/page');
    expect(mod.metadata.title).toContain('Términos');
    expect(mod.metadata.description.toLowerCase()).toContain('términos');
    expect(mod.metadata.robots).toBeDefined();
  });
});
