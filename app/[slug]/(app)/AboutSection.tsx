'use client';

import type { StorefrontColorScheme, StorefrontTheme } from '@/core/storefront';
import { createDefaultStorefrontTheme } from '@/core/storefront';
import { BusinessPreviewCard } from '@/shared/components/business/BusinessPreviewCard';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import type { Business } from '@/types/business';
import styles from './AboutSection.module.css';
import { LocationMap } from './components/LocationMap';

interface AboutSectionProps {
  business: Business;
  previewCardTheme?: StorefrontTheme;
  storefrontTheme?: StorefrontTheme;
  storefrontColorScheme?: StorefrontColorScheme;
}

/** Formatea una fecha ISO a "Mes YYYY" en español */
function formatMemberSince(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

/** Mapea el tipo de persona a texto amigable */
function getPersonTypeLabel(personType: string | null | undefined): string {
  switch (personType) {
    case 'natural':
      return 'Persona Natural con Negocio';
    case 'juridica':
      return 'Persona Jurídica';
    default:
      return '—';
  }
}

/** Retorna la configuración del badge de verificación */
function getVerificationConfig(
  status: string | null | undefined,
): { className: string; icon: string; title: string; subtitle: string } | null {
  switch (status) {
    case 'verified':
      return {
        className: styles.verified,
        icon: 'verified',
        title: 'Verificado',
        subtitle: 'Identidad confirmada por Store Lite',
      };
    case 'pending':
      return {
        className: styles.pending,
        icon: 'hourglass_top',
        title: 'En verificación',
        subtitle: 'Documentos en proceso de revisión',
      };
    case 'unverified':
      return null;
    case 'rejected':
      return null;
    default:
      return null;
  }
}

/** Componente interno: card de sección reutilizable */
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <Icon size={20}>{icon}</Icon>
        </div>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <hr className={styles.sectionDivider} />
      {children}
    </div>
  );
}

/** Componente interno: fila de detalle con ícono */
function DetailRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.detailRow}>
      <Icon className={styles.detailIcon} size={20}>
        {icon}
      </Icon>
      <div className={styles.detailContent}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{children}</span>
      </div>
    </div>
  );
}

/** Sección: Sobre Nosotros */
function AboutDescriptionSection({ description }: { description: string | null }) {
  return (
    <SectionCard icon="store" title="Sobre Nosotros">
      <p className={styles.description}>{description || 'No hay descripción disponible.'}</p>
    </SectionCard>
  );
}

/** Sección: Datos de la Empresa */
function BusinessDataSection({ business }: { business: Business }) {
  return (
    <SectionCard icon="badge" title="Datos de la Empresa">
      <div className={styles.detailColumns}>
        <DetailRow icon="description" label="Tipo">
          {getPersonTypeLabel(business.personType)}
        </DetailRow>
        <DetailRow icon="category" label="Sector">
          {business.storeType || '—'}
        </DetailRow>
        <DetailRow icon="calendar_month" label="Miembro desde">
          {formatMemberSince(business.createdAt)}
        </DetailRow>
        <DetailRow icon="public" label="País">
          {business.country || '—'}
        </DetailRow>
      </div>
    </SectionCard>
  );
}

/** Sección: Contacto y Ubicación */
function ContactSection({ business }: { business: Business }) {
  if (!business.address && !business.email && !business.whatsappNumber) return null;

  return (
    <SectionCard icon="contact_mail" title="Contacto y Ubicación">
      <div className={styles.detailsGrid}>
        {business.address && (
          <DetailRow icon="location_on" label="Dirección">
            {business.address}
          </DetailRow>
        )}
        {business.email && (
          <DetailRow icon="mail" label="Correo Electrónico">
            <a
              href={`mailto:${business.email}`}
              className={styles.contactLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {business.email}
            </a>
          </DetailRow>
        )}
        {business.whatsappNumber && (
          <DetailRow icon="chat" label="WhatsApp">
            <a
              href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
              className={styles.contactLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {business.whatsappNumber}
            </a>
          </DetailRow>
        )}
      </div>
    </SectionCard>
  );
}

/** Sección: Verificación */
function VerificationSection({
  config,
}: {
  config: NonNullable<ReturnType<typeof getVerificationConfig>>;
}) {
  return (
    <SectionCard icon="verified_user" title="Verificación">
      <div className={`${styles.verificationBadge} ${config.className}`}>
        <Icon className={styles.verificationIcon} size={22}>
          {config.icon}
        </Icon>
        <div className={styles.verificationText}>
          <span className={styles.verificationTitle}>{config.title}</span>
          <span className={styles.verificationSubtitle}>{config.subtitle}</span>
        </div>
      </div>
    </SectionCard>
  );
}

export default function AboutSection({
  business,
  previewCardTheme,
  storefrontTheme,
  storefrontColorScheme,
}: AboutSectionProps) {
  const verification = getVerificationConfig(business.verificationStatus);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.contentColumn}>
          <AboutDescriptionSection description={business.description} />
          <BusinessDataSection business={business} />
          <ContactSection business={business} />
          {verification && <VerificationSection config={verification} />}
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
          />

          <LocationMap
            departamento={business.departamento}
            provincia={business.provincia}
            distrito={business.distrito}
            city={business.city}
            address={business.address}
          />
        </div>
      </div>
    </div>
  );
}
