'use client';

import { Button, Icon } from '@/shared/components/ui';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import React, { useEffect, useRef, useState } from 'react';
import type { Product } from '../data';
import type { ExcelRow } from './import/ExcelParser';
import { parseWorkbook } from './import/ExcelParser';
import { ImportPreviewTable } from './import/ImportPreviewTable';
import { PreviewPagination } from './import/PreviewPagination';
import { SheetTabs } from './import/SheetTabs';

interface ImportPreviewDialogProps {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onImport: (products: Product[]) => void;
}

export const ImportPreviewDialog = ({
  open,
  file,
  onClose,
  onImport,
}: ImportPreviewDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, ExcelRow[]>>({});
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [page, setPage] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const parsedFileRef = useRef<File | null>(null);

  const PER_PAGE = 14;

  useEffect(() => {
    if (!open || !file || parsedFileRef.current === file) return;
    parsedFileRef.current = file;
    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setLoading(true);

      void (async () => {
        try {
          const result = await parseWorkbook(file);
          if (cancelled) return;
          const names = Object.keys(result.data);
          setData(result.data);
          setSheets(names);
          setActiveSheet(names[0] ?? '');
          setPage(1);
          setLoading(false);
          if (result.truncated) setToastOpen(true);
        } catch {
          if (cancelled) return;
          setLoading(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [open, file]);

  useEffect(() => {
    if (open) return;
    parsedFileRef.current = null;
    const frameId = window.requestAnimationFrame(() => {
      setData({});
      setSheets([]);
      setActiveSheet('');
      setPage(1);
      setToastOpen(false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  const handleTabSelect = (s: string) => {
    setActiveSheet(s);
    setPage(1);
  };

  const currentRows = data[activeSheet] ?? [];
  const totalPages = Math.max(1, Math.ceil(currentRows.length / PER_PAGE));
  const visibleRows = currentRows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalProducts = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  const handleImport = () => {
    const all = Object.values(data)
      .flat()
      .map((r) => ({
        id: r.id,
        name: r.title,
        description: r.description,
        category: r.category,
        stock: r.stock,
        price: r.price,
        status: 'ACTIVO',
        image: r.image,
      })) as Product[];
    onImport(all);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      style={
        {
          '--md-dialog-container-max-block-size': '95vh',
          '--md-dialog-container-max-inline-size': '98vw',
          '--md-dialog-container-min-inline-size': '1250px',
          maxWidth: '1200px',
          maxHeight: '70vh',
        } as React.CSSProperties
      }
    >
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
          gap: '1rem',
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
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Procesando archivo…</p>
          </div>
        ) : (
          <>
            {sheets.length > 0 && (
              <SheetTabs sheets={sheets} active={activeSheet} onSelect={handleTabSelect} />
            )}
            <div
              style={{
                height: 640,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--md-sys-color-surface)',
              }}
            >
              <ImportPreviewTable rows={visibleRows} />
              <PreviewPagination page={page} total={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <div slot="actions">
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={handleImport} disabled={loading || totalProducts === 0}>
          <Icon slot="icon" size={21}>
            upload
          </Icon>
          Importar {totalProducts} productos
        </Button>
      </div>

      <AlertSnackbar
        open={toastOpen}
        description="Agregamos los primeros datos porque fueron más de lo permitido."
        color="warning"
        icon="warning"
        position="bottom-center"
        onClose={() => setToastOpen(false)}
        autoCloseDuration={8000}
      />
    </Dialog>
  );
};
