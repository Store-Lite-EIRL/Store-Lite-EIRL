'use client';

import { Button, Icon, IconButton, Select, SelectOption, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { useRef } from 'react';
import { BUSINESS_SECTORS, CARGO_OPTIONS, SOUTH_AMERICAN_COUNTRIES } from '../constants';
import type { BusinessData, FormErrors } from '../types';

interface StepProps {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  errors: FormErrors;
}

const getFieldValue = (event: React.FormEvent<HTMLElement>) =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;

export const Step1General = ({
  formData,
  onChange,
  errors,
  onFileChange,
}: StepProps & { onFileChange?: (file: File | null) => void }) => {
  const logoUploadRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="flex-responsive-row gap-md">
        <Select
          label="Tipo de Persona"
          outlined
          style={{ flex: 1 }}
          value={formData.personType}
          onChange={(e: MaterialSelectEvent) => {
            onChange('personType', getMaterialSelectValue(e) as 'natural' | 'juridica');
          }}
        >
          <SelectOption value="natural" selected={formData.personType === 'natural'}>
            Persona Natural
          </SelectOption>
          <SelectOption value="juridica" selected={formData.personType === 'juridica'}>
            Persona Jurídica
          </SelectOption>
        </Select>

        <Select
          label="País"
          outlined
          style={{ flex: 1 }}
          value={formData.country}
          onChange={(e: MaterialSelectEvent) => {
            onChange('country', getMaterialSelectValue(e));
          }}
        >
          {SOUTH_AMERICAN_COUNTRIES.map((c) => (
            <SelectOption key={c.name} value={c.name} selected={formData.country === c.name}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      <TextField
        label="RUC / NIT"
        placeholder="12345678901"
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.taxId}
        maxLength={formData.personType === 'natural' ? 11 : 20}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          const value = getFieldValue(e).replace(/\D/g, ''); // Ensure only numbers
          onChange('taxId', value);
        }}
        error={!!errors.taxId}
        errorText={errors.taxId}
      />

      <TextField
        label="Nombre Comercial"
        placeholder="Mi Empresa S.A.C."
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.commercialName}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('commercialName', getFieldValue(e));
        }}
        error={!!errors.commercialName}
        errorText={errors.commercialName}
      />

      <div className="flex-column gap-sm">
        <label className="body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Logo de la Empresa (Opcional)
        </label>
        <div className="flex-row flex-align-center gap-md">
          <div style={{ position: 'relative' }}>
            <Button
              variant="tonal"
              style={{
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => logoUploadRef.current?.click()}
            >
              Subir Logo
              <Icon slot="icon">upload</Icon>
            </Button>
            <input
              id="logo-upload"
              ref={logoUploadRef}
              type="file"
              accept="image/*"
              title="Subir logo de la empresa"
              placeholder="Seleccionar archivo"
              style={{ display: 'none' }}
              onChange={(e) => {
                onFileChange?.(e.target.files?.[0] || null);
              }}
            />
          </div>

          {formData.logo && (
            <div
              className="flex-row flex-align-center gap-sm surface-container-low"
              style={{
                paddingLeft: 20,
                borderRadius: '20px',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <span
                className="label-medium"
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formData.logo.name}
              </span>
              <IconButton onClick={() => onFileChange?.(null)} style={{ padding: '4px' }}>
                <Icon size={18}>close</Icon>
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const Step2Economic = ({ formData, onChange, errors }: StepProps) => (
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

export const Step3Contact = ({ formData, onChange, errors }: StepProps) => (
  <>
    <TextField
      label="Ciudad"
      placeholder="Lima"
      variant="outlined"
      style={{ width: '100%' }}
      value={formData.city}
      onInput={(e: React.FormEvent<HTMLElement>) => {
        onChange('city', getFieldValue(e));
      }}
      error={!!errors.city}
      errorText={errors.city}
    />

    <TextField
      label="Dirección"
      placeholder="Av. Principal 123"
      variant="outlined"
      style={{ width: '100%' }}
      value={formData.address}
      onInput={(e: React.FormEvent<HTMLElement>) => {
        onChange('address', getFieldValue(e));
      }}
      error={!!errors.address}
      errorText={errors.address}
    >
      <Icon slot="trailing-icon">location_on</Icon>
    </TextField>

    <div className="flex-responsive-row gap-md">
      <TextField
        label="Teléfono"
        placeholder="999 999 999"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.phone}
        prefixText={formData.countryPrefix}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('phone', getFieldValue(e));
        }}
        error={!!errors.phone}
        errorText={errors.phone}
      >
        <Icon slot="trailing-icon">phone</Icon>
      </TextField>

      <TextField
        label="Email"
        placeholder="contacto@empresa.com"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.email}
        type="email"
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('email', getFieldValue(e));
        }}
        error={!!errors.email}
        errorText={errors.email}
      >
        <Icon slot="trailing-icon">mail</Icon>
      </TextField>
    </div>
  </>
);

export const Step4Legal = ({ formData, onChange, errors }: StepProps) => (
  <>
    <TextField
      label="Nombre del Representante Legal"
      placeholder="Nombre Completo"
      variant="outlined"
      style={{ width: '100%' }}
      value={formData.legalRepName}
      onInput={(e: React.FormEvent<HTMLElement>) => {
        onChange('legalRepName', getFieldValue(e));
      }}
      error={!!errors.legalRepName}
      errorText={errors.legalRepName}
    />

    <div className="flex-column gap-sm">
      <Select
        label="Cargo"
        outlined
        style={{ width: '100%' }}
        value={CARGO_OPTIONS.includes(formData.legalRepRole) ? formData.legalRepRole : 'Otro'}
        onChange={(e: MaterialSelectEvent) => {
          const value = getMaterialSelectValue(e);
          if (value !== 'Otro') {
            onChange('legalRepRole', value);
          }
        }}
      >
        {CARGO_OPTIONS.map((o) => (
          <SelectOption
            key={o}
            value={o}
            selected={
              formData.legalRepRole === o ||
              (o === 'Otro' && !CARGO_OPTIONS.includes(formData.legalRepRole))
            }
          >
            {o}
          </SelectOption>
        ))}
      </Select>

      {(!CARGO_OPTIONS.includes(formData.legalRepRole) || formData.legalRepRole === 'Otro') && (
        <TextField
          label="Especifique Cargo"
          placeholder="Ej. Apoderado, Socio"
          variant="outlined"
          style={{ width: '100%' }}
          value={formData.legalRepRole === 'Otro' ? '' : formData.legalRepRole}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('legalRepRole', getFieldValue(e));
          }}
          error={!!errors.legalRepRole}
          errorText={errors.legalRepRole}
        />
      )}
    </div>

    <div className="flex-responsive-row gap-md">
      <TextField
        label="Celular de contacto"
        placeholder="999 999 999"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.legalRepPhone}
        prefixText={formData.countryPrefix}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('legalRepPhone', getFieldValue(e));
        }}
        error={!!errors.legalRepPhone}
        errorText={errors.legalRepPhone}
      >
        <Icon slot="trailing-icon">smartphone</Icon>
      </TextField>

      <TextField
        label="Email de contacto"
        placeholder="gerente@empresa.com"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.legalRepEmail}
        type="email"
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('legalRepEmail', getFieldValue(e));
        }}
        error={!!errors.legalRepEmail}
        errorText={errors.legalRepEmail}
      >
        <Icon slot="trailing-icon">alternate_email</Icon>
      </TextField>
    </div>
  </>
);
