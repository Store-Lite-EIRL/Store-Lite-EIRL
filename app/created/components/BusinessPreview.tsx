'use client';

import { Button, Icon } from '@/shared/components/ui';
import Image from 'next/image';
import { useState } from 'react';
import type { BusinessData } from '../types';

interface BusinessPreviewProps {
  formData: BusinessData;
  logoPreview: string | null;
}

const PRESET_COLORS = [
  ['#6366f1', '#a855f7', '#ec4899'],
  ['#3b82f6', '#06b6d4', '#10b981'],
  ['#f59e0b', '#ef4444', '#f472b6'],
  ['#8b5cf6', '#6366f1', '#3b82f6'],
  ['#14b8a6', '#0ea5e9', '#6366f1'],
];

const getLuminance = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

import { getSectorIcon } from '@/shared/utils/business';

const tokenizeTaxId = (taxId: string) => {
  const input = taxId || '';
  const length = input.length;

  // Support both 11 and 20 digits
  const targetLength = length > 11 ? 20 : 11;
  const DEFAULT_ZEROS = '00000000000000000000'; // 20 zeros

  if (length === 0) {
    return DEFAULT_ZEROS.substring(0, 11);
  }

  // Typing state: progressive filling with zeros
  if (length < targetLength) {
    return input + DEFAULT_ZEROS.substring(0, targetLength - length);
  }

  // Final tokenized state: starts with x3bet, then mixed-case alphanumerics
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
  let token = 'x3bet';
  for (let i = 0; i < length; i++) {
    const charCode = input.charCodeAt(i);
    // Deterministic mixed-case randomness
    const salt = (i + length) * 13;
    const index = (charCode * 31 + salt) % alphabet.length;
    token += alphabet[index];
  }
  return token;
};

const PreviewHeader = ({ logoPreview, sector }: { logoPreview: string | null; sector: string }) => (
  <div
    style={{
      width: '100%',
      height: '320px',
      position: 'relative',
      borderRadius: '32px',
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    }}
  >
    {logoPreview ? (
      <Image
        src={logoPreview}
        alt="Logo Preview"
        fill
        style={{ objectFit: 'cover' }}
        sizes="200px"
      />
    ) : (
      <Icon size={120} style={{ color: 'rgba(255,255,255,0.45)' }}>
        {getSectorIcon(sector)}
      </Icon>
    )}
  </div>
);

const PreviewMetadata = ({ formData, isDark }: { formData: BusinessData; isDark: boolean }) => (
  <div className="flex-column gap-sm" style={{ padding: '8px 4px' }}>
    {formData.description && (
      <p
        className="body-small"
        style={{
          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
          fontStyle: 'italic',
          borderLeft: `3px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
          paddingLeft: '12px',
          margin: '4px 0 12px 0',
          lineHeight: '1.4',
        }}
      >
        &quot;{formData.description}&quot;
      </p>
    )}

    <div className="flex-row gap-md flex-align-center">
      <Icon
        size={18}
        style={{ color: isDark ? '#FFF' : 'var(--md-sys-color-primary)', opacity: 0.9 }}
      >
        verified_user
      </Icon>
      <span
        className="label-medium"
        style={{
          color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)',
          letterSpacing: '0.8px',
          fontWeight: 600,
          fontFamily: 'monospace',
          fontSize: '13px',
        }}
      >
        RUC: {tokenizeTaxId(formData.taxId)}
      </span>
    </div>
  </div>
);

const PreviewLegalRep = ({
  name,
  role,
  isDark,
}: {
  name: string;
  role: string;
  isDark: boolean;
}) => (
  <div
    className="flex-row gap-md flex-align-center"
    style={{
      padding: '14px 18px',
      borderRadius: '24px',
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'}`,
      marginTop: '4px',
    }}
  >
    <div
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: isDark ? '#FFF' : 'var(--md-sys-color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#000' : 'var(--md-sys-color-on-primary)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Icon size={22}>person</Icon>
    </div>
    <div className="flex-column">
      <span
        className="label-large"
        style={{ fontWeight: 700, color: isDark ? '#FFF' : 'rgba(0,0,0,0.9)' }}
      >
        {name || 'Nombre Representante'}
      </span>
      <span
        className="label-small"
        style={{ opacity: 0.75, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }}
      >
        {role || 'Cargo'}
      </span>
    </div>
  </div>
);

export const BusinessPreview = ({ formData, logoPreview }: BusinessPreviewProps) => {
  const [gradientColors, setGradientColors] = useState(PRESET_COLORS[0]);
  const [isDark, setIsDark] = useState(true);

  const randomizeColors = () => {
    const randomHex = () =>
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
    const newColors = [randomHex(), randomHex(), randomHex()];
    setGradientColors(newColors);
    const avgL = newColors.reduce((acc, c) => acc + getLuminance(c), 0) / 3;
    setIsDark(avgL < 0.65);
  };

  const textColor = isDark ? '#FFF' : '#000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

  const hexToRGBA = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const g0 = hexToRGBA(gradientColors[0], 0.95);
  const g1 = hexToRGBA(gradientColors[1], 0.95);
  const g2 = hexToRGBA(gradientColors[2], 0.95);

  return (
    <div
      className="surface-container"
      style={{
        padding: '20px',
        borderRadius: '44px',
        width: '100%',
        maxWidth: '440px',
        background: `linear-gradient(135deg, ${g0}, ${g1}, ${g2})`,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
        margin: '0 auto',
        position: 'relative',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
      }}
    >
      <Button
        variant="tonal"
        onClick={randomizeColors}
        style={{
          position: 'absolute',
          top: '28px',
          right: '28px',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
          color: textColor,
          backdropFilter: 'blur(12px)',
          zIndex: 30,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Icon size={22} style={{ display: 'block', margin: 'auto' }}>
          palette
        </Icon>
      </Button>

      <PreviewHeader logoPreview={logoPreview} sector={formData.sector} />

      <div className="flex-column gap-md" style={{ padding: '0 10px 10px 10px' }}>
        <div className="flex-column gap-xs">
          <div className="flex-row flex-align-center gap-sm">
            <h2
              className="heading-2"
              style={{
                margin: 0,
                fontWeight: 800,
                color: textColor,
                letterSpacing: '-0.8px',
                fontSize: '28px',
              }}
            >
              {formData.commercialName || 'Empresa'}
            </h2>
            <Icon size={26} style={{ color: isDark ? '#66BB6A' : '#2E7D32' }}>
              verified_user
            </Icon>
          </div>
          <p className="body-large" style={{ color: subTextColor, fontWeight: 600 }}>
            {formData.sector || 'Sector'} • {formData.country || 'País'}
          </p>
        </div>

        <div className="flex-column gap-sm">
          <div className="flex-row gap-md flex-align-center">
            <Icon size={18} style={{ color: textColor, opacity: 0.7 }}>
              location_on
            </Icon>
            <span className="label-medium" style={{ color: subTextColor }}>
              {formData.city || 'Ciudad'}, {formData.address || 'Ubicación'}
            </span>
          </div>
          <div className="flex-row gap-md flex-align-center">
            <Icon size={18} style={{ color: textColor, opacity: 0.7 }}>
              alternate_email
            </Icon>
            <span className="label-medium" style={{ color: subTextColor }}>
              {formData.email || 'contacto@empresa.com'}
            </span>
          </div>
        </div>

        <PreviewMetadata formData={formData} isDark={isDark} />

        <PreviewLegalRep
          name={formData.legalRepName}
          role={formData.legalRepRole}
          isDark={isDark}
        />
      </div>

      <Button
        variant="filled"
        style={{
          position: 'absolute',
          bottom: '-14px',
          right: '-14px',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          minWidth: '60px',
          padding: 0,
          backgroundColor: isDark ? '#FFF' : 'var(--md-sys-color-primary)',
          color: isDark ? '#000' : 'var(--md-sys-color-on-primary)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          zIndex: 40,
        }}
      >
        <Icon size={28}>download</Icon>
      </Button>
    </div>
  );
};
