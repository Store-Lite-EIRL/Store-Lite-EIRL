// =====================================================
// Order tracking — Shared types
// =====================================================
// Caller proof used by server actions to verify that
// the caller is the legitimate owner of the order.
//
// GetOrderDetailsResult: sensitive fields returned
// by the getOrderDetails server action after auth.

/**
 * Proof of identity sent from client to server actions.
 * At least one of {dni, authId} must be present.
 */
export interface CallerProof {
  dni?: string;
  authId?: string;
}

/**
 * Sensitive order fields returned only after server-side
 * caller verification. These are NOT included in the SSR
 * page response to avoid data exposure in HTML source.
 */
export interface GetOrderDetailsResult {
  buyerDni: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  amount: string | null;
  currency: string | null;
}
