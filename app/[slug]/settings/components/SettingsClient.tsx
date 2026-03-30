'use client';

import {
  Button,
  Card,
  Chips,
  Divider,
  Icon,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Switch,
  TextField,
} from '@/shared/components/ui';
import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { toggleBusinessActive, updateBusinessSlug } from '../actions';
import styles from '../settings.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  storeType: string | null;
  description: string | null;
  whatsappNumber: string | null;
  taxId: string | null;
  personType: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  legalRepName: string | null;
  legalRepRole: string | null;
  legalRepPhone: string | null;
  legalRepEmail: string | null;
  paymentFlow: string[] | null;
  isActive: boolean;
  createdAt: Date;
}

interface Entitlements {
  plan: string;
  isActive: boolean;
  hasPaymentGateway: boolean;
  maxProducts: number;
  canImportProducts: boolean;
  canCustomizeStorefront: boolean;
  chatEnabled: boolean;
  dashboardEnabled: boolean;
  canUseAIAssistant: boolean;
  maxTeamMembers: number;
}

interface SettingsClientProps {
  business: Business;
  entitlements: Entitlements;
}

// ── Sidebar nav definition ─────────────────────────────────────────────────

type Section = 'business' | 'appearance' | 'plan' | 'contact' | 'legal';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'business', label: 'Mi Negocio', icon: 'store' },
  { id: 'appearance', label: 'Apariencia', icon: 'palette' },
  { id: 'plan', label: 'Plan y Límites', icon: 'workspace_premium' },
  { id: 'contact', label: 'Contacto', icon: 'contact_page' },
  { id: 'legal', label: 'Legal', icon: 'gavel' },
];

// ── Plan display config ───────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { gradient: string; icon: string; label: string; color: string }> = {
  basico: {
    gradient: 'linear-gradient(135deg, var(--md-sys-color-secondary-container), var(--md-sys-color-secondary))',
    icon: 'shopping_cart',
    label: 'Básico',
    color: 'var(--md-sys-color-on-secondary-container)',
  },
  emprendedor: {
    gradient: 'linear-gradient(135deg, var(--md-sys-color-tertiary-container), var(--md-sys-color-tertiary))',
    icon: 'rocket_launch',
    label: 'Emprendedor',
    color: 'var(--md-sys-color-on-tertiary-container)',
  },
  business_pro: {
    gradient: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
    icon: 'diamond',
    label: 'Business Pro',
    color: '#fff',
  },
  enterprise_ai: {
    gradient: 'linear-gradient(135deg, #7b2ff7, #4a148c)',
    icon: 'auto_awesome',
    label: 'Enterprise AI',
    color: '#fff',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSubtitle}>{subtitle}</p>
    </div>
  );
}

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {
      // Ignore clipboard errors
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span className={styles.copyableValue}>
      <code className={styles.monoValue}>{value}</code>
      <IconButton aria-label="Copiar" onClick={handleCopy}>
        <Icon>{copied ? 'check' : 'content_copy'}</Icon>
      </IconButton>
    </span>
  );
}

// ── Section views ─────────────────────────────────────────────────────────

function BusinessSection({ business, entitlements }: { business: Business; entitlements: Entitlements }) {
  const router = useRouter();
  const canEditSlug = entitlements.plan !== 'basico';

  // State for slug editing
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState(business.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isPendingSlug, startTransitionSlug] = useTransition();

  // Optimistic UI for active toggle
  const [optimisticIsActive, toggleOptimisticActive] = useOptimistic(
    business.isActive,
    (current) => !current
  );
  const [isPendingActive, startTransitionActive] = useTransition();

  const handleSaveSlug = () => {
    if (newSlug === business.slug) {
      setIsEditingSlug(false);
      return;
    }

    startTransitionSlug(async () => {
      setSlugError(null);
      const res = await updateBusinessSlug(business.id, newSlug, entitlements.plan);
      if (!res.success) {
        setSlugError(res.error || 'Error al actualizar el slug');
      } else {
        setIsEditingSlug(false);
        router.push(`/${res.newSlug}/settings`);
      }
    });
  };

  const handleToggleActive = () => {
    startTransitionActive(async () => {
      toggleOptimisticActive(undefined); // toggle optimistically
      const res = await toggleBusinessActive(business.id, business.isActive, entitlements.plan);
      if (!res.success) {
        console.error(res.error);
        // Error handling could be a toast in the future, for now it will just revert the optimistic UI on next refresh/render
        alert(`Error: ${res.error}`);
      }
    });
  };

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Mi Negocio"
        subtitle="Información pública que los visitantes ven en tu tienda."
      />

      {!canEditSlug && (
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>lock</Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Funciones Premium</p>
              <p className={styles.upgradeBannerText}>
                La edición de tu URL personalizada y la visibilidad de la tienda están disponibles a partir del plan Emprendedor.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Sube de nivel
          </Button>
        </Card>
      )}

      {/* Profile Card — cover + logo */}
      <Card variant="elevated" className={styles.profileCard}>
        {/* Cover banner */}
        {business.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.coverImageUrl}
            alt="Imagen de publicidad"
            className={styles.coverBanner}
          />
        ) : (
          <div className={styles.coverBannerFallback}>
            <Icon size={40}>image</Icon>
            <span>Sin imagen de publicidad</span>
          </div>
        )}

        {/* Logo + identity */}
        <div className={styles.profileRow}>
          <div className={styles.logoCircle}>
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt="Logo" className={styles.logoImage} />
            ) : (
              <span className={styles.logoInitial}>{business.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.profileMeta}>
            <p className={styles.businessName}>{business.name}</p>
            <p className={styles.businessSlug}>@{business.slug}</p>
          </div>

          <div className={styles.statusToggleContainer}>
            <div className={styles.statusLabelWrapper}>
              {isPendingActive && (
                <Icon className={styles.spinIcon} size={16}>sync</Icon>
              )}
              <span className={styles.statusToggleLabel}>
                {(() => {
                  if (isPendingActive) return 'Guardando...';
                  return optimisticIsActive ? 'Activo' : 'Inactivo';
                })()}
              </span>
            </div>
            <Switch
              selected={optimisticIsActive}
              onClick={handleToggleActive}
              disabled={isPendingActive || !canEditSlug}
              icons
            />
          </div>
        </div>

        {business.description && (
          <p className={styles.descriptionText}>{business.description}</p>
        )}
      </Card>

      {/* Enlace de la Tienda */}
      <Card variant="outlined" className={styles.infoCard}>
        <div className={styles.slugEditHeader}>
          <div>
            <p className={styles.cardLabel}>URL del negocio</p>
            <p className={styles.cardSupporting}>Este es el enlace público que verán tus clientes.</p>
          </div>
          {canEditSlug && !isEditingSlug && (
            <Button variant="tonal" onClick={() => setIsEditingSlug(true)}>
              <Icon slot="icon" size={20}>edit</Icon>
              Modificar URL
            </Button>
          )}
        </div>

        <div className={styles.slugEditContent}>
          {!isEditingSlug ? (
            <div className={styles.slugDisplayContainer}>
              <CopyableValue value={`https://app.com/${business.slug}`} />
            </div>
          ) : (
            <div className={styles.slugEditor}>
              <div className={styles.slugInputWrapper}>
                <span className={styles.slugPrefix}>app.com/</span>
                <TextField
                  value={newSlug}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const val = (e.target as HTMLInputElement).value;
                    const cleanSlug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setNewSlug(cleanSlug);
                  }}
                  placeholder="mi-negocio"
                  className={styles.slugInputStandalone}
                  disabled={isPendingSlug}
                  error={!!slugError}
                  errorText={slugError || ''}
                />
              </div>
              <div className={styles.slugEditActions}>
                <Button variant="text" onClick={() => { setIsEditingSlug(false); setNewSlug(business.slug); setSlugError(null); }} disabled={isPendingSlug}>
                  Cancelar
                </Button>
                <Button variant="filled" onClick={handleSaveSlug} disabled={isPendingSlug || newSlug === business.slug}>
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info list — usando MD3 List */}
      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Información del registro</p>
        <List>
          <ListItem
            headline="ID del Negocio"
            supportingText={<CopyableValue value={business.id} />}
            trailingSupportingText={undefined}
          >
            <Icon slot="start" size={20}>fingerprint</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Tipo de Tienda"
            supportingText={business.storeType ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>storefront</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="País / Ciudad"
            supportingText={
              business.country
                ? [business.country, business.city].filter(Boolean).join(', ')
                : 'Sin configurar'
            }
          >
            <Icon slot="start" size={20}>location_on</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Fecha de registro"
            supportingText={
              new Date(business.createdAt).toISOString().split('T')[0]
            }

          >
            <Icon slot="start" size={20}>calendar_today</Icon>
          </ListItem>
        </List>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="tonal">
          <Icon slot="icon" size={20}>edit</Icon>
          Editar información
        </Button>
        <Button variant="outlined">
          <Icon slot="icon" size={20}>photo_camera</Icon>
          Cambiar imágenes
        </Button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Apariencia"
        subtitle="Personaliza cómo se ve la interfaz para ti."
      />
      <Card variant="elevated" className={styles.appearanceCard}>
        <ThemeSettings />
      </Card>
    </div>
  );
}

function PlanSection({ entitlements }: { business: Business; entitlements: Entitlements }) {
  const planKey = entitlements.plan;
  const config = PLAN_CONFIG[planKey as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.basico;

  const features = [
    { label: 'Gateway de pago (Yape / Plin)', enabled: entitlements.hasPaymentGateway, icon: 'payments' },
    { label: 'Importación masiva de productos', enabled: entitlements.canImportProducts, icon: 'upload' },
    { label: 'Personalización de storefront', enabled: entitlements.canCustomizeStorefront, icon: 'tune' },
    { label: 'Chat con clientes', enabled: entitlements.chatEnabled, icon: 'chat' },
    { label: 'Dashboard de métricas', enabled: entitlements.dashboardEnabled, icon: 'bar_chart' },
    { label: 'Asistente de IA', enabled: entitlements.canUseAIAssistant, icon: 'auto_awesome' },
  ];

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Plan y Límites"
        subtitle="Tu plan actual y todo lo que incluye."
      />

      {/* Hero plan */}
      <div
        className={styles.planHero}
        style={{ background: config.gradient, color: config.color }}
      >
        <div className={styles.planHeroLeft}>
          <div className={styles.planIconCircle}>
            <Icon size={28}>{config.icon}</Icon>
          </div>
          <div>
            <p className={styles.planHeroLabel}>Plan activo</p>
            <p className={styles.planHeroName}>{config.label}</p>
          </div>
        </div>
        <Chips
          label={entitlements.isActive ? 'Al día' : 'Inactivo'}
          variant="filter"
          selected={entitlements.isActive}
        />
      </div>

      {/* Features — MD3 List */}
      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Funcionalidades incluidas</p>
        <List>
          {features.map((feat, i) => (
            <div key={feat.label}>
              {i > 0 && <Divider />}
              <ListItem
                headline={feat.label}
                trailingSupportingText={
                  feat.enabled ? (
                    <Chips label="Incluido" variant="filter" selected />
                  ) : (
                    <Chips label="No incluido" variant="assist" />
                  )
                }
              >
                <Icon
                  slot="start"
                  style={{ color: feat.enabled ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)' } as React.CSSProperties}
                >
                  {feat.icon}
                </Icon>
              </ListItem>
            </div>
          ))}
        </List>
      </Card>

      {/* Limits */}
      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Límites del plan</p>
        <div className={styles.limitsContainer}>
          <LimitItem
            icon="inventory_2"
            label="Productos en catálogo"
            max={entitlements.maxProducts}
            used={0}
          />
          <Divider />
          <LimitItem
            icon="group"
            label="Miembros del equipo"
            max={entitlements.maxTeamMembers}
            used={1}
          />
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="filled">
          <Icon slot="icon" size={20}>upgrade</Icon>
          Cambiar plan
        </Button>
      </div>
    </div>
  );
}

function LimitItem({ icon, label, max, used }: { icon: string; label: string; max: number; used: number }) {
  const unlimited = max === -1;
  const percent = unlimited ? 1 : Math.min(used / max, 1);

  return (
    <div className={styles.limitItem}>
      <div className={styles.limitItemHeader}>
        <Icon size={18}>{icon}</Icon>
        <span className={styles.limitItemLabel}>{label}</span>
        <span className={styles.limitItemValue}>
          {unlimited ? '∞ Ilimitado' : `${used} / ${max}`}
        </span>
      </div>
      <LinearProgress value={unlimited ? 1 : percent} />
    </div>
  );
}

function ContactSection({ business }: { business: Business }) {
  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Contacto"
        subtitle="Información con la que tus clientes se comunican contigo."
      />

      <Card variant="outlined" className={styles.infoCard}>
        <List>
          <ListItem
            headline="WhatsApp"
            supportingText={business.whatsappNumber ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>whatsapp</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Correo electrónico"
            supportingText={business.email ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>email</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Dirección"
            supportingText={business.address ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>location_on</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="País / Ciudad"
            supportingText={
              !business.country
                ? 'Sin configurar'
                : [business.country, business.city].filter(Boolean).join(', ')
            }
          >
            <Icon slot="start" size={20}>public</Icon>
          </ListItem>
        </List>
      </Card>

      {business.paymentFlow && business.paymentFlow.length > 0 && (
        <Card variant="outlined" className={styles.infoCard}>
          <p className={styles.cardLabel}>Flujos de pago configurados</p>
          <div className={styles.chipsRow}>
            {business.paymentFlow.map((flow) => (
              <Chips key={flow} label={flow} variant="assist" elevated />
            ))}
          </div>
        </Card>
      )}

      <div className={styles.actionRow}>
        <Button variant="tonal">
          <Icon slot="icon" size={20}>edit</Icon>
          Editar contacto
        </Button>
      </div>
    </div>
  );
}

function LegalSection({ business }: { business: Business }) {
  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Legal"
        subtitle="Datos tributarios y representante legal del negocio."
      />

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Datos tributarios</p>
        <List>
          <ListItem
            headline="RUC / Tax ID"
            supportingText={business.taxId ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>badge</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Tipo de persona"
            supportingText={(() => {
              if (!business.personType) return 'Sin configurar';
              return business.personType === 'natural' ? 'Persona Natural' : 'Persona Jurídica';
            })()}
          >
            <Icon slot="start" size={20}>person</Icon>
          </ListItem>
        </List>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Representante legal</p>
        <List>
          <ListItem
            headline="Nombre"
            supportingText={business.legalRepName ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>manage_accounts</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Cargo / Rol"
            supportingText={business.legalRepRole ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>work</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Teléfono"
            supportingText={business.legalRepPhone ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>phone</Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Correo"
            supportingText={business.legalRepEmail ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>alternate_email</Icon>
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function SettingsClient({ business, entitlements }: SettingsClientProps) {
  const [active, setActive] = useState<Section>('business');

  return (
    <div className={styles.root}>
      {/* Navigation Drawer — MD3 sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarGroupLabel}>Ajustes</p>
        </div>
        <div className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${active === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActive(item.id)}
            >
              <Icon size={20}>{item.icon}</Icon>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content area */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {active === 'business' && <BusinessSection business={business} entitlements={entitlements} />}
          {active === 'appearance' && <AppearanceSection />}
          {active === 'plan' && (
            <PlanSection business={business} entitlements={entitlements} />
          )}
          {active === 'contact' && <ContactSection business={business} />}
          {active === 'legal' && <LegalSection business={business} />}
        </div>
      </main>
    </div>
  );
}
