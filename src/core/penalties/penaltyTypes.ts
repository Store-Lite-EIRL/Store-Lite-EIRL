// =====================================================
// Seller Penalty System - Shared Types & Constants
// =====================================================

// ── Penalty Types ────────────────────────────────

export const PenaltyType = {
  /** Seller took >5 days to fulfill. Block Culqi, create 5% fine. */
  INCUMPLIMIENTO_PLAZO_PREPARACION: 'INCUMPLIMIENTO_PLAZO_PREPARACION',
  /** Seller abandoned the order for >10 days. Permanent blacklist + 10% fine. */
  ABANDONO_PEDIDO: 'ABANDONO_PEDIDO',
} as const;

export type PenaltyType = (typeof PenaltyType)[keyof typeof PenaltyType];

// ── Penalty Status ──────────────────────────────

export const PenaltyStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;

export type PenaltyStatus = (typeof PenaltyStatus)[keyof typeof PenaltyStatus];

// ── Thresholds (days) ───────────────────────────

/** Max days seller has to prepare the order before Penalty A triggers. */
export const SELLER_TIMEOUT_DAYS = 5;

/** Max cumulative days before Penalty B + permanent blacklist triggers. */
export const ABANDONO_DAYS = 10;

/** Max penalized orders in a rolling 30-day window before auto Culqi block. */
export const PENALTY_COUNT_WINDOW = 3;

/** Rolling window in days for penalty count check. */
export const PENALTY_WINDOW_DAYS = 30;

// ── Fine Percentages ────────────────────────────

/** Penalty A: 5% of product value. Culqi block + fine. */
export const PENALTY_A_PERCENTAGE = 5;

/** Penalty B: 10% of product value. Permanent blacklist + fine. */
export const PENALTY_B_PERCENTAGE = 10;

// ── Fine Metadata ───────────────────────────────

export const PENALTY_A_TITLE = 'Incumplimiento de plazo de preparación';
export const PENALTY_A_DESCRIPTION =
  'No preparaste el pedido a tiempo. Tu cuenta de Cobra con Culqi ha sido bloqueada. Paga la multa para reactivar tus cobros.';

export const PENALTY_B_TITLE = 'Abandono de pedido';
export const PENALTY_B_DESCRIPTION =
  'Has abandonado un pedido por más de 10 días. Tu negocio ha sido cerrado permanentemente y tu RUC ha sido bloqueado.';

// ── PenaltyRecord Interface ─────────────────────

export interface PenaltyRecord {
  id: string;
  businessId: string;
  orderId: string;
  penaltyType: PenaltyType;
  title: string;
  description: string;
  amount: string;
  percentage: string | null;
  productValue: string | null;
  status: PenaltyStatus;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentId: string | null;
  orderNumber: string | null;
  createdAt: string;
  resolvedAt: string | null;
  notes: string | null;
}
