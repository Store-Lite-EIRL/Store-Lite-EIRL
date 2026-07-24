// ──────────────────────────────────────────
// Shared Order Types & URBANO_STATUS_MAP
// Single source of truth — components
// destructure only fields they need.
// ──────────────────────────────────────────

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Search,
  Store,
  Truck,
} from 'lucide-react';
import type { ComponentType } from 'react';

// ── OrderItem ─────────────────────────────
export interface OrderItem {
  id: string;
  orderNumber: string | null;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string | null;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: string;
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  shippingDepartment: string | null;
  shippingType: string | null;
  shippingAgency: string | null;
  shippingReference: string | null;
  shippingPhone: string | null;
  buyerEmail: string | null;
  maskedDni: string;
  trackingToken?: string | null;
  ticketImageUrl: string | null;
  finalizationDeadline: string | null;
  completedAt: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  pickupCode?: string | null;
  sellerNote?: string | null;
  metadata: any;
  createdAt: string;
  businessId: string;
}

// ── UrbanoStatusInfo ──────────────────────
export interface UrbanoStatusInfo {
  label: string;
  className: string;
  progress: number;
  icon: string;
  lucideIcon: ComponentType<any>;
}

// ── URBANO_STATUS_MAP (superset) ──────────
export const URBANO_STATUS_MAP: Record<string, UrbanoStatusInfo> = {
  // ── Legacy V1 statuses ──
  pending: {
    label: 'Pendiente',
    className: 'statusPending',
    progress: 5,
    icon: 'pending',
    lucideIcon: Clock,
  },
  paid: {
    label: 'Pagado',
    className: 'statusPaid',
    progress: 10,
    icon: 'payments',
    lucideIcon: CreditCard,
  },
  processing: {
    label: 'Procesando',
    className: 'statusProcessing',
    progress: 20,
    icon: 'settings',
    lucideIcon: RefreshCw,
  },
  analizando: {
    label: 'Analizando',
    className: 'statusAnalyzing',
    progress: 15,
    icon: 'search',
    lucideIcon: Search,
  },
  validando: {
    label: 'VALIDANDO',
    className: 'statusVerifying',
    progress: 25,
    icon: 'fact_check',
    lucideIcon: RefreshCw,
  },
  not_delivered: {
    label: 'No Entregado',
    className: 'statusFailed',
    progress: 30,
    icon: 'hourglass_top',
    lucideIcon: AlertTriangle,
  },
  aceptado: {
    label: 'Aceptado',
    className: 'statusAccepted',
    progress: 40,
    icon: 'check_circle',
    lucideIcon: CheckCircle,
  },
  delivered: {
    label: 'Entregado al Courier',
    className: 'statusDelivered',
    progress: 50,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  shipped: {
    label: 'Enviado',
    className: 'statusDelivered',
    progress: 60,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  en_reparto: {
    label: 'En Reparto',
    className: 'statusEnReparto',
    progress: 75,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  esperando_confirmacion: {
    label: 'Esperando Confirmación',
    className: 'statusWaiting',
    progress: 80,
    icon: 'hourglass_empty',
    lucideIcon: Clock,
  },
  completed: {
    label: 'Finalizado',
    className: 'statusCompleted',
    progress: 100,
    icon: 'verified',
    lucideIcon: CheckCircle,
  },
  finalizado: {
    label: 'Finalizado',
    className: 'statusCompleted',
    progress: 100,
    icon: 'verified',
    lucideIcon: CheckCircle,
  },
  disputed: {
    label: 'En Disputa',
    className: 'statusRejected',
    progress: 0,
    icon: 'gavel',
    lucideIcon: AlertTriangle,
  },
  failed: {
    label: 'Fallido',
    className: 'statusFailed',
    progress: 0,
    icon: 'error',
    lucideIcon: AlertTriangle,
  },
  refund_requested: {
    label: 'Reembolso Solicitado',
    className: 'statusRejected',
    progress: 0,
    icon: 'currency_exchange',
    lucideIcon: AlertTriangle,
  },
  refunded: {
    label: 'Reembolsado',
    className: 'statusRejected',
    progress: 0,
    icon: 'currency_exchange',
    lucideIcon: AlertTriangle,
  },
  rechazado: {
    label: 'Rechazado',
    className: 'statusRejected',
    progress: 0,
    icon: 'cancel',
    lucideIcon: AlertTriangle,
  },
  expired: {
    label: 'Expirado',
    className: 'statusFailed',
    progress: 0,
    icon: 'timer_off',
    lucideIcon: AlertTriangle,
  },
  cancelled: {
    label: 'Cancelado',
    className: 'statusRejected',
    progress: 0,
    icon: 'cancel',
    lucideIcon: AlertTriangle,
  },
  reported: {
    label: 'Reportado',
    className: 'statusReported',
    progress: 0,
    icon: 'report_problem',
    lucideIcon: AlertTriangle,
  },

  // ── V2 statuses ──
  CREATED: {
    label: 'Creado',
    className: 'statusPending',
    progress: 5,
    icon: 'pending',
    lucideIcon: Clock,
  },
  READY_FOR_PICKUP: {
    label: 'Listo para Recojo',
    className: 'statusReadyPickup',
    progress: 50,
    icon: 'store',
    lucideIcon: Store,
  },
  PICKED_UP: {
    label: 'Recogido',
    className: 'statusPickedUp',
    progress: 75,
    icon: 'inventory',
    lucideIcon: Package,
  },
  PAID: {
    label: 'Pagado',
    className: 'statusPaid',
    progress: 10,
    icon: 'payments',
    lucideIcon: CreditCard,
  },
  PREPARING_ORDER: {
    label: 'Preparando Pedido',
    className: 'statusProcessing',
    progress: 20,
    icon: 'settings',
    lucideIcon: RefreshCw,
  },
  WAITING_CUSTOMER_CONFIRMATION: {
    label: 'Esperando Confirmación',
    className: 'statusWaiting',
    progress: 80,
    icon: 'hourglass_empty',
    lucideIcon: Clock,
  },
  READY_TO_SHIP: {
    label: 'Listo para Enviar',
    className: 'statusAccepted',
    progress: 40,
    icon: 'check_circle',
    lucideIcon: CheckCircle,
  },
  IN_TRANSIT: {
    label: 'En Tránsito',
    className: 'statusEnReparto',
    progress: 75,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  DELIVERED: {
    label: 'Entregado',
    className: 'statusDelivered',
    progress: 50,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  COMPLETED: {
    label: 'Finalizado',
    className: 'statusCompleted',
    progress: 100,
    icon: 'verified',
    lucideIcon: CheckCircle,
  },
  ISSUE_REPORTED: {
    label: 'Problema Reportado',
    className: 'statusReported',
    progress: 0,
    icon: 'report_problem',
    lucideIcon: AlertTriangle,
  },
  DISPUTE: {
    label: 'En Disputa',
    className: 'statusDisputed',
    progress: 0,
    icon: 'gavel',
    lucideIcon: AlertTriangle,
  },
  SELLER_TIMEOUT: {
    label: 'Tiempo Agotado',
    className: 'statusFailed',
    progress: 0,
    icon: 'timer_off',
    lucideIcon: AlertTriangle,
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'statusRejected',
    progress: 0,
    icon: 'cancel',
    lucideIcon: AlertTriangle,
  },
};

// ── DB_STATUS_FILTERS ─────────────────────
export const DB_STATUS_FILTERS = [
  'pending',
  'paid',
  'validando',
  'not_delivered',
  'delivered',
  'completed',
  'failed',
  'disputed',
  'refund_requested',
  'refunded',
];
