'use client';

import { Button, Icon } from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useEffect, useRef, useState } from 'react';

/* ──────── Types ──────── */

interface ImportRowInput {
  name: string;
  description?: string;
  category: string;
  stock: number;
  price: number;
  status: string;
  imageUrl?: string;
  brand?: string;
  externalCode?: string;
  tags?: string[];
  secondPrice?: number;
  saleStatus?: string;
  shippingInfo?: string;
  seoTitle?: string;
  seoDescription?: string;
  metadata?: Record<string, unknown>;
}

interface ImportResult {
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors?: { row: number; error: string }[];
}

interface ImportProgressDialogProps {
  open: boolean;
  businessSlug: string;
  rows: ImportRowInput[];
  onComplete: () => void;
  onClose: () => void;
}

/* ──────── Component ──────── */

export const ImportProgressDialog = ({
  open,
  businessSlug,
  rows,
  onComplete,
  onClose,
}: ImportProgressDialogProps) => {
  const [status, setStatus] = useState<'importing' | 'completed' | 'error'>('importing');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  /* ─── Progress animation (fake, non-linear) ─── */

  const easeProgress = (elapsed: number, totalEstimate: number): number => {
    // Fast start, slow middle, slow end — caps at 90%
    const t = Math.min(elapsed / totalEstimate, 1);
    // Ease-out-ish: 1 - (1-t)^2, scaled to 90%
    return 90 * (1 - Math.pow(1 - t, 2));
  };

  const startAnimation = () => {
    startTimeRef.current = Date.now();
    // Estimate: 100ms per row + 2000ms base (min 3s, max 15s)
    const estimate = Math.max(3000, Math.min(15000, rows.length * 100 + 2000));

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = easeProgress(elapsed, estimate);
      setProgress(pct);

      if (pct < 90) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  };

  const stopAnimation = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  /* ─── Run import when dialog opens ─── */

  useEffect(() => {
    if (!open) {
      stopAnimation();
      return;
    }

    setStatus('importing');
    setProgress(0);
    setResult(null);
    setErrorMsg(null);
    startAnimation();

    const run = async () => {
      try {
        const res = await fetch('/api/imports/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessSlug, rows }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al importar productos');
        }

        setResult({
          totalRows: data.totalRows,
          processedRows: data.processedRows,
          errorRows: data.errorRows,
          errors: data.errors,
        });

        // Jump to 100%
        stopAnimation();
        setProgress(100);
        // Small delay so user sees 100% before we flip status
        setTimeout(() => setStatus('completed'), 400);
      } catch (err) {
        stopAnimation();
        const msg = err instanceof Error ? err.message : 'Error inesperado al importar';
        setErrorMsg(msg);
        setProgress(0);
        setStatus('error');
      }
    };

    run();

    return () => {
      stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ─── Handle close ─── */

  const handleAccept = () => {
    onComplete();
  };

  const handleDialogClose = () => {
    if (status === 'completed') {
      onComplete();
    } else {
      onClose();
    }
  };

  /* ─── Render ─── */

  return (
    <Dialog open={open} onClose={handleDialogClose} className="import-progress-dialog">
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon>inventory_2</Icon>
        {status === 'importing'
          ? 'Importando productos…'
          : status === 'completed'
            ? 'Importación completada'
            : 'Error en la importación'}
      </div>

      <div
        slot="content"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '1.5rem 0',
          textAlign: 'center',
        }}
      >
        {status === 'importing' && (
          <>
            {/* Progress ring / bar */}
            <div
              style={{
                position: 'relative',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Background circle */}
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle
                  cx={60}
                  cy={60}
                  r={52}
                  fill="none"
                  stroke="var(--md-sys-color-surface-variant)"
                  strokeWidth={8}
                />
                <circle
                  cx={60}
                  cy={60}
                  r={52}
                  fill="none"
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
                <text
                  x={60}
                  y={62}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={22}
                  fontWeight={700}
                  fill="var(--md-sys-color-on-surface)"
                >
                  {Math.round(progress)}%
                </text>
              </svg>
            </div>

            <div style={{ maxWidth: 300 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 500,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                Procesando {rows.length} producto{rows.length !== 1 ? 's' : ''}…
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0',
                  fontSize: '0.82rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                No cierres ni recargues la página mientras se completa la importación.
              </p>
            </div>
          </>
        )}

        {status === 'completed' && result && (
          <>
            <Icon size={56} style={{ color: '#2e7d32' }}>
              check_circle
            </Icon>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>¡Listo!</p>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{result.processedRows}</strong> de <strong>{result.totalRows}</strong>{' '}
                productos importados
                {result.errorRows > 0 ? ` (${result.errorRows} con errores)` : ' correctamente'}
              </p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 400,
                  maxHeight: 120,
                  overflowY: 'auto',
                  background: 'var(--md-sys-color-surface-variant)',
                  borderRadius: 12,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.78rem',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0', color: '#b3261e' }}>
                  {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}
                </p>
                {result.errors.map((e, i) => (
                  <p
                    key={i}
                    style={{
                      margin: '0.1rem 0',
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    <strong>Fila {e.row}:</strong> {e.error}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <Icon style={{ fontSize: 56, color: '#b3261e' }}>error</Icon>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Algo salió mal</p>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.9rem',
                }}
              >
                {errorMsg}
              </p>
            </div>
          </>
        )}
      </div>

      <div slot="actions">
        {status === 'importing' ? (
          <Button variant="text" disabled>
            <Icon slot="icon" size={21}>
              hourglass_top
            </Icon>
            Importando…
          </Button>
        ) : (
          <Button variant="filled" onClick={handleAccept}>
            <Icon slot="icon" size={21}>
              {status === 'completed' ? 'check' : 'close'}
            </Icon>
            {status === 'completed' ? 'Aceptar' : 'Cerrar'}
          </Button>
        )}
      </div>
    </Dialog>
  );
};
