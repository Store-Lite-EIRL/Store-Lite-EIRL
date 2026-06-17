import { describe, expect, test, vi, beforeEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}));

// Mock Supabase client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

describe('generateAndUploadTicket', () => {
  beforeEach(() => {
    vi.resetModules();
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
  });

  test('exists as a named export', async () => {
    const mod = await import('@/shared/payments/ticketGenerator');
    expect(mod.generateAndUploadTicket).toBeDefined();
    expect(typeof mod.generateAndUploadTicket).toBe('function');
  });

  test('throws when ref current is null', async () => {
    const { generateAndUploadTicket } = await import('@/shared/payments/ticketGenerator');
    const ref = { current: null };

    await expect(
      generateAndUploadTicket(ref, 'ORD-123', {
        bucket: 'tickets',
        updateUrl: '/api/payment/update-ticket',
      }),
    ).rejects.toThrow('No se pudo generar el ticket');
  });

  test('throws when toPng fails (returns undefined)', async () => {
    const { toPng } = await import('html-to-image');
    vi.mocked(toPng).mockRejectedValueOnce(new Error('html-to-image error'));

    const { generateAndUploadTicket } = await import('@/shared/payments/ticketGenerator');
    const ref = { current: document.createElement('div') };

    await expect(
      generateAndUploadTicket(ref, 'ORD-123', {
        bucket: 'tickets',
        updateUrl: '/api/payment/update-ticket',
      }),
    ).rejects.toThrow('html-to-image error');
  });

  test('uploads to correct bucket and calls updateUrl endpoint', async () => {
    // Mock toPng to return a data URL
    const { toPng } = await import('html-to-image');
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');

    // Mock Supabase upload success
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/v1/object/public/tickets/ORD-123.png' },
    });

    // Mock fetch for both data URL fetch and updateUrl API call
    // First call: dataUrl → blob conversion (returns a blob)
    const blob = new Blob(['fake-png-data'], { type: 'image/png' });
    // Second call: updateUrl API
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ blob: () => Promise.resolve(blob), ok: true })
      .mockResolvedValueOnce({ ok: true });
    globalThis.fetch = mockFetch;

    const { generateAndUploadTicket } = await import('@/shared/payments/ticketGenerator');
    const ref = { current: document.createElement('div') };

    const result = await generateAndUploadTicket(ref, 'ORD-123', {
      bucket: 'tickets',
      updateUrl: '/api/payment/update-ticket',
    });

    // Verify toPng was called with the ref
    expect(toPng).toHaveBeenCalledWith(ref.current, expect.objectContaining({
      cacheBust: true,
      backgroundColor: '#ffffff',
    }));

    // Verify upload was called
    expect(mockUpload).toHaveBeenCalledWith(
      'ORD-123.png',
      expect.any(Blob),
      { contentType: 'image/png', upsert: true },
    );

    // Verify updateUrl was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/payment/update-ticket',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-123',
          ticketUrl: 'https://supabase.co/storage/v1/object/public/tickets/ORD-123.png',
        }),
      }),
    );

    expect(result).toEqual({
      publicUrl: 'https://supabase.co/storage/v1/object/public/tickets/ORD-123.png',
    });
  });
});
