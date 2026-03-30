'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import React from 'react';
import { MAX_IMAGES } from './types';

interface ImageUploadSectionProps {
  images: string[];
  error?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemove: (index: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploadSection = ({
  images,
  error,
  fileInputRef,
  onRemove,
  onChange,
}: ImageUploadSectionProps) => (
  <div className="form-section">
    <p className="form-section-title">
      Imágenes del Producto
      <span className="section-counter">
        {images.length}/{MAX_IMAGES}
      </span>
    </p>

    <div className="images-grid">
      {images.map((src, idx) => (
        <div key={idx} className="image-thumb-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Imagen ${idx + 1}`} className="image-thumb" />
          <button
            type="button"
            className="remove-image-btn"
            onClick={() => onRemove(idx)}
            aria-label="Eliminar imagen"
          >
            <Icon size={21}>close</Icon>
          </button>
        </div>
      ))}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          className="image-upload-slot"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Agregar imagen"
        >
          <Icon>add_photo_alternate</Icon>
          <span>Agregar</span>
        </button>
      )}
    </div>

    <p className="image-hint">PNG, JPG o WEBP · Máx. 5MB · Hasta {MAX_IMAGES} imágenes</p>
    {error && <p className="field-error">{error}</p>}

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden-file-input"
      aria-label="Subir imágenes del producto"
      onChange={onChange}
    />
  </div>
);
