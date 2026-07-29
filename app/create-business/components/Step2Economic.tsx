'use client';

import { Select, SelectOption, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { getFieldValue } from '@/shared/utils/domElements';
import { BUSINESS_SECTORS } from '../constants';
import type { StepProps } from '../types';

export default function Step2Economic({ formData, onChange, errors, isRucVerified }: StepProps) {
  return (
    <>
      <Select
        label="Sector"
        outlined
        style={{ width: '100%' }}
        value={formData.sector}
        onChange={(e: MaterialSelectEvent) => {
          onChange('sector', getMaterialSelectValue(e));
        }}
        error={!!errors.sector}
        errorText={errors.sector}
      >
        {BUSINESS_SECTORS.map((s) => (
          <SelectOption key={s} value={s} selected={formData.sector === s}>
            {s}
          </SelectOption>
        ))}
      </Select>

      <TextField
        label="Descripción de la Empresa"
        placeholder="Describe brevemente lo que hace tu empresa..."
        variant="outlined"
        type="textarea"
        rows={4}
        style={{ width: '100%' }}
        value={formData.description}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('description', getFieldValue(e));
        }}
        maxLength={150}
        supportingText={`${formData.description.length}/150 caracteres`}
        error={!!errors.description}
        errorText={errors.description}
      />
    </>
  );
}
