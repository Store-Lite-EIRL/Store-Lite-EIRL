'use client';

import { Button, Icon } from '@/shared/components/ui';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useEntitlements } from '../../context/BusinessEntitlementsContext';
import { useStorage } from '../context/StorageContext';
import { analyzeDataQuality, type DataQualityReport } from './import/DataQualityAnalyzer';
import { DataQualityPanel } from './import/DataQualityPanel';
import type { ExcelRow, ParseResult } from './import/ExcelParser';
import { parseWorkbook } from './import/ExcelParser';
import { ImportPreviewTable } from './import/ImportPreviewTable';
import { PreviewPagination } from './import/PreviewPagination';

/* ──────── Props ──────── */

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
  metadata?: Record<string, unknown>;
}

interface ImportPreviewDialogProps {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onImportStart: (rows: ImportRowInput[], businessSlug: string) => void;
}

/* ──────── Component ──────── */

export const ImportPreviewDialog = ({
  open,
  file,
  onClose,
  onImportStart,
}: ImportPreviewDialogProps) => {
  const params = useParams();
  const slug = params?.slug as string;
  const entitlements = useEntitlements();
  const { totalProducts: currentProductCount } = useStorage();
  const realLimit = entitlements.maxProducts;
  const planLimit = realLimit === -1 ? 2000 : realLimit;
  const currentCount = currentProductCount ?? 0;
  const availableSlots = Math.max(0, planLimit - currentCount);
  const isUnlimited = realLimit === -1;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, ExcelRow[]>>({});
  const [sheetInfo, setSheetInfo] = useState<ParseResult['sheetInfo']>([]);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const [sheetsTruncated, setSheetsTruncated] = useState(false);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState<string[]>([]);
  const [selectedExtraFields, setSelectedExtraFields] = useState<Set<string>>(new Set());

  const parsedFileRef = useRef<File | null>(null);

  const PER_PAGE = 14;

  /* ─── Derived ─── */
  const allRows: ExcelRow[] = Object.values(data).flat();
  const totalPages = Math.max(1, Math.ceil(allRows.length / PER_PAGE));
  const visibleRows = allRows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalProducts = allRows.length;
  const totalFileRows = sheetInfo[0]?.totalRows ?? 0;
  const totalColumns = sheetInfo[0]?.rawHeaders.length ?? 0;

  /* ─── Fill missing product codes ─── */
  const fillMissingCodes = (rows: ExcelRow[], prefix: string): void => {
    const slugPrefix = prefix.substring(0, 3).toLowerCase();
    let counter = 1;
    for (const row of rows) {
      if (!row.codigo) {
        row.codigo = `${slugPrefix}-${String(counter).padStart(4, '0')}`;
        counter++;
      }
    }
  };

  /* ─── Parse file ─── */
  useEffect(() => {
    if (!open || !file || parsedFileRef.current === file) return;
    parsedFileRef.current = file;
    let cancelled = false;

    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setLoading(true);

      void (async () => {
        try {
          const result = await parseWorkbook(file, availableSlots > 0 ? availableSlots : 1);
          if (cancelled) return;

          setData(result.data);
          setSheetInfo(result.sheetInfo);
          setPage(1);
          setToastOpen(result.truncated);
          setSheetsTruncated(result.sheetsTruncated);

          // Fill missing codes with slug prefix
          const prefix = (slug || 'sto').substring(0, 3).toLowerCase();
          const allParsed = Object.values(result.data).flat();
          fillMissingCodes(allParsed, prefix);

          // Collect unmatched headers (extraFields keys) across all rows
          const extraSet = new Set<string>();
          for (const row of allParsed) {
            for (const key of Object.keys(row.extraFields)) {
              extraSet.add(key);
            }
          }
          const headers = Array.from(extraSet).sort();
          setUnmatchedHeaders(headers);
          setSelectedExtraFields(new Set(headers)); // all checked by default

          // Run data quality analysis
          setAnalyzing(true);
          const qualityReport = analyzeDataQuality(result.data, result.sheetInfo);
          if (!cancelled) {
            setReport(qualityReport);
            setAnalyzing(false);
          }

          setLoading(false);
        } catch {
          if (cancelled) return;
          setLoading(false);
          setAnalyzing(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [open, file, slug]);

  /* ─── Reset on close ─── */
  useEffect(() => {
    if (open) return;
    parsedFileRef.current = null;

    const frameId = window.requestAnimationFrame(() => {
      setData({});
      setSheetInfo([]);
      setReport(null);
      setPage(1);
      setToastOpen(false);
      setSheetsTruncated(false);
      setUnmatchedHeaders([]);
      setSelectedExtraFields(new Set());
      setPanelOpen(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  /* ─── Toggle extra field checkbox ─── */
  const handleToggleExtraField = (header: string) => {
    setSelectedExtraFields((prev) => {
      const next = new Set(prev);
      if (next.has(header)) {
        next.delete(header);
      } else {
        next.add(header);
      }
      return next;
    });
  };

  /* ─── Execute import ─── */
  const handleImport = () => {
    if (totalProducts === 0) return;

    const rows = allRows.map((r) => {
      const metadata: Record<string, unknown> = {};
      for (const header of selectedExtraFields) {
        if (r.extraFields[header]) {
          metadata[header] = r.extraFields[header];
        }
      }

      return {
        name: r.title || 'Producto',
        description: r.description || undefined,
        category: r.category,
        stock: Math.max(0, r.stock),
        price: Number(r.price) || 0,
        status: 'ACTIVO' as const,
        imageUrl: r.image || undefined,
        brand: r.brand || undefined,
        externalCode: r.codigo || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    });

    onImportStart(rows, slug);
  };

  /* ─── Dialog close guard ─── */
  const handleDialogClose = () => {
    if (loading) return;
    onClose();
  };

  /* ─── Dynamic table height: grows with viewport, capped sensibly ─── */
  const tableHeightCss =
    panelOpen && report
      ? 'min(max(calc(100vh - 460px), 360px), 680px)'
      : 'min(max(calc(100vh - 260px), 450px), 900px)';

  return (
    <Dialog open={open} onClose={handleDialogClose} className="import-preview-dialog">
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon>inventory_2</Icon>
        Previsualización de Importación
      </div>

      <div
        slot="content"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.25rem 0 0',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 420,
              gap: '1rem',
            }}
          >
            <CircularProgress indeterminate />
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {analyzing ? 'Analizando calidad de datos…' : 'Procesando archivo…'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Data Quality Panel ── */}
            <DataQualityPanel
              report={report}
              open={panelOpen}
              onToggle={() => setPanelOpen((p) => !p)}
              loading={analyzing}
            />

            {/* ── File info banner ── */}
            {(totalFileRows > 0 || totalColumns > 0) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 12,
                  background: 'var(--md-sys-color-surface-variant)',
                  fontSize: '0.78rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon style={{ fontSize: 17 }}>table_rows</Icon>
                  <span>
                    <strong>{totalFileRows}</strong> filas
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon style={{ fontSize: 17 }}>view_column</Icon>
                  <span>
                    <strong>{totalColumns}</strong> columnas
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon style={{ fontSize: 17 }}>inventory_2</Icon>
                  <span>
                    <strong>{currentCount}</strong>/{isUnlimited ? '∞' : realLimit} usados
                    {!isUnlimited && availableSlots > 0 && availableSlots < 20 && (
                      <span style={{ color: '#b3261e', fontWeight: 600, marginLeft: 4 }}>
                        · {availableSlots} disponible{availableSlots !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </span>
                {totalProducts < totalFileRows && (
                  <span style={{ color: '#b3261e', fontWeight: 600 }}>
                    · Mostrando {totalProducts} de {totalFileRows} filas
                    <span style={{ fontWeight: 400, opacity: 0.8 }}> (límite del plan)</span>
                  </span>
                )}
                {availableSlots === 0 && (
                  <span style={{ color: '#b3261e', fontWeight: 600 }}>
                    · Límite alcanzado. No puedes importar más productos.
                  </span>
                )}
              </div>
            )}

            {/* ── Preview table ── */}
            <div
              style={{
                height: tableHeightCss,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--md-sys-color-surface)',
                transition: 'height 0.2s',
              }}
            >
              <ImportPreviewTable
                rows={visibleRows}
                startIndex={(page - 1) * PER_PAGE + 1}
                unmatchedHeaders={unmatchedHeaders}
                selectedExtraFields={selectedExtraFields}
                onToggleExtraField={handleToggleExtraField}
              />
              <PreviewPagination page={page} total={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <div slot="actions">
        <Button variant="text" onClick={handleDialogClose} disabled={loading}>
          Cancelar
        </Button>
        {availableSlots === 0 ? (
          <Button variant="filled" disabled>
            <Icon slot="icon" size={21}>
              block
            </Icon>
            Límite alcanzado
          </Button>
        ) : (
          <Button variant="filled" onClick={handleImport} disabled={loading || totalProducts === 0}>
            <Icon slot="icon" size={21}>
              upload
            </Icon>
            Importar {totalProducts} productos
          </Button>
        )}
      </div>

      {/* ── Row truncation warning ── */}
      <AlertSnackbar
        open={toastOpen}
        description="Agregamos los primeros datos porque fueron más de lo permitido."
        color="warning"
        icon="warning"
        position="bottom-center"
        onClose={() => setToastOpen(false)}
        autoCloseDuration={8000}
      />

      {/* ── Multi-sheet notification ── */}
      <AlertSnackbar
        open={sheetsTruncated}
        description="El archivo tiene más de una hoja. Solo se importará la primera hoja."
        color="info"
        icon="info"
        position="bottom-center"
        onClose={() => setSheetsTruncated(false)}
        autoCloseDuration={6000}
      />
    </Dialog>
  );
};
