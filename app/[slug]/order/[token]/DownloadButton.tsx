'use client';

import { Icon } from '@/shared/components/ui';
import React from 'react';

interface DownloadButtonProps {
  imageUrl: string;
  fileName: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DownloadButton({
  imageUrl,
  fileName,
  className,
  children,
}: DownloadButtonProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: abrir en nueva pestaña
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={className}
      style={{
        cursor: 'pointer',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {children || (
        <>
          <Icon size={18}>download</Icon>
          <span>DESCARGAR</span>
        </>
      )}
    </button>
  );
}
