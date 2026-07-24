// Culqi v4 API declarations
// This file augments the global Window interface with Culqi types.

interface CulqiOrderAction {
  qr?: {
    image_url: string;
  };
}

interface Culqi {
  publicKey?: string;
  settings: (options: Record<string, unknown>) => void;
  options: (options: CulqiOptions) => void;
  open: () => void;
  close: () => void;
  // Dynamic properties set by the Culqi script after tokenization
  token?: CulqiTokenResult;
  order?: CulqiOrderResult;
  error?: CulqiError;
}

interface CulqiOptions {
  lang?: string;
  modal?: boolean;
  installments?: boolean;
  style?: Record<string, string>;
  paymentMethods?: Record<string, boolean>;
  [key: string]: unknown;
}

interface CulqiTokenResult {
  id: string;
  type?: string;
  object?: string;
  card_number?: string;
  last_four?: string;
  iin?: {
    object: string;
    bin: string;
    card_category: string;
    card_type: string;
    card_brand: string;
    issuer: {
      name: string;
      country: string;
      country_code: string;
    };
  };
  [key: string]: unknown;
}

export interface CulqiOrderResult {
  id: string;
  status: string;
  amount?: number;
  cip_code?: string;
  expiration_date?: number;
  payment_method?: string;
  action?: CulqiOrderAction;
  [key: string]: unknown;
}

interface CulqiError {
  user_message?: string;
  merchant_message?: string;
  code?: string;
  param?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Response from POST /api/payment/charge
 * Matches the Culqi charge API response shape.
 */
export interface CulqiChargeResponse {
  object: string;
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  paid?: boolean;
  user_message?: string;
  merchant_message?: string;
  outcome?: {
    type: string;
    user_message: string;
    merchant_message: string;
  };
  description?: string;
  reference_code?: string;
  metadata?: Record<string, unknown>;
  creation_date?: number;
  status: string;
}

declare global {
  interface Window {
    Culqi: Culqi | undefined;
    culqi: () => void;
  }
}
