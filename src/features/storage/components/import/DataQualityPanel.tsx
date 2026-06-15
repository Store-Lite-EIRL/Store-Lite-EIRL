'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import type { DataQualityReport } from './DataQualityAnalyzer';

interface DataQualityPanelProps {
  report: DataQualityReport | null;
  open: boolean;
  onToggle: () => void;
  loading: boolean;
}

/* ──────── Severity color map ──────── */

const severityConfig = {
  error: { color: '#b3261e', bg: '#fce4ec', icon: 'error' },
  warning: { color: '#e66a00', bg: '#fff3e0', icon: 'warning' },
  info: { color: '#00639b', bg: '#e1f5fe', icon: 'info' },
} as const;

/* ──────── Match type labels ──────── */

const matchLabel: Record<string, { label: string; color: string }> = {
  exact: { label: 'EXACTO', color: '#1e8e3e' },
  partial: { label: 'PARCIAL', color: '#e66a00' },
  not_found: { label: 'NO ENCONTRADO', color: '#b3261e' },
  sheet: { label: 'DEL SHEET', color: '#00639b' },
  default: { label: 'VALOR DEFAULT', color: '#9e9e9e' },
};

/* ──────── Score ring component ──────── */

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#1e8e3e' : score >= 50 ? '#e66a00' : '#b3261e';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `4px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}
      >
        {score}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Calidad de datos</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          {score >= 80 ? 'Excelente' : score >= 50 ? 'Regular' : 'Bajo'} — revisa las anomalías
          antes de importar
        </div>
      </div>
    </div>
  );
}

/* ──────── Summary section ──────── */

function SummarySection({ summary }: { summary: DataQualityReport['summary'] }) {
  return (
    <div>
      <div
        style={{
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '0.5rem',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        RESUMEN
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.5rem',
        }}
      >
        <SummaryCard icon="inventory_2" label="Productos" value={summary.totalRows.toString()} />
        <SummaryCard
          icon="category"
          label="Categorías"
          value={summary.categories.length.toString()}
        />
        <SummaryCard icon="warehouse" label="Stock total" value={summary.stockTotal.toString()} />
        <SummaryCard
          icon="payments"
          label="Precios"
          value={
            summary.priceRange
              ? 'S/' + summary.priceRange.min + ' - S/' + summary.priceRange.max
              : '—'
          }
        />
        <SummaryCard
          icon="warning"
          label="Sin stock"
          value={summary.productsWithoutStock.toString()}
        />
        <SummaryCard
          icon="text_fields"
          label="Sin título"
          value={summary.productsWithoutTitle.toString()}
        />
        <SummaryCard icon="image" label="Con imagen" value={summary.productsWithImage.toString()} />
      </div>
      {summary.categories.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {summary.categories.map((cat) => (
            <span
              key={cat.name}
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: 100,
                background: 'var(--md-sys-color-secondary-container)',
                color: 'var(--md-sys-color-on-secondary-container)',
              }}
            >
              {cat.name} ({cat.count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.5rem',
        borderRadius: 8,
        background: 'var(--md-sys-color-surface-container-low)',
        fontSize: '0.8rem',
      }}
    >
      <Icon style={{ fontSize: 18, color: 'var(--md-sys-color-primary)', opacity: 0.7 }}>
        {icon}
      </Icon>
      <div>
        <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ──────── Column mapping section ──────── */

function ColumnMappingSection({ columns }: { columns: DataQualityReport['columns'] }) {
  return (
    <div>
      <div
        style={{
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '0.5rem',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        MAPEO DE COLUMNAS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {columns.map((col) => {
          const ml = matchLabel[col.matchType] ?? { label: col.matchType, color: '#9e9e9e' };
          return (
            <div
              key={col.field}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                borderRadius: 8,
                background: 'var(--md-sys-color-surface-container-low)',
                fontSize: '0.8rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Field label */}
              <span style={{ fontWeight: 600, minWidth: 85 }}>{col.label}</span>

              {/* Match badge */}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 4,
                  background: ml.color + '20',
                  color: ml.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {ml.label}
              </span>

              {/* Original header or arrow */}
              {col.matchType !== 'not_found' && col.originalHeader ? (
                <span
                  style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.75rem' }}
                >
                  ←{' '}
                  <code
                    style={{
                      background: 'var(--md-sys-color-surface-dim)',
                      padding: '0.05rem 0.3rem',
                      borderRadius: 3,
                      fontSize: '0.75rem',
                    }}
                  >
                    {col.originalHeader}
                  </code>
                </span>
              ) : null}

              {/* Type */}
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: 3,
                  background: 'var(--md-sys-color-tertiary-container)',
                  color: 'var(--md-sys-color-on-tertiary-container)',
                }}
              >
                {col.inferredType}
              </span>

              {/* Warnings */}
              {col.warnings.map((w, wi) => (
                <span
                  key={wi}
                  style={{
                    fontSize: '0.7rem',
                    color: '#e66a00',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <Icon style={{ fontSize: 14 }}>warning</Icon>
                  {w}
                </span>
              ))}

              {/* Confidence dots */}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.7rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {col.confidence}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────── Anomalies section ──────── */

function AnomaliesSection({ anomalies }: { anomalies: DataQualityReport['anomalies'] }) {
  if (anomalies.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 0.8rem',
          borderRadius: 8,
          background: '#1e8e3e10',
          color: '#1e8e3e',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        <Icon>check_circle</Icon>
        No se detectaron anomalías
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '0.5rem',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        ANOMALÍAS DETECTADAS ({anomalies.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {anomalies.map((a, i) => {
          const cfg = severityConfig[a.severity];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                padding: '0.4rem 0.6rem',
                borderRadius: 8,
                background: cfg.bg,
                fontSize: '0.8rem',
              }}
            >
              <Icon style={{ fontSize: 18, color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon}
              </Icon>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: cfg.color }}>
                  {a.label}{' '}
                  <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>
                    ({a.count} ocurrencia(s))
                  </span>
                </div>
                <div
                  style={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: '0.1rem' }}
                >
                  {a.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────── Main component ──────── */

export const DataQualityPanel = ({ report, open, onToggle, loading }: DataQualityPanelProps) => {
  return (
    <div
      style={{
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--md-sys-color-surface)',
        marginBottom: '0.75rem',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.7rem 1rem',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--md-sys-color-on-surface)',
          fontSize: '0.9rem',
          fontWeight: 600,
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon style={{ fontSize: 20 }}>insights</Icon>
          <span>Calidad de datos</span>
          {loading && <CircularProgress indeterminate style={{ width: 16, height: 16 }} />}
          {report && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.1rem 0.5rem',
                borderRadius: 100,
                background:
                  report.qualityScore >= 80
                    ? '#1e8e3e20'
                    : report.qualityScore >= 50
                      ? '#e66a0020'
                      : '#b3261e20',
                color:
                  report.qualityScore >= 80
                    ? '#1e8e3e'
                    : report.qualityScore >= 50
                      ? '#e66a00'
                      : '#b3261e',
              }}
            >
              {loading && <CircularProgress indeterminate style={{ width: 12, height: 12 }} />}
              {report.qualityScore}/100
            </span>
          )}
        </div>
        <Icon
          style={{
            fontSize: 20,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </Icon>
      </button>

      {/* Collapsible content */}
      {open && (
        <div
          style={{
            padding: '0 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                fontSize: '0.85rem',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              Analizando datos…
            </div>
          ) : report ? (
            <>
              <ScoreRing score={report.qualityScore} />
              <SummarySection summary={report.summary} />
              <ColumnMappingSection columns={report.columns} />
              <AnomaliesSection anomalies={report.anomalies} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
