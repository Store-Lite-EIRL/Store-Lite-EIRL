'use client';

import { Icon } from '@/shared';

/* ── Phase mapping ── */
const SELLER_PHASES = [
  { label: 'Pedido', icon: 'payments', description: 'Pedido recibido y pagado' },
  { label: 'Validación', icon: 'fact_check', description: 'Ticket de envío' },
  { label: 'Envío', icon: 'local_shipping', description: 'Paquete en tránsito' },
  { label: 'Cerrado', icon: 'verified', description: 'Pedido finalizado' },
] as const;

export interface SellerPhaseInfo {
  currentPhase: number;
  phaseStates: ('completed' | 'current' | 'locked')[];
}

const V2_PHASE: Record<string, number> = {
  CREATED: 0,
  PAID: 0,
  PREPARING_ORDER: 0,
  WAITING_CUSTOMER_CONFIRMATION: 1,
  READY_TO_SHIP: 1,
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
  delivered: 1,
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

export function getSellerPhase(status: string): SellerPhaseInfo {
  const idx = V2_PHASE[status] ?? V1_PHASE[status] ?? 0;
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
    phaseStates: SELLER_PHASES.map((_, i) => {
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
}

export default function SellerPhaseGuide({
  phases,
  selectedPhase,
  onSelect,
}: SellerPhaseGuideProps) {
  const totalPhases = SELLER_PHASES.length;

  return (
    <div
      style={{
        width: '100%',
        padding: '0 10px',
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

        {SELLER_PHASES.map((phase, i) => {
          const state = phases.phaseStates[i];
          const isPast = state === 'completed';
          const isCurrent = state === 'current';
          const isLocked = state === 'locked';
          const isSelected = i === selectedPhase;

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
                opacity: isLocked ? 0.4 : 1,
                transition: 'opacity 0.3s',
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
                  background: isPast
                    ? 'var(--md-sys-color-tertiary-container)'
                    : isCurrent
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-surface-container-highest)',
                  border: isCurrent
                    ? '2px solid var(--md-sys-color-primary)'
                    : isSelected && !isCurrent
                      ? '2px solid var(--md-sys-color-outline)'
                      : '2px solid var(--md-sys-color-outline-variant)',
                  color: isPast
                    ? 'var(--md-sys-color-on-tertiary-container)'
                    : isCurrent
                      ? 'white'
                      : 'var(--md-sys-color-on-surface-variant)',
                  boxShadow: isCurrent
                    ? '0 10px 20px rgba(var(--md-sys-color-primary-rgb), 0.3)'
                    : 'none',
                  transform: isSelected ? 'scale(1.1)' : 'none',
                }}
              >
                {isPast ? (
                  <Icon size={20}>check_circle</Icon>
                ) : isLocked ? (
                  <Icon size={20}>lock</Icon>
                ) : (
                  <Icon size={22}>{phase.icon}</Icon>
                )}
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
