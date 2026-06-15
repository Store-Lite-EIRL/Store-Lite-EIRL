'use client';

import { TextField } from '@/shared/components/ui/inputs/TextField';
import React from 'react';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from './types';

interface BasicInfoSectionProps {
  name: string;
  description: string;
  brand: string;
  nameError?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBrandChange: (value: string) => void;
}

export const BasicInfoSection = ({
  name,
  description,
  brand,
  nameError,
  onNameChange,
  onDescriptionChange,
  onBrandChange,
}: BasicInfoSectionProps) => {
  return (
    <div className="form-section">
      <p className="form-section-title">Información General</p>
      <div className="form-fields">
        <div>
          <TextField
            label="Nombre del producto *"
            variant="outlined"
            value={name}
            error={!!nameError}
            errorText={nameError}
            maxLength={MAX_NAME_LENGTH}
            supportingText={!nameError ? 'Ej: Camiseta de Algodón Blanca' : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <TextField
            label="Descripción (opcional)"
            variant="outlined"
            type="textarea"
            rows={3}
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onDescriptionChange(e.target.value)
            }
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <TextField
            label="Marca (Brand)"
            variant="outlined"
            value={brand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBrandChange(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};
