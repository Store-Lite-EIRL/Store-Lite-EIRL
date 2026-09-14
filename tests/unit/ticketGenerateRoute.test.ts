import { POST } from '@/app/api/ticket/generate/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DB
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

const mockProductSelect = vi.fn().mockResolvedValue([]);

vi.mock('@/core/database/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: mockSelect,
          }),
        }),
        where: () => mockProductSelect(),
      }),
    }),
    update: () => ({
      set: () => ({
        where: mockUpdate,
      }),
    }),
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/v1/object/public/tickets/ORD-1.png' },
        }),
      })),
    },
  })),
}));

// Mock ImageResponse
vi.mock('next/og', () => ({
  ImageResponse: class {
    async arrayBuffer() {
      return new ArrayBuffer(8);
    }
  },
}));

describe('POST /api/ticket/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when orderNumber is missing', async () => {
    const req = new Request('http://localhost/api/ticket/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 404 when order is not found in DB', async () => {
    mockSelect.mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/ticket/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'ORD-NONEXISTENT' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns existing ticketUrl if already generated', async () => {
    mockSelect.mockResolvedValueOnce([
      {
        orderNumber: 'ORD-EXISTING',
        ticketUrl: 'https://supabase.co/tickets/ORD-EXISTING.png',
        businessId: 'biz-1',
        businessName: 'Test Store',
      },
    ]);

    const req = new Request('http://localhost/api/ticket/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'ORD-EXISTING' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.publicUrl).toBe('https://supabase.co/tickets/ORD-EXISTING.png');
  });
});
