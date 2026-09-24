// =====================================================
// embeddedSignupEvents.ts
//
// Typed parser for Meta's WhatsApp Embedded Signup postMessage protocol.
// The coexistence popup posts messages shaped like:
//
//   {
//     type: 'WA_EMBEDDED_SIGNUP',
//     data: {
//       type: 'FINISH' | 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' | 'ERROR' | 'cancel',
//       data: {
//         business_id?, waba_id?, phone_number_id?,          // on FINISH
//         error?: { message? }                                // on ERROR
//       }
//     }
//   }
//
// Only messages from allowlisted origins are accepted (the dashboard must
// never act on postMessage forged by another origin).
// =====================================================

/** Origins allowed to deliver WA_EMBEDDED_SIGNUP events. Configurable const. */
export const ALLOWED_EMBEDDED_SIGNUP_ORIGINS: readonly string[] = ['https://www.facebook.com'];

/** The postMessage envelope type Facebook's Embedded Signup popup emits. */
const EMBEDDED_SIGNUP_EVENT_TYPE = 'WA_EMBEDDED_SIGNUP';

/** Success subtypes — both mean the seller completed the QR/scan flow. */
const FINISH_SUBTYPES: readonly string[] = ['FINISH', 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'];

/** Payload extracted from a FINISH event (snake_case ids from Meta). */
export interface EmbeddedSignupFinishPayload {
  businessId: string;
  wabaId: string;
  phoneNumberId: string;
}

/** Typed result of parsing a WA_EMBEDDED_SIGNUP message. */
export type EmbeddedSignupEvent =
  | { kind: 'finish'; payload: EmbeddedSignupFinishPayload }
  | { kind: 'error'; message: string | null }
  | { kind: 'cancel' };

interface EmbeddedSignupEnvelope {
  type?: unknown;
  data?: {
    type?: unknown;
    data?: {
      business_id?: unknown;
      waba_id?: unknown;
      phone_number_id?: unknown;
      error?: { message?: unknown };
    };
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Parses a raw MessageEvent into a typed EmbeddedSignupEvent, or null when the
 * message is irrelevant (wrong origin, wrong envelope, unknown subtype, or a
 * malformed FINISH payload).
 */
export function parseEmbeddedSignupEvent(event: MessageEvent): EmbeddedSignupEvent | null {
  if (!ALLOWED_EMBEDDED_SIGNUP_ORIGINS.includes(event.origin)) return null;

  const envelope = event.data as EmbeddedSignupEnvelope | null;
  if (!envelope || envelope.type !== EMBEDDED_SIGNUP_EVENT_TYPE) return null;
  if (!isRecord(envelope.data) || typeof envelope.data.type !== 'string') return null;

  const subtype = envelope.data.type;
  const inner = envelope.data.data;

  if (FINISH_SUBTYPES.includes(subtype)) {
    const businessId = inner?.business_id;
    const wabaId = inner?.waba_id;
    const phoneNumberId = inner?.phone_number_id;
    if (
      typeof businessId !== 'string' ||
      typeof wabaId !== 'string' ||
      typeof phoneNumberId !== 'string'
    ) {
      return null;
    }
    return { kind: 'finish', payload: { businessId, wabaId, phoneNumberId } };
  }

  if (subtype === 'ERROR') {
    const message = inner?.error?.message;
    return { kind: 'error', message: typeof message === 'string' ? message : null };
  }

  if (subtype === 'cancel') {
    return { kind: 'cancel' };
  }

  return null;
}
