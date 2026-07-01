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
 * Sends a plain SMS via Twilio to a customer phone.
 * Used for order status notifications (Peru +51 numbers only).
 *
 * @param phone - Destination phone (format: "+51999999999" or "51999999999")
 * @param message - SMS body text
 * @returns Promise<TwilioMessageResponse>
 */
export async function sendSmsToCustomer(
  phone: string,
  message: string,
): Promise<TwilioMessageResponse> {
  let to = phone.trim();
  if (!to.startsWith('+')) {
    to = `+${to}`;
  }

  const from = env.twilioSmsCustomerNumber;

  console.log(`[Twilio] Sending SMS to customer ${to} via ${from}`);

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    console.log(`[Twilio] SMS sent successfully. SID: ${result.sid}, Status: ${result.status}`);

    return {
      sid: result.sid,
      status: result.status,
      to: result.to,
      body: result.body,
    };
  } catch (error: unknown) {
    console.error(`[Twilio] Error sending SMS:`, error);
    throw new Error(
      `Twilio SMS error: ${error instanceof Error ? error.message : 'Failed to send SMS'}`,
    );
  }
}

/**
 * Sends a plain SMS via Twilio to a business/seller phone.
 * Used for administrative notifications (debt, alerts, etc.).
 *
 * @param phone - Destination phone (format: "+51999999999" or "51999999999")
 * @param message - SMS body text
 * @returns Promise<TwilioMessageResponse>
 */
export async function sendSmsToBusiness(
  phone: string,
  message: string,
): Promise<TwilioMessageResponse> {
  let to = phone.trim();
  if (!to.startsWith('+')) {
    to = `+${to}`;
  }

  const from = env.twilioSmsBusinessNumber;

  console.log(`[Twilio] Sending SMS to business ${to} via ${from}`);

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    console.log(`[Twilio] SMS sent successfully. SID: ${result.sid}, Status: ${result.status}`);

    return {
      sid: result.sid,
      status: result.status,
      to: result.to,
      body: result.body,
    };
  } catch (error: unknown) {
    console.error(`[Twilio] Error sending SMS:`, error);
    throw new Error(
      `Twilio SMS error: ${error instanceof Error ? error.message : 'Failed to send SMS'}`,
    );
  }
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
