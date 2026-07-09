import { env } from '@/config/env';
import { Resend } from 'resend';

let _client: Resend | null = null;

function getResend(): Resend | null {
  if (!env.resendApiKey) {
    console.warn('[Resend] API key not configured — skipping email');
    return null;
  }
  if (!_client) {
    _client = new Resend(env.resendApiKey);
  }
  return _client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend.
 * Fire-and-forget: logs errors, never throws.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  if (!env.resendFromEmail) {
    console.warn('[Resend] RESEND_FROM_EMAIL not configured — skipping email');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.resendFromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[Resend] API error:', error);
    } else {
      console.log(`[Resend] Email sent to ${params.to}, id: ${data?.id}`);
    }
  } catch (err) {
    console.error('[Resend] Network/HTTP error:', err);
  }
}
