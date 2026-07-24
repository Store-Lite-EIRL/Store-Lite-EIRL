'use client';

import { Button, Icon } from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import React, { useCallback, useRef, useState } from 'react';
import { DropZone } from './import/DropZone';
import { FilePreviewCard } from './import/FilePreviewCard';
import { buildFileInfo, type FileInfo } from './import/FileValidation';

interface ImportSourceModalProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}

export const ImportSourceModal = ({ open, onClose, onFileSelected }: ImportSourceModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleReset = () => {
    setFileInfo(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = (file: File) => {
    const info = buildFileInfo(file);
    setFileInfo(info);
    if (info.status === 'valid') setPendingFile(file);
    else setPendingFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleConfirm = () => {
    if (!pendingFile) return;
    const file = pendingFile;
    handleReset();
    onFileSelected(file);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      type="alert"
      style={
        {
          '--md-dialog-container-max-inline-size': '520px',
          '--md-dialog-container-min-inline-size': 'min(520px, 94vw)',
        } as React.CSSProperties
      }
    >
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon>upload_file</Icon>
        Importar fuente de datos
      </div>

      <div
        slot="content"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0 0' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            paddingTop: 10,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 100,
              border: '1px solid #1d6f4230',
              background: '#1d6f4210',
              color: '#1d6f42',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <Icon style={{ fontSize: 20 }}>table_chart</Icon>
            Excel (.xlsx / .xls)
          </div>
        </div>

        <DropZone
          dragOver={dragOver}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.6rem 0 0',
              borderTop: '1px solid var(--md-sys-color-outline-variant)',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <Icon style={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }}>info</Icon>
              Requisitos del archivo
            </div>
            <div
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                lineHeight: 1.6,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              <span>
                <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Columnas necesarias:
                </strong>{' '}
                Imagen, Producto, Descripción, Categoría, Marca, Stock, Precio
              </span>
              <span>
                Solo se importará la{' '}
                <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>primera hoja</strong>{' '}
                del Excel
              </span>
            </div>
          </div>
        </DropZone>
        <input
          title="Seleccionar archivo"
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {fileInfo && <FilePreviewCard info={fileInfo} onReset={handleReset} />}
      </div>

      <div slot="actions">
        <Button variant="text" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={handleConfirm} disabled={!pendingFile}>
          <Icon slot="icon" size={23}>
            arrow_forward
          </Icon>
          Continuar
        </Button>
      </div>
    </Dialog>
  );
};
