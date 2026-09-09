/**
 * Public seller contact section for the product detail page.
 *
 * Compliance (Peruvian law):
 * - Ley 29733: the legal representative NAME and ROLE are unnecessary personal
 *   data on a public surface — they are never accepted here and never rendered.
 * - DL 1524: the real RUC (taxId) is displayed when present; no tokenized
 *   pseudo-hash fallback is ever invented.
 *
 * Contact channels stay public: the representative's email/phone is kept only
 * as an ADDITIONAL contact channel (deduplicated against the business contact),
 * mirroring the BusinessPreviewCard wa.me fallback policy (R3).
 */
import { Icon } from '@/shared/components/ui/data-display/Icon';
import styles from './ProductDetail.module.css';

/** Minimal business shape the public seller block needs. */
export interface SellerContactBusiness {
  name: string;
  taxId?: string | null;
  email?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  legalRepEmail?: string | null;
  legalRepPhone?: string | null;
}

/** Public contact data derived for the seller block — carries no rep identity. */
export interface SellerContactInfo {
  businessName: string;
  taxId?: string;
  email?: string;
  whatsappNumber?: string;
  waLink?: string;
  address?: string;
  /** Rep email kept ONLY when it differs from the business email. */
  additionalEmail?: string;
  /** Rep phone kept ONLY when it differs from the business WhatsApp. */
  additionalPhone?: string;
  additionalWaLink?: string;
}

const toWaNumber = (phone: string) => phone.replace(/\D/g, '');

export function buildSellerContactInfo(business: SellerContactBusiness): SellerContactInfo {
  const email = business.email || undefined;
  const whatsappNumber = business.whatsappNumber || undefined;

  const repEmail = business.legalRepEmail || undefined;
  const repPhone = business.legalRepPhone || undefined;

  const additionalEmail =
    repEmail && email && repEmail.toLowerCase() === email.toLowerCase() ? undefined : repEmail;

  const additionalPhone =
    repPhone && whatsappNumber && toWaNumber(repPhone) === toWaNumber(whatsappNumber)
      ? undefined
      : repPhone;

  return {
    businessName: business.name,
    taxId: business.taxId || undefined,
    email,
    whatsappNumber,
    waLink: whatsappNumber ? `https://wa.me/${toWaNumber(whatsappNumber)}` : undefined,
    address: business.address || undefined,
    additionalEmail,
    additionalPhone,
    additionalWaLink: additionalPhone ? `https://wa.me/${toWaNumber(additionalPhone)}` : undefined,
  };
}

interface SellerContactSectionProps {
  business: SellerContactBusiness;
}

export function SellerContactSection({ business }: SellerContactSectionProps) {
  const contact = buildSellerContactInfo(business);
  const hasAdditionalContact = Boolean(contact.additionalEmail || contact.additionalPhone);

  return (
    <div className={styles.contactColumns}>
      {/* Block 1: Business Info */}
      <div className={styles.contactBlock}>
        <p className={styles.contactBlockTitle}>
          <Icon size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }}>
            store
          </Icon>
          Negocio
        </p>
        <div className={styles.contactBlockCards}>
          <div className={styles.contactCard}>
            <span className={styles.contactLabel}>Razón Social</span>
            <span className={styles.contactValue}>{contact.businessName}</span>
          </div>
          {contact.taxId && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>RUC</span>
              <span className={styles.contactValue}>{contact.taxId}</span>
            </div>
          )}
          {contact.email && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>Email</span>
              <span className={styles.contactValue}>{contact.email}</span>
            </div>
          )}
          {contact.whatsappNumber && contact.waLink && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>WhatsApp</span>
              <span className={styles.contactValue}>
                <a
                  href={contact.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappInline}
                >
                  {contact.whatsappNumber}
                  <Icon size={14} style={{ opacity: 0.5 }}>
                    open_in_new
                  </Icon>
                </a>
              </span>
            </div>
          )}
          {contact.address && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>Dirección</span>
              <span className={styles.contactValue}>{contact.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Block 2: Additional contact channels (deduplicated against business contact) */}
      {hasAdditionalContact && (
        <div className={styles.contactBlock}>
          <p className={styles.contactBlockTitle}>
            <Icon size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }}>
              alternate_email
            </Icon>
            Contacto Adicional
          </p>
          <div className={styles.contactBlockCards}>
            {contact.additionalEmail && (
              <div className={styles.contactCard}>
                <span className={styles.contactLabel}>Email</span>
                <span className={styles.contactValue}>{contact.additionalEmail}</span>
              </div>
            )}
            {contact.additionalPhone && contact.additionalWaLink && (
              <div className={styles.contactCard}>
                <span className={styles.contactLabel}>Teléfono</span>
                <span className={styles.contactValue}>
                  <a
                    href={contact.additionalWaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappInline}
                  >
                    {contact.additionalPhone}
                    <Icon size={14} style={{ opacity: 0.5 }}>
                      open_in_new
                    </Icon>
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
