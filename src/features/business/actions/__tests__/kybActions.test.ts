import { describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          then: vi.fn((cb) => cb([{ count: 0 }])), // For rate limiting check
          limit: vi.fn(() => []), // For old check, just in case
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/lib/twilio/client', () => ({
  sendOtpViaVerify: vi.fn(() => ({ status: 'pending' })),
  checkOtpViaVerify: vi.fn(() => ({ valid: true })),
}));

vi.mock('@/lib/factiliza/client', () => ({
  getRucInfo: vi.fn(),
  getRucRepresentatives: vi.fn(),
}));

const { db } = await import('@/core/database/client');
const mockedDb = vi.mocked(db);
const twilioClient = await import('@/lib/twilio/client');

describe('requestOtpAction', () => {
  it('returns an error if the phone is already registered to an active business', async () => {
    vi.clearAllMocks();

    // Rate limit check passes (select returns count 0)
    vi.mocked(mockedDb.select).mockImplementation(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({
            then: vi.fn((cb) => cb([{ count: 0 }])),
          }),
        }) as any,
    );

    // Mock existing business
    vi.mocked(mockedDb.query.businesses.findFirst).mockResolvedValue({
      id: 'existing-business-id',
    } as any);

    const formData = new FormData();
    formData.append('identifier', '999888777');
    formData.append('type', 'phone');
    formData.append('countryPrefix', '+51');

    const { requestOtpAction } = await import('../kybActions');
    const result = await requestOtpAction(formData);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toMatch(/registrado en un negocio activo/i);

    // Should NOT insert OTP tracking record or send SMS
    expect(mockedDb.insert).not.toHaveBeenCalled();
    expect(twilioClient.sendOtpViaVerify).not.toHaveBeenCalled();
  });

  it('proceeds normally if the phone is free', async () => {
    vi.clearAllMocks();

    // Rate limit check passes
    vi.mocked(mockedDb.select).mockImplementation(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({
            then: vi.fn((cb) => cb([{ count: 0 }])),
          }),
        }) as any,
    );

    // Mock NO existing business
    vi.mocked(mockedDb.query.businesses.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append('identifier', '999888777');
    formData.append('type', 'phone');
    formData.append('countryPrefix', '+51');

    const { requestOtpAction } = await import('../kybActions');
    const result = await requestOtpAction(formData);

    expect(result).toEqual({ success: true, message: 'Código OTP enviado via WhatsApp' });

    // Should insert OTP tracking record and send SMS
    expect(mockedDb.insert).toHaveBeenCalled();
    expect(twilioClient.sendOtpViaVerify).toHaveBeenCalledWith('+51999888777');
  });
});
