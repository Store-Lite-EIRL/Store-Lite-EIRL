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

// Extend Window to include the Culqi global
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CulqiObject: any;
  }
}

const CULQI_SCRIPT_URL = 'https://checkout.culqi.com/js/v4';

/**
 * Injects the Culqi v4 JS script into the document once.
 * Safe to call multiple times — it will only inject the script once.
 */
export function loadCulqiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('loadCulqiScript must be called in a browser context'));
      return;
    }

    // Already loaded
    if (window.Culqi) {
      resolve();
      return;
    }

    // Already injected but not loaded yet — wait for it
    const existing = document.getElementById('culqi-js-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Culqi script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'culqi-js-script';
    script.src = CULQI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Culqi script'));
    document.head.appendChild(script);
  });
}

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
}

export interface CulqiToken {
  id: string;
  type: 'card' | 'yape';
  object?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Creates a tokenization request for a credit/debit card.
 * Returns the token object from Culqi or throws with an error message.
 */
export async function tokenizeCard(payload: CardTokenPayload): Promise<CulqiToken> {
  await loadCulqiScript();

  const pk = process.env.NEXT_PUBLIC_CULQI_PK;
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
  await loadCulqiScript();

  const pk = process.env.NEXT_PUBLIC_CULQI_PK;
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
      amount: Math.round((payload as any).amount * 100 || 0), // Culqi v2/tokens/yape often needs amount
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
