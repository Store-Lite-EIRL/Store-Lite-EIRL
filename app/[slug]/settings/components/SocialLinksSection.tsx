'use client';

import type { Permission } from '@/lib/permissions/definitions';
import { AlertSnackbar, Button, Card, Icon, TextField } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import React, { useCallback, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { updateBusinessData } from '../../../actions/business';
import { updateSocialLinks, type SocialLinksInput } from '../actions';
import { SectionHeader, type SettingsBusiness } from '../constants';
import { useOtpVerification } from '../hooks/useOtpVerification';
import { useSnackbarFeedback } from '../hooks/useSettingsState';
import styles from '../settings.module.css';

interface SocialLinksSectionProps {
  business: SettingsBusiness;
  isOwner: boolean;
  permissions: Permission[];
  /** WhatsApp number managed separately via updateBusinessData */
  whatsappNumber: string;
  onWhatsAppSaved: () => void;
}

const PLATFORMS = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    icon: 'camera_alt',
    placeholder: 'https://instagram.com/tu-negocio',
    allowedDomains: ['instagram.com', 'instagr.am'],
  },
  {
    key: 'facebook' as const,
    label: 'Facebook',
    icon: 'tag',
    placeholder: 'https://facebook.com/tu-negocio',
    allowedDomains: ['facebook.com', 'fb.com', 'fb.watch'],
  },
  {
    key: 'twitter' as const,
    label: 'X / Twitter',
    icon: 'close',
    placeholder: 'https://x.com/tu-negocio',
    allowedDomains: ['x.com', 'twitter.com'],
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    icon: 'music_note',
    placeholder: 'https://tiktok.com/@tu-negocio',
    allowedDomains: ['tiktok.com', 'vm.tiktok.com'],
  },
  {
    key: 'youtube' as const,
    label: 'YouTube',
    icon: 'play_circle',
    placeholder: 'https://youtube.com/@tu-negocio',
    allowedDomains: ['youtube.com', 'youtu.be'],
  },
];

function validatePhone(value: string): string | null {
  if (!value || value.trim().length === 0) return null;
  const cleaned = value.replace(/[\s-]/g, '');
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return 'Número no válido (7-15 dígitos, podés usar + al inicio).';
  }
  return null;
}

function persistWhatsApp(businessId: string, slug: string, number: string) {
  return updateBusinessData(businessId, slug, { whatsappNumber: number });
}

export function SocialLinksSection({
  business,
  isOwner,
  permissions,
  whatsappNumber,
  onWhatsAppSaved,
}: SocialLinksSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { feedback, showSuccess, showError, close } = useSnackbarFeedback();

  const initialForm: SocialLinksInput = {
    instagram: business.socialLinks?.instagram || '',
    facebook: business.socialLinks?.facebook || '',
    twitter: business.socialLinks?.twitter || '',
    tiktok: business.socialLinks?.tiktok || '',
    youtube: business.socialLinks?.youtube || '',
  };

  const [formData, setFormData] = useState<SocialLinksInput>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const initialRef = useRef(initialForm);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialRef.current);
  const canSave = isOwner || permissions.includes('business.edit');

  // WhatsApp state
  const [waValue, setWaValue] = useState(whatsappNumber);
  const initialWaRef = useRef(whatsappNumber);
  const hasWaChanges = waValue !== initialWaRef.current;
  const [waError, setWaError] = useState<string | null>(null);

  /** Called after OTP is successfully verified — persists the number to DB */
  const onOtpVerified = useCallback(async () => {
    const normalized = waValue.trim().replace(/[^\d+]/g, '');
    const res = await persistWhatsApp(business.id, business.slug, normalized);
    if (res.error) {
      showError(res.error);
    } else {
      initialWaRef.current = waValue;
      showSuccess('WhatsApp actualizado correctamente.');
      onWhatsAppSaved();
      router.refresh();
    }
  }, [waValue, business.id, business.slug, showError, showSuccess, onWhatsAppSaved, router]);

  const otp = useOtpVerification({ onVerified: onOtpVerified });

  const validateField = (platform: string, value: string): string | null => {
    if (!value || value.trim().length === 0) return null;
    const def = PLATFORMS.find((p) => p.key === platform);
    if (!def) return null;

    let href = value.trim();
    if (!/^https?:\/\//i.test(href)) href = 'https://' + href;

    try {
      const url = new URL(href);
      const host = url.hostname.replace(/^www\./, '');
      const ok = def.allowedDomains.some((d) => host === d || host.endsWith('.' + d));
      return ok ? null : `No es un enlace válido de ${def.label}.`;
    } catch {
      return 'URL no válida.';
    }
  };

  const handleChange = (key: keyof SocialLinksInput, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const err = validateField(key, value);
      if (err) return { ...prev, [key]: err };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removing error for this key
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      const err = validateField(key, value || '');
      if (err) errors[key] = err;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const res = await updateSocialLinks(business.id, formData);
      if (res.success) {
        initialRef.current = { ...formData };
        showSuccess(res.message || 'Redes sociales actualizadas correctamente.');
        router.refresh();
      } else {
        showError(res.error || 'Error al guardar.');
      }
    });
  };

  /** Validate phone → send OTP → open modal */
  const handleSaveWhatsApp = async () => {
    const err = validatePhone(waValue);
    setWaError(err);
    if (err) return;

    const normalized = waValue.trim().replace(/[^\d+]/g, '');
    await otp.requestOtp(normalized);
  };

  const handleWhatsAppChange = (value: string) => {
    setWaValue(value);
    setWaError(validatePhone(value));
  };

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Redes Sociales"
        subtitle="Agregá los links de tus redes para que tus clientes te encuentren en otras plataformas."
      />

      <Card variant="outlined" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {PLATFORMS.map((platform) => (
            <TextField
              key={platform.key}
              label={platform.label}
              value={formData[platform.key] || ''}
              onInput={(e: React.FormEvent<HTMLInputElement>) =>
                handleChange(platform.key, e.currentTarget.value)
              }
              placeholder={platform.placeholder}
              supportingText={platform.placeholder}
              error={!!fieldErrors[platform.key]}
              errorText={fieldErrors[platform.key]}
              disabled={!canSave}
            >
              <Icon slot="leading-icon">{platform.icon}</Icon>
            </TextField>
          ))}

          {/* ─── WhatsApp (separate prop) ─────────────── */}
          <TextField
            label="WhatsApp"
            value={waValue}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleWhatsAppChange(e.currentTarget.value)
            }
            placeholder="+51 999 123 456"
            supportingText="Número con código de país. Ej: +51 999 123 456"
            error={!!waError}
            errorText={waError || ''}
            disabled={!canSave}
          >
            <svg
              slot="leading-icon"
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </TextField>
        </div>

        {canSave && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
            }}
          >
            {hasWaChanges && (
              <Button
                variant="outlined"
                onClick={handleSaveWhatsApp}
                disabled={otp.isSending || !!waError}
              >
                {otp.isSending ? 'Enviando código...' : 'Guardar WhatsApp'}
              </Button>
            )}
            <Button variant="filled" onClick={handleSave} disabled={!hasChanges || isPending}>
              {isPending ? 'Guardando...' : 'Guardar Redes'}
            </Button>
          </div>
        )}
      </Card>

      {/* ── OTP Verification Modal ──────────────────────────────── */}
      {otp.showModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.32)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                padding: '24px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Verificar WhatsApp</h2>
              <p
                style={{
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.875rem',
                  margin: 0,
                }}
              >
                Ingresa el código de 6 dígitos que enviamos a tu WhatsApp
                <br />
                <strong>{otp.identifier}</strong>
              </p>

              {/* 6-digit OTP inputs */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  margin: '16px 0',
                }}
              >
                {otp.digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otp.inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => otp.handleInput(i, e.target.value)}
                    onKeyDown={(e) => otp.handleKeyDown(i, e)}
                    onPaste={i === 0 ? otp.handlePaste : undefined}
                    autoComplete="one-time-code"
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      border: `2px solid ${
                        otp.error ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline)'
                      }`,
                      borderRadius: '12px',
                      outline: 'none',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-on-surface)',
                      caretColor: 'var(--md-sys-color-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--md-sys-color-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = otp.error
                        ? 'var(--md-sys-color-error)'
                        : 'var(--md-sys-color-outline)';
                    }}
                  />
                ))}
              </div>

              {/* Error display */}
              {otp.error && (
                <div
                  style={{
                    color: 'var(--md-sys-color-error)',
                    fontSize: '0.875rem',
                    padding: '8px 12px',
                    backgroundColor: 'var(--md-sys-color-error-container)',
                    borderRadius: '8px',
                  }}
                >
                  {otp.error}
                </div>
              )}

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Button variant="text" onClick={otp.closeModal}>
                  Cancelar
                </Button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="text" onClick={otp.resendOtp} disabled={otp.isSending}>
                    Reenviar código
                  </Button>

                  <Button
                    variant="filled"
                    onClick={otp.verifyOtp}
                    disabled={otp.digits.join('').length !== 6 || otp.isVerifying}
                  >
                    {otp.isVerifying ? 'Validando...' : 'Validar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={close}
      />
    </div>
  );
}
