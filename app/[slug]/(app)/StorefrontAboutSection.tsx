'use client';

import type { StorefrontColorScheme, StorefrontTheme } from '@/core/storefront';
import { createDefaultStorefrontTheme } from '@/core/storefront';
import {
  BusinessPreviewCard,
  SocialLinksRow,
} from '@/shared/components/business/BusinessPreviewCard';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import type { Business } from '@/types/business';
import styles from './storefrontAbout.module.css';

// ─── Pure business-logic helpers (unit-tested) ────────────────────────────

/** Mapea el tipo de persona a texto amigable (copiado de AboutSection.tsx). */
export function getPersonTypeLabel(personType: string | null | undefined): string {
  switch (personType) {
    case 'natural':
      return 'Persona Natural con Negocio';
    case 'juridica':
      return 'Persona Jurídica';
    default:
      return '—';
  }
}

export type VerificationTone = 'verified' | 'pending' | 'unverified' | 'rejected';

export interface VerificationConfig {
  label: string;
  icon: string;
  tone: VerificationTone;
}

/**
 * Traduce cualquier estado de verificación a un badge real (design D3, spec R2).
 * Valores desconocidos/nulos caen a "Sin verificar" — el estilo "Verificado"
 * nunca se muestra para otro estado.
 */
export function getVerificationConfig(status: string | null | undefined): VerificationConfig {
  switch (status) {
    case 'verified':
      return { label: 'Verificado', icon: 'verified', tone: 'verified' };
    case 'pending':
      return { label: 'En verificación', icon: 'hourglass_top', tone: 'pending' };
    case 'rejected':
      return { label: 'No verificado', icon: 'cancel', tone: 'rejected' };
    default:
      return { label: 'Sin verificar', icon: 'info', tone: 'unverified' };
  }
}

// ─── Detail rows (each handles its own null-state) ─────────────────────────

function DireccionRow({ address }: { address: string | null }) {
  if (!address) return null;
  return (
    <div className={styles.detailItem}>
      <strong>Dirección:</strong>
      <span>{address}</span>
    </div>
  );
}

function TipoRow({ value }: { value: string }) {
  if (!value) return null;
  return (
    <div className={styles.detailItem}>
      <strong>Tipo:</strong>
      <span>{value}</span>
    </div>
  );
}

function CorreoRow({ email }: { email: string | null }) {
  if (!email) return null;
  return (
    <div className={styles.detailItem}>
      <strong>Correo:</strong>
      <a
        className={styles.contactLink}
        href={`mailto:${email}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Enviar correo a ${email}`}
      >
        {email}
      </a>
    </div>
  );
}

function WhatsAppRow({ phoneNumber, phoneDigits }: { phoneNumber: string; phoneDigits: string }) {
  if (!phoneDigits) return null;
  return (
    <div className={styles.detailItem}>
      <strong>WhatsApp:</strong>
      <a
        className={styles.contactLink}
        href={`https://wa.me/${phoneDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp al ${phoneNumber}`}
      >
        {phoneNumber}
      </a>
    </div>
  );
}

function VerificationBadgeRow({ verification }: { verification: VerificationConfig }) {
  return (
    <div className={`${styles.verificationBadge} ${styles[verification.tone]}`}>
      <Icon className={styles.verificationIcon} size={18}>
        {verification.icon}
      </Icon>
      <span className={styles.verificationTitle}>{verification.label}</span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────

interface StorefrontAboutSectionProps {
  business: Business;
  storefrontTheme: StorefrontTheme | null | undefined;
  previewCardTheme: StorefrontTheme | null | undefined;
  storefrontColorScheme?: StorefrontColorScheme;
}

/** Sección "Nosotros" del storefront (público). */
export function StorefrontAboutSection({
  business,
  storefrontTheme,
  previewCardTheme,
  storefrontColorScheme,
}: StorefrontAboutSectionProps) {
  const verification = getVerificationConfig(business.verificationStatus);
  const phoneNumber = business.whatsappNumber ?? business.legalRepPhone ?? '';
  const phoneDigits = phoneNumber.replace(/\D/g, '');
  const personTypeLabel = business.personType ? getPersonTypeLabel(business.personType) : '';
  const typeValue = [personTypeLabel, business.storeType].filter(Boolean).join(' • ');

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.contentColumn}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Sobre nosotros</h2>

            {business.description && <p className={styles.description}>{business.description}</p>}

            <div className={styles.detailsGrid}>
              <DireccionRow address={business.address} />
              <TipoRow value={typeValue} />
              <CorreoRow email={business.email} />
              <WhatsAppRow phoneNumber={phoneNumber} phoneDigits={phoneDigits} />
            </div>

            <VerificationBadgeRow verification={verification} />

            <div style={{ marginTop: '1rem' }}>
              <SocialLinksRow links={business.socialLinks ?? {}} isDark={false} />
            </div>
          </div>
        </div>

        <div className={styles.cardColumn}>
          <BusinessPreviewCard
            commercialName={business.name}
            sector={business.storeType || ''}
            country={business.country || ''}
            city={business.city || ''}
            address={business.address || ''}
            email={business.email || ''}
            description={business.description || ''}
            taxId={business.taxId || ''}
            legalRepName={business.legalRepName || ''}
            legalRepRole={business.legalRepRole || ''}
            logoPreview={business.logoUrl}
            storefrontTheme={previewCardTheme || storefrontTheme || createDefaultStorefrontTheme()}
            colorScheme={storefrontColorScheme}
            showDownloadButton={false}
            socialLinks={business.socialLinks ?? {}}
            whatsappNumber={business.whatsappNumber ?? undefined}
            legalRepPhone={business.legalRepPhone ?? undefined}
            verificationStatus={business.verificationStatus ?? undefined}
            coverImageUrl={business.coverImageUrl ?? null}
            storeType={business.storeType ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
