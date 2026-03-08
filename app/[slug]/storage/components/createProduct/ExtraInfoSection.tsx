'use client';

import { TextField } from '@/shared/components/ui/inputs/TextField';
import React from 'react';

interface ExtraInfoSectionProps {
  tags: string[];
  shippingInfo: string;
  onTagsChange: (tags: string[]) => void;
  onShippingInfoChange: (value: string) => void;
}

export const ExtraInfoSection = ({
  tags,
  shippingInfo,
  onTagsChange,
  onShippingInfoChange,
}: ExtraInfoSectionProps) => {
  const handleTagChange = (index: number, value: string) => {
    const newTags = [...tags];
    // Ensure we have at least 3 elements
    while (newTags.length < 3) newTags.push('');
    if (index >= 0 && index < 3) {
      newTags[index] = value.slice(0, 15);
    }
    onTagsChange(newTags);
  };

  const tagValues = [tags[0] || '', tags[1] || '', tags[2] || ''];

  return (
    <div className="form-section">
      <p className="form-section-title">Información Adicional</p>
      <div className="form-fields">
        <div>
          <p
            className="form-field-label"
            style={{
              marginBottom: '8px',
              fontSize: '0.875rem',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Etiquetas (Máx. 3 palabras, 15 carácteres c/u)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <TextField
              label="Tag 1"
              variant="outlined"
              value={tagValues[0]}
              maxLength={15}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTagChange(0, e.target.value)
              }
            />
            <TextField
              label="Tag 2"
              variant="outlined"
              value={tagValues[1]}
              maxLength={15}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTagChange(1, e.target.value)
              }
            />
            <TextField
              label="Tag 3"
              variant="outlined"
              value={tagValues[2]}
              maxLength={15}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTagChange(2, e.target.value)
              }
            />
          </div>
        </div>
        <div>
          <TextField
            label="Información de envío"
            variant="outlined"
            value={shippingInfo}
            maxLength={30}
            supportingText="Ej: Llega en 24-48 horas"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onShippingInfoChange(e.target.value)
            }
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};
