'use client';

import { Icon } from '@/shared';

/* ── Phase mapping ── */
export const SELLER_PHASES = [
  { label: 'Pedido', icon: 'payments', description: 'Pedido recibido y pagado' },
  { label: 'Validación', icon: 'fact_check', description: 'Ticket de envío' },
  { label: 'Envío', icon: 'local_shipping', description: 'Paquete en tránsito' },
  { label: 'Cerrado', icon: 'verified', description: 'Pedido finalizado' },
] as const;

export const PICKUP_SELLER_PHASES = [
  { label: 'Pedido', icon: 'payments', description: 'Pedido recibido y pagado' },
  { label: 'Recojo', icon: 'store', description: 'Cliente recoge en tienda' },
  { label: 'Cerrado', icon: 'verified', description: 'Pedido finalizado' },
] as const;

export interface SellerPhaseInfo {
  currentPhase: number;
  phaseStates: ('completed' | 'current' | 'locked')[];
}

const V2_PHASE: Record<string, number> = {
  CREATED: 0,
  PAID: 0,
  PREPARING_ORDER: 1,
  WAITING_CUSTOMER_CONFIRMATION: 1,
  READY_TO_SHIP: 2,
  IN_TRANSIT: 2,
  DELIVERED: 2,
  COMPLETED: 3,
  ISSUE_REPORTED: 0,
  DISPUTE: 0,
  SELLER_TIMEOUT: 0,
  CANCELLED: 0,
};

const V1_PHASE: Record<string, number> = {
  pending: 0,
  paid: 0,
  processing: 0,
  analizando: 0,
  validando: 1,
  aceptado: 1,
  delivered: 2,
  en_reparto: 2,
  esperando_confirmacion: 2,
  completed: 3,
  finalizado: 3,
  failed: 0,
  disputed: 0,
  refund_requested: 0,
  refunded: 0,
  rechazado: 0,
  reported: 0,
  expired: 0,
  cancelled: 0,
};

const V2_PHASE_PICKUP: Record<string, number> = {
  CREATED: 0,
  PAID: 0,
  PREPARING_ORDER: 0,
  READY_FOR_PICKUP: 1, // Phase 1 — actionable (seller marks ready)
  PICKED_UP: 1, // Phase 1 — waiting auto-complete (72h)
  COMPLETED: 2, // Phase 2 — done
  ISSUE_REPORTED: 0,
  DISPUTE: 0,
  SELLER_TIMEOUT: 0,
  CANCELLED: 0,
};

const V1_PHASE_PICKUP: Record<string, number> = {
  pending: 0,
  paid: 0,
  processing: 0,
  analizando: 0,
  validando: 1,
  aceptado: 1,
  delivered: 1,
  en_reparto: 1,
  esperando_confirmacion: 1,
  completed: 2,
  finalizado: 2,
  failed: 0,
  disputed: 0,
  refund_requested: 0,
  refunded: 0,
  rechazado: 0,
  reported: 0,
  expired: 0,
  cancelled: 0,
};

export function getSellerPhase(status: string, shippingType?: string | null): SellerPhaseInfo {
  const isPickup = shippingType?.toLowerCase() === 'recojo';
  const phases = isPickup ? PICKUP_SELLER_PHASES : SELLER_PHASES;
  const phaseMap = isPickup ? V2_PHASE_PICKUP : V2_PHASE;
  const phaseMapV1 = isPickup ? V1_PHASE_PICKUP : V1_PHASE;
  const idx = phaseMap[status] ?? phaseMapV1[status] ?? 0;
  const isTerminal = [
    'CANCELLED',
    'DISPUTE',
    'ISSUE_REPORTED',
    'SELLER_TIMEOUT',
    'failed',
    'disputed',
    'refunded',
    'cancelled',
    'rechazado',
    'refund_requested',
    'expired',
    'reported',
  ].includes(status);
  return {
    currentPhase: isTerminal ? 0 : idx,
    phaseStates: phases.map((_, i) => {
      if (isTerminal) return i === 0 ? 'current' : 'locked';
      if (i < idx) return 'completed';
      if (i === idx) return 'current';
      return 'locked';
    }),
  };
}

/* ── Component ── */
interface SellerPhaseGuideProps {
  phases: SellerPhaseInfo;
  selectedPhase: number;
  onSelect: (index: number) => void;
  phasesConfig?: readonly { label: string; icon: string; description: string }[];
}

export default function SellerPhaseGuide({
  phases,
  selectedPhase,
  onSelect,
  phasesConfig = SELLER_PHASES,
}: SellerPhaseGuideProps) {
  const totalPhases = phasesConfig.length;

  return (
    <div
      style={{
        width: '100%',
        padding: '0 2.3rem',
        margin: '0.75rem 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* Progress line — spans icon centers */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '34px',
            right: '34px',
            height: '4px',
            background: 'var(--md-sys-color-outline-variant)',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '34px',
            height: '4px',
            background: 'var(--md-sys-color-primary)',
            borderRadius: '2px',
            width: `calc((100% - 68px) * ${phases.currentPhase / (totalPhases - 1)})`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {phasesConfig.map((phase, i) => {
          const state = phases.phaseStates[i];
          const isPast = state === 'completed';
          const isCurrent = state === 'current';
          const isLocked = state === 'locked';
          const isSelected = i === selectedPhase;

          let bgColor = 'var(--md-sys-color-surface-container-highest)';
          if (isPast) bgColor = 'var(--md-sys-color-tertiary-container)';
          else if (isCurrent) bgColor = 'var(--md-sys-color-primary)';

          let borderColor = '2px solid var(--md-sys-color-outline-variant)';
          if (isCurrent) borderColor = '2px solid var(--md-sys-color-primary)';
          else if (isSelected && !isCurrent) borderColor = '2px solid var(--md-sys-color-outline)';

          let textColor = 'var(--md-sys-color-on-surface-variant)';
          if (isPast) textColor = 'var(--md-sys-color-on-tertiary-container)';
          else if (isCurrent) textColor = 'white';

          let iconElement = <Icon size={22}>{phase.icon}</Icon>;
          if (isPast) iconElement = <Icon size={20}>check_circle</Icon>;
          else if (isLocked) iconElement = <Icon size={20}>lock</Icon>;

          return (
            <div
              key={i}
              onClick={() => {
                if (!isLocked) onSelect(i);
              }}
              style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                position: 'relative',
                userSelect: 'none',
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: bgColor,
                  border: borderColor,
                  color: textColor,
                  boxShadow: isCurrent
                    ? '0 10px 20px rgba(var(--md-sys-color-primary-rgb), 0.3)'
                    : 'none',
                  transform: isSelected ? 'scale(1.1)' : 'none',
                }}
              >
                {iconElement}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: isCurrent || isSelected ? 950 : 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isCurrent
                    ? 'var(--md-sys-color-on-surface)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
