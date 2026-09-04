'use client';

import { checkCulqiReadiness } from '@/features/settings/actions/culqiReadiness';
import type { ReadinessResult } from '@/features/settings/lib/culqiReadiness';
import { Button, Icon, LinearProgress } from '@/shared/components/ui';
import { useCallback, useEffect, useState } from 'react';

interface CulqiReadinessCheckProps {
  businessId: string;
  /** When false, the approval CTA is hidden and replaced by an informational status (used for plans without Culqi access). */
  interactive?: boolean;
}

export default function CulqiReadinessCheck({
  businessId,
  interactive = true,
}: CulqiReadinessCheckProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkCulqiReadiness(businessId);
      setResult(data);
    } catch {
      setError('Error al verificar la preparación de tu tienda.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  if (loading) {
    return (
      <div style={{ padding: '12px' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-line"
            style={{
              height: '16px',
              borderRadius: '4px',
              background: 'var(--md-sys-color-outline-variant)',
              opacity: 0.4,
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.15; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '12px',
          background: 'var(--md-sys-color-error-container)',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <Icon size={20} style={{ color: 'var(--md-sys-color-error)' }}>
          error
        </Icon>
        <p
          style={{
            margin: '8px 0',
            fontSize: '13px',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          {error}
        </p>
        <Button variant="outlined" onClick={fetchReadiness}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const passedCount = result.passedCount;
  const totalCount = result.checks.length;
  const progress = (passedCount / totalCount) * 100;

  const handleApprovalRequest = () => {
    if (interactive && result.ready) {
      // The Culqi affiliation/validation happens on Culqi's side; we take the
      // seller to the official registration page once the store is ready.
      window.open('https://afiliate.culqi.com', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      style={{
        margin: '16px 0 0',
        padding: '12px',
        background: 'var(--md-sys-color-surface-container-high)',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: 1.6,
      }}
    >
      <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
        <Icon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}>
          checklist
        </Icon>
        Antes de pedirle a Culqi que valide tu tienda
      </p>

      {/* Progress bar */}
      <div style={{ margin: '0 0 12px' }}>
        <LinearProgress value={progress} />
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {passedCount} de {totalCount} requisitos cumplidos
        </p>
      </div>

      {/* Check list */}
      <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'none' }}>
        {result.checks.map((check) => (
          <li
            key={check.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <Icon
              size={16}
              style={{
                color: check.passed ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {check.passed ? 'check_circle' : 'cancel'}
            </Icon>
            <div>
              <span style={{ fontWeight: 500 }}>{check.label}</span>
              {!check.passed && (
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {check.message}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Approval CTA — only rendered when actionable; otherwise a status row */}
      <div style={{ marginTop: '12px' }}>
        {result.ready && interactive ? (
          <Button variant="filled" onClick={handleApprovalRequest}>
            <Icon slot="icon" size={18}>
              credit_card
            </Icon>
            Solicitar aprobación Culqi
          </Button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }}>
              {result.ready ? 'lock' : 'pending_actions'}
            </Icon>
            <span>
              {result.ready
                ? 'Disponible en planes Business Pro o superior.'
                : `Faltan ${totalCount - passedCount} requisito(s) para solicitar la aprobación de Culqi.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
