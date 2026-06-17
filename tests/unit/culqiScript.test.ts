import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('loadCulqiScript', () => {
  beforeEach(() => {
    // Clean up any script elements and Culqi from previous tests
    document.querySelectorAll('script').forEach((s) => s.remove());
    delete (window as any).Culqi;
    // Reset module registry so each test gets a fresh module
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up script elements and Culqi
    document.querySelectorAll('script').forEach((s) => s.remove());
    delete (window as any).Culqi;
  });

  test('resolves immediately when window.Culqi already exists', async () => {
    // Arrange: set up window.Culqi before importing
    (window as any).Culqi = { publicKey: '' };

    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    await expect(loadCulqiScript('pk_test_key')).resolves.toBeUndefined();

    // Assert: publicKey was set
    expect((window as any).Culqi.publicKey).toBe('pk_test_key');
  });

  test('creates script element with correct ID and src when Culqi is not loaded', async () => {
    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    // Start loading (don't await yet)
    const promise = loadCulqiScript('pk_test_key');

    // Assert: script element was created
    const script = document.getElementById('culqi-checkout-v4-js') as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script!.src).toContain('https://checkout.culqi.com/js/v4');
    expect(script!.async).toBe(true);

    // Simulate script load
    (window as any).Culqi = { publicKey: '' };
    script!.onload!(new Event('load'));

    await promise;
    expect((window as any).Culqi.publicKey).toBe('pk_test_key');
  });

  test('rejects promise on script load error', async () => {
    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    const promise = loadCulqiScript('pk_test_key');

    const script = document.getElementById('culqi-checkout-v4-js') as HTMLScriptElement | null;
    expect(script).not.toBeNull();

    // Simulate load error
    script!.onerror!(new Event('error'));

    await expect(promise).rejects.toThrow('Failed to load Culqi script');
  });

  test('deduplicates concurrent calls so script is created only once', async () => {
    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    const promise1 = loadCulqiScript('pk_test_key');
    const promise2 = loadCulqiScript('pk_test_key');

    // Simulate script load
    (window as any).Culqi = { publicKey: '' };
    const script = document.getElementById('culqi-checkout-v4-js') as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    script!.onload!(new Event('load'));

    await expect(promise1).resolves.toBeUndefined();
    await expect(promise2).resolves.toBeUndefined();
  });

  test('sets publicKey when called on already-loaded script', async () => {
    // First call loads the script
    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    const promise1 = loadCulqiScript('pk_key_1');
    (window as any).Culqi = { publicKey: '' };
    const script = document.getElementById('culqi-checkout-v4-js') as HTMLScriptElement | null;
    script!.onload!(new Event('load'));
    await promise1;

    // Second call with different key
    await loadCulqiScript('pk_key_2');
    expect((window as any).Culqi.publicKey).toBe('pk_key_2');
  });

  test('resolves each concurrent caller with its own publicKey', async () => {
    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');

    const promiseA = loadCulqiScript('pk_key_A');
    const promiseB = loadCulqiScript('pk_key_B');

    // Simulate script load
    (window as any).Culqi = { publicKey: '' };
    const script = document.getElementById('culqi-checkout-v4-js') as HTMLScriptElement | null;
    script!.onload!(new Event('load'));

    await Promise.all([promiseA, promiseB]);

    // The LAST caller's publicKey wins (Culqi uses latest)
    expect((window as any).Culqi.publicKey).toBe('pk_key_B');
  });

  test('rejects when called outside browser (window is undefined)', async () => {
    // Temporarily remove window
    const originalWindow = (globalThis as any).window;
    delete (globalThis as any).window;

    const { loadCulqiScript } = await import('@/shared/payments/culqiScript');
    await expect(loadCulqiScript('pk_test_key')).rejects.toThrow(
      'loadCulqiScript must be called in a browser context',
    );

    // Restore window
    (globalThis as any).window = originalWindow;
  });
});
