import { env } from '@/config/env';
import twilio from 'twilio';

// Twilio client instance (initialized server-side only)
const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TWILIO VERIFY (recomendado para producción)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends OTP via WhatsApp using Twilio Verify
 * Verify handles template approval, expiration, and delivery automatically.
 *
 * @param phone - Phone in E.164 format: "+51999999999"
 * @returns Verification SID and status
 */
export async function sendOtpViaVerify(phone: string): Promise<{ sid: string; status: string }> {
  const service = client.verify.v2.services(env.twilioServiceSid);

  const verification = await service.verifications.create({
    to: phone,
    channel: 'whatsapp',
  });

  console.log(
    `[Twilio Verify] OTP sent to ${phone}. SID: ${verification.sid}, Status: ${verification.status}`,
  );

  return { sid: verification.sid, status: verification.status };
}

/**
 * Checks an OTP code using Twilio Verify
 *
 * @param phone - Phone in E.164 format
 * @param code - 6-digit code entered by the user
 * @returns Object with valid flag and verification SID
 */
export async function checkOtpViaVerify(
  phone: string,
  code: string,
): Promise<{ valid: boolean; sid?: string }> {
  const service = client.verify.v2.services(env.twilioServiceSid);

  const check = await service.verificationChecks.create({
    to: phone,
    code,
  });

  console.log(`[Twilio Verify] Check for ${phone}. Status: ${check.status}, SID: ${check.sid}`);

  return { valid: check.status === 'approved', sid: check.sid };
}

// ─────────────────────────────────────────────────────────────────────────────
// TWILIO MESSAGES API (legacy — usar Verify para producción)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends OTP via WhatsApp using Twilio Messages API
 * @deprecated Usar sendOtpViaVerify en su lugar. Esta función requiere
 *             templates aprobados por Meta para producción.
 */
export async function sendOtpWhatsApp(phone: string, code: string): Promise<TwilioMessageResponse> {
  let to = phone.trim();

  if (!to.startsWith('+')) {
    to = `+${to}`;
  }

  if (!to.startsWith('whatsapp:')) {
    to = `whatsapp:${to}`;
  }

  const from = env.twilioWhatsAppNumber;

  console.log(`[Twilio] Sending OTP via WhatsApp to ${to} from ${from}`);

  try {
    const message = await client.messages.create({
      body: `🛍️ *Store Lite* - Tu código de verificación es: *${code}*\nVálido por 5 minutos. No compartas este código con nadie.`,
      from,
      to,
    });

    console.log(`[Twilio] OTP sent successfully. SID: ${message.sid}, Status: ${message.status}`);

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      body: message.body,
    };
  } catch (error: unknown) {
    console.error(`[Twilio] Error sending OTP:`, error);
    throw new Error(
      `Twilio error: ${error instanceof Error ? error.message : 'Failed to send OTP'}`,
    );
  }
}
