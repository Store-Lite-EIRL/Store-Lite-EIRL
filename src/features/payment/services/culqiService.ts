/**
 * culqiService.ts
 *
 * Client-side utility for Culqi tokenization.
 * Loads CulqiJS dynamically into the page and exposes helpers
 * to tokenize both credit/debit cards and Yape payments.
 *
 * IMPORTANT: This file runs exclusively on the client (browser).
 * The public key (PK) is safe to expose here per Culqi documentation.
 */

import { loadCulqiScript } from '@/shared/payments/culqiScript';

export interface CardTokenPayload {
  card_number: string;
  cvv: string;
  expiration_year: string;
  expiration_month: string;
  email: string;
}

export interface YapeTokenPayload {
  number: string; // Phone number
  otp: string; // 6-digit approval code
  amount: number;
  email: string;
}

export interface CulqiToken {
  id: string;
  type: 'card' | 'yape';
  object?: string;
  [key: string]: unknown;
}

/**
 * Creates a tokenization request for a credit/debit card.
 * Returns the token object from Culqi or throws with an error message.
 */
export async function tokenizeCard(payload: CardTokenPayload): Promise<CulqiToken> {
  const pk = process.env.NEXT_PUBLIC_CULQI_PK;
  await loadCulqiScript(pk || '');
  if (!pk) {
    throw new Error('Culqi public key (NEXT_PUBLIC_CULQI_PK) is not configured.');
  }

  const response = await fetch('https://secure.culqi.com/v2/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pk}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.object === 'error') {
    const message =
      data.user_message ||
      data.merchant_message ||
      data.error?.user_message ||
      'Error al tokenizar la tarjeta.';
    throw new Error(message);
  }

  return data as CulqiToken;
}

/**
 * Creates a tokenization request for Yape.
 */
export async function tokenizeYape(payload: YapeTokenPayload): Promise<CulqiToken> {
  const pk = process.env.NEXT_PUBLIC_CULQI_PK;
  await loadCulqiScript(pk || '');
  if (!pk) {
    throw new Error('Culqi public key (NEXT_PUBLIC_CULQI_PK) is not configured.');
  }

  const response = await fetch('https://secure.culqi.com/v2/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pk}`,
    },
    body: JSON.stringify({
      type: 'yape',
      number_phone: payload.number,
      otp: payload.otp,
      email: payload.email,
      amount: Math.round(payload.amount * 100 || 0), // Culqi v2/tokens/yape often needs amount
    }),
  });

  const data = await response.json();

  if (!response.ok || data.object === 'error') {
    const message =
      data.user_message ||
      data.merchant_message ||
      data.error?.user_message ||
      'Error al tokenizar con Yape.';
    throw new Error(message);
  }

  return { ...data, type: 'yape' } as CulqiToken;
}
