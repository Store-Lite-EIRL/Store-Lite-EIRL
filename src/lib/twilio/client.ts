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

/**
 * Sends OTP via WhatsApp using Twilio (Official Meta WhatsApp Business Cloud API)
 * @param phone - Destination phone number (format: "+51999999999" or "51999999999")
 * @param code - 6-digit OTP code
 * @returns Promise<TwilioMessageResponse>
 */
export async function sendOtpWhatsApp(phone: string, code: string): Promise<TwilioMessageResponse> {
  // Ensure phone has WhatsApp prefix and proper format
  let to = phone.trim();

  // Add '+' if not present (required for international format)
  if (!to.startsWith('+')) {
    to = `+${to}`;
  }

  // Add WhatsApp prefix if not present
  if (!to.startsWith('whatsapp:')) {
    to = `whatsapp:${to}`;
  }

  // From number (Twilio WhatsApp number / Sandbox)
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
