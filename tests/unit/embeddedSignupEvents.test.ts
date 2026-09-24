// =====================================================
// embeddedSignupEvents — WA_EMBEDDED_SIGNUP postMessage parser
// =====================================================
// Covers the Meta Embedded Signup event protocol:
//   window.postMessage({ type: 'WA_EMBEDDED_SIGNUP', data: { type, data } })
// Only messages from allowlisted origins are accepted; FINISH extracts the
// snake_case ids, ERROR surfaces the message, cancel is a no-payload event.

import {
  ALLOWED_EMBEDDED_SIGNUP_ORIGINS,
  parseEmbeddedSignupEvent,
} from '@/features/whatsapp/lib/embeddedSignupEvents';
import { describe, expect, it } from 'vitest';

const ALLOWED_ORIGIN = 'https://www.facebook.com';
const EVIL_ORIGIN = 'https://evil.example.com';

/** Build a MessageEvent-shaped object without needing a real DOM event. */
function message(origin: string, data: unknown): MessageEvent {
  return { origin, data } as MessageEvent;
}

function embeddedSignup(subtype: string, inner: unknown): unknown {
  return { type: 'WA_EMBEDDED_SIGNUP', data: { type: subtype, data: inner } };
}

const FINISH_INNER = {
  business_id: 'biz-1001',
  waba_id: 'waba-2002',
  phone_number_id: 'pn-3003',
};

describe('parseEmbeddedSignupEvent', () => {
  it('parses a FINISH event from an allowlisted origin into typed ids', () => {
    const result = parseEmbeddedSignupEvent(
      message(ALLOWED_ORIGIN, embeddedSignup('FINISH', FINISH_INNER)),
    );

    expect(result).toEqual({
      kind: 'finish',
      payload: { businessId: 'biz-1001', wabaId: 'waba-2002', phoneNumberId: 'pn-3003' },
    });
  });

  it('parses FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING as a finish event', () => {
    const result = parseEmbeddedSignupEvent(
      message(
        ALLOWED_ORIGIN,
        embeddedSignup('FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', FINISH_INNER),
      ),
    );

    expect(result).toEqual({
      kind: 'finish',
      payload: { businessId: 'biz-1001', wabaId: 'waba-2002', phoneNumberId: 'pn-3003' },
    });
  });

  it('rejects FINISH events from non-allowlisted origins', () => {
    const result = parseEmbeddedSignupEvent(
      message(EVIL_ORIGIN, embeddedSignup('FINISH', FINISH_INNER)),
    );

    expect(result).toBeNull();
  });

  it('rejects a FINISH missing required ids instead of emitting garbage', () => {
    const result = parseEmbeddedSignupEvent(
      message(ALLOWED_ORIGIN, embeddedSignup('FINISH', { business_id: 'biz-1001' })),
    );

    expect(result).toBeNull();
  });

  it('surfaces an ERROR event with its message', () => {
    const result = parseEmbeddedSignupEvent(
      message(
        ALLOWED_ORIGIN,
        embeddedSignup('ERROR', { error: { code: 2635, message: 'WABA no encontrado' } }),
      ),
    );

    expect(result).toEqual({ kind: 'error', message: 'WABA no encontrado' });
  });

  it('surfaces an ERROR event without a message as a null message', () => {
    const result = parseEmbeddedSignupEvent(message(ALLOWED_ORIGIN, embeddedSignup('ERROR', null)));

    expect(result).toEqual({ kind: 'error', message: null });
  });

  it('parses a cancel event as a no-payload cancel', () => {
    const result = parseEmbeddedSignupEvent(
      message(ALLOWED_ORIGIN, embeddedSignup('cancel', null)),
    );

    expect(result).toEqual({ kind: 'cancel' });
  });

  it('ignores messages that are not WA_EMBEDDED_SIGNUP', () => {
    const result = parseEmbeddedSignupEvent(
      message(ALLOWED_ORIGIN, {
        type: 'AUTH_SUCCESS',
        data: { type: 'FINISH', data: FINISH_INNER },
      }),
    );

    expect(result).toBeNull();
  });

  it('ignores unknown WA_EMBEDDED_SIGNUP subtypes', () => {
    const result = parseEmbeddedSignupEvent(message(ALLOWED_ORIGIN, embeddedSignup('start', null)));

    expect(result).toBeNull();
  });

  it('exposes the facebook.com allowlist as a configurable constant', () => {
    expect(ALLOWED_EMBEDDED_SIGNUP_ORIGINS).toContain('https://www.facebook.com');
  });
});
