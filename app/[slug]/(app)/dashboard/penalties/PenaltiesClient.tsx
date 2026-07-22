'use client';

import type { PenaltyRecord, PenaltyStatus } from '@/core/penalties/penaltyTypes';
import {
  ABANDONO_DAYS,
  PENALTY_A_PERCENTAGE,
  PENALTY_B_PERCENTAGE,
  PENALTY_COUNT_WINDOW,
  PENALTY_WINDOW_DAYS,
  SELLER_TIMEOUT_DAYS,
} from '@/core/penalties/penaltyTypes';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PayModal from './components/PayModal';
import styles from './penalties.module.css';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PenaltyStatusResponse {
  culqiBlocked: boolean;
  blacklisted: boolean;
  penaltyDebt: string | null;
  penaltyCount: number | null;
  canAcceptPayments: boolean;
}

interface PenaltiesResponse {
  penalties: PenaltyRecord[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<PenaltyStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  disputed: 'En disputa',
};

const PENALTY_TYPE_LABELS: Record<string, string> = {
  INCUMPLIMIENTO_PLAZO_PREPARACION: 'Incumplimiento de Plazo',
  ABANDONO_PEDIDO: 'Abandono de Pedido',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(amount: string | number | null | undefined): string {
  // eslint-disable-next-line eqeqeq
  if (amount == null) return 'S/ 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `S/ ${num.toFixed(2)}`;
}

function getTypeLabel(type: string): string {
  return PENALTY_TYPE_LABELS[type] || type;
}

function getStatusLabel(status: PenaltyStatus): string {
  return STATUS_LABELS[status] || status;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── PenaltiesClient ────────────────────────────────────────────────────────

interface PenaltiesClientProps {
  businessId: string;
  slug: string;
  culqiPublicKey?: string;
}

export default function PenaltiesClient({
  businessId,
  slug,
  culqiPublicKey,
}: PenaltiesClientProps) {
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [status, setStatus] = useState<PenaltyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pay modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalPenalties, setPayModalPenalties] = useState<PenaltyRecord[]>([]);

  // ── Data fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [penaltiesRes, statusRes] = await Promise.all([
        fetch(`/api/business/penalties?businessId=${encodeURIComponent(businessId)}`),
        fetch(`/api/business/penalty-status?businessId=${encodeURIComponent(businessId)}`),
      ]);

      if (!penaltiesRes.ok) {
        const errData = await penaltiesRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al cargar multas');
      }
      if (!statusRes.ok) {
        const errData = await statusRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al cargar estado');
      }

      const penaltiesData: PenaltiesResponse = await penaltiesRes.json();
      const statusData: PenaltyStatusResponse = await statusRes.json();

      setPenalties(penaltiesData.penalties);
      setStatus(statusData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Pay actions ──
  const pendingPenalties = penalties.filter((p) => p.status === 'pending');
  const totalDebt = pendingPenalties.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const activeCount = pendingPenalties.length;

  const handlePaySingle = (penalty: PenaltyRecord) => {
    setPayModalPenalties([penalty]);
    setShowPayModal(true);
  };

  const handlePayAll = () => {
    if (pendingPenalties.length === 0) return;
    setPayModalPenalties(pendingPenalties);
    setShowPayModal(true);
  };

  const handlePaySuccess = () => {
    setShowPayModal(false);
    fetchData();
  };

  // ── Banner ──
  const renderBanner = () => {
    if (!status) return null;

    if (status.blacklisted) {
      return (
        <div className={`${styles.banner} ${styles.bannerBlacklisted}`}>
          <XCircle size={24} className={styles.bannerIcon} />
          <span>
            <strong>Negocio cerrado permanentemente</strong> — Tu RUC ha sido bloqueado.
          </span>
        </div>
      );
    }

    if (status.culqiBlocked) {
      return (
        <div className={`${styles.banner} ${styles.bannerBlocked}`}>
          <AlertTriangle size={24} className={styles.bannerIcon} />
          <span>
            <strong>Pasarela de pagos bloqueada</strong> — Tenés multas pendientes. Pagalas para
            reactivar tus cobros.
          </span>
        </div>
      );
    }

    return (
      <div className={`${styles.banner} ${styles.bannerOk}`}>
        <CheckCircle size={24} className={styles.bannerIcon} />
        <span>
          <strong>Todo en orden</strong> — No tenés multas pendientes.
        </span>
      </div>
    );
  };

  // ── Loading state ──
  if (loading && penalties.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={48} className={styles.spinningIcon} />
          <p className={styles.loadingText}>Cargando multas...</p>
        </div>
      </main>
    );
  }

  // ── Error state ──
  if (error && penalties.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.errorState}>
          <XCircle size={48} color="var(--md-sys-color-error)" />
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={fetchData}>
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <Link
          href={`/${slug}/dashboard`}
          className={styles.backButton}
          aria-label="Volver al dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.pageTitle}>Mis Multas</h1>
      </div>

      {/* Status Banner */}
      {renderBanner()}

      {/* Debt Summary */}
      <div className={styles.debtSummary}>
        <div className={styles.debtCard}>
          <div
            className={`${styles.debtCardIcon} ${activeCount === 0 ? styles.debtCardIconGreen : ''}`}
          >
            <DollarSign size={24} />
          </div>
          <div className={styles.debtCardInfo}>
            <span className={styles.debtCardLabel}>Deuda Total</span>
            <span className={styles.debtCardValue}>{formatAmount(totalDebt)}</span>
          </div>
        </div>
        <div className={styles.debtCard}>
          <div
            className={`${styles.debtCardIcon} ${activeCount === 0 ? styles.debtCardIconGreen : ''}`}
          >
            <AlertTriangle size={24} />
          </div>
          <div className={styles.debtCardInfo}>
            <span className={styles.debtCardLabel}>Multas Activas</span>
            <span className={styles.debtCardValue}>{activeCount}</span>
            <span className={styles.debtCardSubtext}>
              {activeCount === 1 ? '1 multa pendiente' : `${activeCount} multas pendientes`}
            </span>
          </div>
        </div>
      </div>

      {/* Info: cómo funcionan las multas */}
      <details className={styles.infoBox}>
        <summary className={styles.infoBoxSummary}>
          <Info size={16} />
          ¿Cómo funcionan las multas?
        </summary>
        <div className={styles.infoBoxContent}>
          <p className={styles.infoBoxText}>
            Las multas se generan automáticamente cuando no preparás un pedido a tiempo. No
            reemplazan el estado del pedido — este sigue igual, pero se registra la infracción.
          </p>

          <div className={styles.infoBoxSteps}>
            <div className={styles.infoBoxStep}>
              <span className={styles.infoBoxStepNum}>1</span>
              <div>
                <strong className={styles.infoBoxStepTitle}>
                  Penalidad A — {SELLER_TIMEOUT_DAYS} días sin preparar
                </strong>
                <p className={styles.infoBoxStepDesc}>
                  Se cobra el <strong>{PENALTY_A_PERCENTAGE}%</strong> del valor del producto y se{' '}
                  <strong>bloquea Cobra con Culqi</strong> hasta que pagues la multa.
                </p>
              </div>
            </div>

            <div className={styles.infoBoxStep}>
              <span className={styles.infoBoxStepNum}>2</span>
              <div>
                <strong className={styles.infoBoxStepTitle}>
                  Penalidad B — {ABANDONO_DAYS} días sin preparar
                </strong>
                <p className={styles.infoBoxStepDesc}>
                  Se cobra el <strong>{PENALTY_B_PERCENTAGE}%</strong> y tu negocio se{' '}
                  <strong>cierra permanentemente</strong> (blacklist + bloqueo de RUC).
                </p>
              </div>
            </div>

            <div className={styles.infoBoxStep}>
              <span className={styles.infoBoxStepNum}>3</span>
              <div>
                <strong className={styles.infoBoxStepTitle}>Bloqueo automático</strong>
                <p className={styles.infoBoxStepDesc}>
                  Si acumulás <strong>{PENALTY_COUNT_WINDOW} penalidades</strong> en menos de{' '}
                  {PENALTY_WINDOW_DAYS} días, se bloquea Cobra con Culqi automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Pay All + Table Header */}
      <div className={styles.headerActions}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Historial de Multas</h2>
        {activeCount > 0 && (
          <button className={styles.payAllButton} onClick={handlePayAll}>
            <CreditCard size={18} />
            Pagar todo ({formatAmount(totalDebt)})
          </button>
        )}
      </div>

      {/* Penalty Table or Empty State */}
      {penalties.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🎉</div>
          <h3 className={styles.emptyStateTitle}>No tenés multas pendientes</h3>
          <p className={styles.emptyStateText}>
            Seguí cumpliendo con los plazos de preparación y envío para mantener tu cuenta en regla.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {penalties.map((penalty) => (
                <tr key={penalty.id} className={styles.tableRow}>
                  <td data-label="Tipo">
                    <span className={styles.typeLabel}>{getTypeLabel(penalty.penaltyType)}</span>
                    {penalty.orderNumber && (
                      <span className={styles.typeSubtext}>Pedido #{penalty.orderNumber}</span>
                    )}
                  </td>
                  <td data-label="Título">{penalty.title}</td>
                  <td data-label="Monto">{formatAmount(penalty.amount)}</td>
                  <td data-label="Estado">
                    <StatusBadge status={penalty.status} />
                  </td>
                  <td data-label="Fecha">{formatDate(penalty.createdAt)}</td>
                  <td data-label="Acciones">
                    {penalty.status === 'pending' && (
                      <button className={styles.payButton} onClick={() => handlePaySingle(penalty)}>
                        <CreditCard size={14} />
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pay Modal */}
      <PayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        penalties={payModalPenalties}
        businessId={businessId}
        culqiPublicKey={culqiPublicKey}
        onSuccess={handlePaySuccess}
      />
    </main>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PenaltyStatus }) {
  const iconMap: Record<PenaltyStatus, React.ReactNode> = {
    pending: <Clock size={12} />,
    paid: <CheckCircle size={12} />,
    cancelled: <XCircle size={12} />,
    disputed: <AlertTriangle size={12} />,
  };

  const classMap: Record<PenaltyStatus, string> = {
    pending: styles.statusBadgePending,
    paid: styles.statusBadgePaid,
    cancelled: styles.statusBadgeCancelled,
    disputed: styles.statusBadgeDisputed,
  };

  return (
    <span className={`${styles.statusBadge} ${classMap[status]}`}>
      {iconMap[status]}
      {getStatusLabel(status)}
    </span>
  );
}
