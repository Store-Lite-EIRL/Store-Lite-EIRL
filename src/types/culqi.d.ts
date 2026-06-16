// Culqi v4 API declarations
// This file augments the global Window interface with Culqi types.

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
  // Dynamic fields from Culqi API response
  [key: string]: any;
}

interface CulqiOrderResult {
  id: string;
  status: string;
  amount?: number;
  // Dynamic fields from Culqi API response
  [key: string]: any;
}

interface CulqiError {
  user_message?: string;
  merchant_message?: string;
  // Dynamic fields from Culqi API response
  [key: string]: any;
}

interface CulqiObject {
  token: string;
  error?: string;
}

interface Window {
  Culqi: Culqi | undefined;
  CulqiObject: CulqiObject | undefined;
  culqi: () => void;
}
