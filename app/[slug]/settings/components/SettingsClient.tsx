'use client';

import {
  STOREFRONT_FONT_OPTIONS,
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  createRandomStorefrontTheme,
  getReadableTextColor,
  normalizeStorefrontLayout,
  normalizeStorefrontTheme,
  type GridGap,
  type ProductGridSection,
  type StorefrontLayout,
  type StorefrontSection,
  type StorefrontTheme,
} from '@/core/storefront';
import type { Permission } from '@/lib/permissions/definitions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions/definitions';
import {
  AlertSnackbar,
  Button,
  Card,
  Chips,
  CircularProgress,
  Divider,
  Icon,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Select,
  SelectOption,
  Switch,
  TextField,
} from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import {
  generateInvitationCode,
  getInvitationCode,
  getTeamMembers,
  removeTeamMember,
  revokeInvitationCode,
  updateMemberPermissions,
  updateMemberRole,
} from '../../../actions/team';
import {
  clearStorefrontTheme,
  toggleBusinessActive,
  updateBusinessSEO,
  updateBusinessSlug,
  updateCulqiCredentials,
  updateStorefrontLayout,
  updateStorefrontTheme,
} from '../actions';
import styles from '../settings.module.css';
import { PermissionsMatrix } from './PermissionsMatrix';

export interface SettingsBusiness {
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
  latitude: string | null;
  longitude: string | null;
  geoRegion: string | null;
  geoPlacename: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
  isActive: boolean;
  culqiPublicKey: string | null;
  culqiSecretKey: string | null;
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
  seoEnabled: boolean;
}

interface SettingsClientProps {
  business: SettingsBusiness;
  entitlements: Entitlements;
  initialStorefrontLayout: StorefrontLayout;
  initialStorefrontTheme: StorefrontTheme;
  initialHasCustomTheme?: boolean;
  role: string;
  permissions: Permission[];
  isOwner: boolean;
}

type Section =
  | 'business'
  | 'appearance'
  | 'storefront'
  | 'plan'
  | 'team'
  | 'contact'
  | 'legal'
  | 'seo'
  | 'payments';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'business', label: 'Mi Negocio', icon: 'store' },
  { id: 'appearance', label: 'Apariencia', icon: 'palette' },
  { id: 'storefront', label: 'Storefront', icon: 'view_quilt' },
  { id: 'plan', label: 'Plan y Límites', icon: 'workspace_premium' },
  { id: 'team', label: 'Equipo', icon: 'group' },
  { id: 'contact', label: 'Contacto', icon: 'contact_page' },
  { id: 'seo', label: 'SEO y Ubicación', icon: 'travel_explore' },
  { id: 'payments', label: 'Pagos', icon: 'payments' },
  { id: 'legal', label: 'Legal', icon: 'gavel' },
];

const PLAN_CONFIG: Record<
  string,
  { gradient: string; icon: string; label: string; color: string }
> = {
  basico: {
    gradient:
      'linear-gradient(135deg, var(--md-sys-color-secondary-container), var(--md-sys-color-secondary))',
    icon: 'shopping_cart',
    label: 'Básico',
    color: 'var(--md-sys-color-on-secondary-container)',
  },
  emprendedor: {
    gradient:
      'linear-gradient(135deg, var(--md-sys-color-tertiary-container), var(--md-sys-color-tertiary))',
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

const MOBILE_COLUMN_OPTIONS = [
  { value: '1', label: '1 columna' },
  { value: '2', label: '2 columnas' },
];

const TABLET_COLUMN_OPTIONS = [
  { value: '2', label: '2 columnas' },
  { value: '3', label: '3 columnas' },
];

const DESKTOP_COLUMN_OPTIONS = [
  { value: '3', label: '3 columnas' },
  { value: '4', label: '4 columnas' },
];

const GAP_OPTIONS = [
  { value: 'sm', label: 'Compacto' },
  { value: 'md', label: 'Equilibrado' },
  { value: 'lg', label: 'Aireado' },
  { value: 'xl', label: 'Muy aireado' },
];

const SECTION_LABELS: Record<StorefrontSection['type'], string> = {
  hero: 'Portada principal',
  featured_categories: 'Categorías destacadas',
  product_grid: 'Catálogo de productos',
};

const THEME_COLOR_FIELDS = [
  { key: 'primary', label: 'Color principal', helper: 'Botones y acciones destacadas.' },
  {
    key: 'secondary',
    label: 'Color de apoyo',
    helper: 'Píldoras, estados y elementos secundarios.',
  },
  { key: 'accent', label: 'Color de destaque', helper: 'Acentos visuales y puntos de atención.' },
] as const satisfies readonly {
  key: keyof StorefrontTheme['palette'];
  label: string;
  helper: string;
}[];

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

function StorefrontThemePreview({
  businessName,
  storefrontTheme,
}: {
  businessName: string;
  storefrontTheme?: StorefrontTheme;
}) {
  // Si no hay tema, usamos uno por defecto (colores de la plataforma)
  const theme = storefrontTheme || createDefaultStorefrontTheme();
  const titleColor = getReadableTextColor(theme.palette.primary);
  const accentTextColor = getReadableTextColor(theme.palette.accent);

  return (
    <div
      className={styles.themePreviewCard}
      style={
        {
          background: `linear-gradient(135deg, ${theme.palette.primary}, ${theme.palette.secondary}, ${theme.palette.accent})`,
          '--storefront-font-family':
            theme.fontFamily === 'roboto'
              ? 'var(--font-storefront-roboto), var(--mio-theme-text-font-family), sans-serif'
              : theme.fontFamily === 'poppins'
                ? 'var(--font-storefront-poppins), var(--mio-theme-text-font-family), sans-serif'
                : 'var(--font-storefront-inter), var(--mio-theme-text-font-family), sans-serif',
        } as CSSProperties & Record<string, string>
      }
    >
      <div className={styles.themePreviewHeader}>
        <span className={styles.themePreviewBadge}>
          {theme.surfaceMode === 'dark' ? 'Fondo oscuro' : 'Fondo claro'}
        </span>
        <span className={styles.themePreviewBadge}>
          {STOREFRONT_FONT_OPTIONS.find((option) => option.value === theme.fontFamily)
            ?.description ?? 'Inter'}
        </span>
      </div>
      <div className={styles.themePreviewSurface}>
        <p className={styles.themePreviewEyebrow}>Vista previa pública</p>
        <h3 className={styles.themePreviewTitle}>{businessName}</h3>
        <p className={styles.themePreviewText}>
          Así se van a sentir los colores y la tipografía principal en tu storefront.
        </p>
        <div className={styles.themePreviewActions}>
          <span
            className={styles.themePreviewPrimary}
            style={{
              backgroundColor: theme.palette.primary,
              color: titleColor,
            }}
          >
            Comprar
          </span>
          <span
            className={styles.themePreviewSecondary}
            style={{
              backgroundColor: theme.palette.accent,
              color: accentTextColor,
            }}
          >
            Destacado
          </span>
        </div>
      </div>
    </div>
  );
}

function BusinessSection({
  business,
  entitlements,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  isOwner: boolean;
  permissions: Permission[];
}) {
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
    (current) => !current,
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
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Funciones Premium</p>
              <p className={styles.upgradeBannerText}>
                La edición de tu URL personalizada y la visibilidad de la tienda están disponibles a
                partir del plan Emprendedor.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Sube de nivel
          </Button>
        </Card>
      )}

      {/* Profile Card cover + logo */}
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
                <Icon className={styles.spinIcon} size={16}>
                  sync
                </Icon>
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

        {business.description && <p className={styles.descriptionText}>{business.description}</p>}
      </Card>

      {/* Enlace de la Tienda */}
      <Card variant="outlined" className={styles.infoCard}>
        <div className={styles.slugEditHeader}>
          <div>
            <p className={styles.cardLabel}>URL del negocio</p>
            <p className={styles.cardSupporting}>
              Este es el enlace público que verán tus clientes.
            </p>
          </div>
          {(isOwner || permissions.includes('business.edit')) && canEditSlug && !isEditingSlug && (
            <Button variant="tonal" onClick={() => setIsEditingSlug(true)}>
              <Icon slot="icon" size={20}>
                edit
              </Icon>
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
                    const cleanSlug = val
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
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
                <Button
                  variant="text"
                  onClick={() => {
                    setIsEditingSlug(false);
                    setNewSlug(business.slug);
                    setSlugError(null);
                  }}
                  disabled={isPendingSlug}
                >
                  Cancelar
                </Button>
                <Button
                  variant="filled"
                  onClick={handleSaveSlug}
                  disabled={isPendingSlug || newSlug === business.slug}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info list usando MD3 List */}
      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Información del registro</p>
        <List>
          <ListItem
            headline="ID del Negocio"
            supportingText={<CopyableValue value={business.id} />}
            trailingSupportingText={undefined}
          >
            <Icon slot="start" size={20}>
              fingerprint
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Tipo de Tienda"
            supportingText={business.storeType ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>
              storefront
            </Icon>
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
            <Icon slot="start" size={20}>
              location_on
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Fecha de registro"
            supportingText={new Date(business.createdAt).toISOString().split('T')[0]}
          >
            <Icon slot="start" size={20}>
              calendar_today
            </Icon>
          </ListItem>
        </List>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="tonal" disabled={!isOwner && !permissions.includes('business.edit')}>
          <Icon slot="icon" size={20}>
            edit
          </Icon>
          Editar información
        </Button>
        <Button variant="outlined" disabled={!isOwner && !permissions.includes('business.edit')}>
          <Icon slot="icon" size={20}>
            photo_camera
          </Icon>
          Cambiar imágenes
        </Button>
      </div>
    </div>
  );
}

function AppearanceSection({
  business,
  entitlements,
  initialStorefrontTheme,
  initialHasCustomTheme = false,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  initialStorefrontTheme: StorefrontTheme;
  initialHasCustomTheme?: boolean;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [usePlatformColors, setUsePlatformColors] = useState(!initialHasCustomTheme);
  const [storefrontTheme, setStorefrontTheme] = useState<StorefrontTheme>(
    normalizeStorefrontTheme(initialStorefrontTheme),
  );
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  const handleSaveTheme = () => {
    startTransition(async () => {
      let result;
      if (usePlatformColors) {
        result = await clearStorefrontTheme(business.id, business.slug, entitlements.plan);
      } else {
        result = await updateStorefrontTheme(
          business.id,
          business.slug,
          storefrontTheme,
          entitlements.plan,
        );
      }

      if (!result.success) {
        setFeedback({
          open: true,
          description: result.error || 'No se pudo guardar la apariencia pública.',
          color: 'error',
          icon: 'error',
        });
        return;
      }

      if ('storefrontTheme' in result && result.storefrontTheme) {
        setStorefrontTheme(normalizeStorefrontTheme(result.storefrontTheme));
      }

      setFeedback({
        open: true,
        description: 'La apariencia pública del storefront se actualizó correctamente.',
        color: 'success',
        icon: 'check_circle',
      });
      router.refresh();
    });
  };

  // Dirty state: detectar si hay cambios respecto al estado inicial guardado
  const initialPlatformColors = !initialHasCustomTheme;
  const themeChanged =
    storefrontTheme.fontFamily !== initialStorefrontTheme.fontFamily ||
    storefrontTheme.palette.primary !== initialStorefrontTheme.palette.primary ||
    storefrontTheme.palette.secondary !== initialStorefrontTheme.palette.secondary ||
    storefrontTheme.palette.accent !== initialStorefrontTheme.palette.accent;
  const hasChanges =
    usePlatformColors !== initialPlatformColors || (!usePlatformColors && themeChanged);

  const canSave = isOwner || permissions.includes('storefront.edit');

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Apariencia"
        subtitle="Separá la apariencia de tu panel privado de la imagen pública de tu tienda."
      />

      <Card variant="elevated" className={styles.appearanceCard} style={{ padding: 0 }}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Icon style={{ color: 'var(--md-sys-color-primary)' }}>settings_brightness</Icon>
            <p className={styles.cardLabel} style={{ padding: 0, margin: 0 }}>
              Panel privado
            </p>
          </div>
          <p className={styles.previewSupporting}>
            Ajustes personalizados para tu experiencia de administración.
          </p>
        </div>
        <div className={styles.appearanceInner} style={{ padding: '0 24px 24px' }}>
          <ThemeSettings />
        </div>
      </Card>

      {!entitlements.canCustomizeStorefront ? (
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Apariencia pública premium</p>
              <p className={styles.upgradeBannerText}>
                Los colores y la tipografía del storefront están disponibles en planes con
                personalización.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Mejorar Plan
          </Button>
        </Card>
      ) : (
        <>
          {/* ── Card unificada de apariencia pública ── */}
          <Card
            variant="outlined"
            className={styles.infoCard}
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Header + Switch */}
            <div
              style={{
                padding: '20px 24px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <p className={styles.cardLabel} style={{ padding: 0 }}>
                  Vista pública de tu tienda
                </p>
                <p className={styles.previewSupporting} style={{ marginTop: '4px', padding: 0 }}>
                  Elegí la tipografía y los colores principales que verán tus clientes.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--md-sys-color-on-surface)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Usar colores de plataforma
                </span>
                <Switch
                  selected={usePlatformColors}
                  onInput={(e) => {
                    const target = e.target as HTMLElement & { selected: boolean };
                    setUsePlatformColors(target.selected);
                  }}
                />
              </div>
            </div>

            {/* Preview del tema */}
            <div
              className={`${styles.themePreviewWrap} ${usePlatformColors ? styles.disabledCard : ''}`}
            >
              <StorefrontThemePreview
                businessName={business.name}
                storefrontTheme={usePlatformColors ? undefined : storefrontTheme}
              />
            </div>

            {/* Divisor */}
            <div
              style={{
                height: '1px',
                background: 'var(--md-sys-color-outline-variant)',
                margin: '0 24px',
              }}
            />

            {/* Tipografía */}
            <div
              className={usePlatformColors ? styles.disabledCard : ''}
              style={{ padding: '20px 24px 0' }}
            >
              <p className={styles.cardLabel} style={{ padding: 0 }}>
                Tipografía principal
              </p>
              <p className={styles.previewSupporting} style={{ padding: 0, marginTop: '4px' }}>
                Elegí una sola personalidad visual. Más simple, más claro, mejor mantenible.
              </p>
              <div style={{ paddingTop: '16px', paddingBottom: '4px' }}>
                <Select
                  label="Estilo de tipografía"
                  value={storefrontTheme.fontFamily}
                  disabled={usePlatformColors}
                  options={STOREFRONT_FONT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: `${option.label} · ${option.description}`,
                  }))}
                  onChange={(e: SelectValueEvent) => {
                    const fontFamilyValue = getSelectValue(e);
                    setStorefrontTheme((prev) =>
                      normalizeStorefrontTheme({
                        ...prev,
                        fontFamily: fontFamilyValue as StorefrontTheme['fontFamily'],
                      }),
                    );
                  }}
                />
              </div>
            </div>

            {/* Divisor */}
            <div
              style={{
                height: '1px',
                background: 'var(--md-sys-color-outline-variant)',
                margin: '16px 24px 0',
              }}
            />

            {/* Colores */}
            <div className={usePlatformColors ? styles.disabledCard : ''}>
              <div style={{ padding: '20px 24px 0' }}>
                <p className={styles.cardLabel} style={{ padding: 0 }}>
                  Colores principales
                </p>
                <p className={styles.previewSupporting} style={{ padding: 0, marginTop: '4px' }}>
                  Partimos de la paleta base del preview de creación y desde acá la podés ajustar.
                </p>
              </div>
              <div className={styles.themeColorGrid}>
                {THEME_COLOR_FIELDS.map((field) => (
                  <div key={field.key} className={styles.themeColorField}>
                    <label className={styles.themeColorLabel} htmlFor={`theme-${field.key}`}>
                      {field.label}
                    </label>
                    <p className={styles.themeColorHelper}>{field.helper}</p>
                    <div className={styles.themeColorControl}>
                      <input
                        id={`theme-${field.key}`}
                        className={styles.themeColorPicker}
                        type="color"
                        disabled={usePlatformColors}
                        value={storefrontTheme.palette[field.key]}
                        onChange={(event) =>
                          setStorefrontTheme((prev) =>
                            normalizeStorefrontTheme({
                              ...prev,
                              palette: {
                                ...prev.palette,
                                [field.key]: event.target.value,
                              },
                            }),
                          )
                        }
                      />
                      <span className={styles.themeColorCode}>
                        {storefrontTheme.palette[field.key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de paleta — integrados con padding correcto */}
              <div
                style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px 24px 24px' }}
              >
                <Button
                  variant="tonal"
                  disabled={usePlatformColors}
                  onClick={() =>
                    setStorefrontTheme(
                      createRandomStorefrontTheme({ fontFamily: storefrontTheme.fontFamily }),
                    )
                  }
                >
                  <Icon slot="icon" size={20}>
                    palette
                  </Icon>
                  Probar combinación aleatoria
                </Button>
                <Button
                  variant="text"
                  disabled={usePlatformColors}
                  onClick={() => setStorefrontTheme(createDefaultStorefrontTheme())}
                >
                  Volver al inicio
                </Button>
              </div>
            </div>
          </Card>

          {/* Botón guardar — activo solo si hay cambios */}
          <div className={styles.actionRow}>
            <Button
              variant="filled"
              onClick={handleSaveTheme}
              disabled={isPending || !canSave || !hasChanges}
            >
              <Icon slot="icon" size={20}>
                {isPending ? 'sync' : 'save'}
              </Icon>
              {isPending
                ? 'Guardando...'
                : hasChanges
                  ? 'Guardar apariencia pública'
                  : 'Sin cambios pendientes'}
            </Button>
          </div>
        </>
      )}

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function PlanSection({
  entitlements,
  isOwner: _isOwner,
}: {
  entitlements: Entitlements;
  isOwner: boolean;
}) {
  const planKey = entitlements.plan;
  const config = PLAN_CONFIG[planKey as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.basico;

  const features = [
    {
      label: 'Gateway de pago (Yape / Plin)',
      enabled: entitlements.hasPaymentGateway,
      icon: 'payments',
    },
    {
      label: 'Importación masiva de productos',
      enabled: entitlements.canImportProducts,
      icon: 'upload',
    },
    {
      label: 'Personalización de storefront',
      enabled: entitlements.canCustomizeStorefront,
      icon: 'tune',
    },
    { label: 'Chat con clientes', enabled: entitlements.chatEnabled, icon: 'chat' },
    { label: 'Dashboard de métricas', enabled: entitlements.dashboardEnabled, icon: 'bar_chart' },
    { label: 'Asistente de IA', enabled: entitlements.canUseAIAssistant, icon: 'auto_awesome' },
  ];

  return (
    <div className={styles.sectionArea}>
      <SectionHeader title="Plan y Límites" subtitle="Tu plan actual y todo lo que incluye." />

      {/* Hero plan */}
      <div className={styles.planHero} style={{ background: config.gradient, color: config.color }}>
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

      {/* Features MD3 List */}
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
                  style={
                    {
                      color: feat.enabled
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline)',
                    } as React.CSSProperties
                  }
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
          <Icon slot="icon" size={20}>
            upgrade
          </Icon>
          Cambiar plan
        </Button>
      </div>
    </div>
  );
}

function LimitItem({
  icon,
  label,
  max,
  used,
}: {
  icon: string;
  label: string;
  max: number;
  used: number;
}) {
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

function ContactSection({
  business,
  isOwner: _isOwner,
  permissions: _permissions,
}: {
  business: SettingsBusiness;
  isOwner: boolean;
  permissions: Permission[];
}) {
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
            <Icon slot="start" size={20}>
              whatsapp
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Correo electrónico"
            supportingText={business.email ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>
              email
            </Icon>
          </ListItem>
          <Divider />
          <ListItem headline="Dirección" supportingText={business.address ?? 'Sin configurar'}>
            <Icon slot="start" size={20}>
              location_on
            </Icon>
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
            <Icon slot="start" size={20}>
              public
            </Icon>
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
          <Icon slot="icon" size={20}>
            edit
          </Icon>
          Editar contacto
        </Button>
      </div>
    </div>
  );
}

function LegalSection({
  business,
  isOwner: _isOwner,
  permissions: _permissions,
}: {
  business: SettingsBusiness;
  isOwner: boolean;
  permissions: Permission[];
}) {
  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Legal"
        subtitle="Datos tributarios y representante legal del negocio."
      />

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Datos tributarios</p>
        <List>
          <ListItem headline="RUC / Tax ID" supportingText={business.taxId ?? 'Sin configurar'}>
            <Icon slot="start" size={20}>
              badge
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Tipo de persona"
            supportingText={(() => {
              if (!business.personType) return 'Sin configurar';
              return business.personType === 'natural' ? 'Persona Natural' : 'Persona Jurídica';
            })()}
          >
            <Icon slot="start" size={20}>
              person
            </Icon>
          </ListItem>
        </List>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Representante legal</p>
        <List>
          <ListItem headline="Nombre" supportingText={business.legalRepName ?? 'Sin configurar'}>
            <Icon slot="start" size={20}>
              manage_accounts
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline="Cargo / Rol"
            supportingText={business.legalRepRole ?? 'Sin configurar'}
          >
            <Icon slot="start" size={20}>
              work
            </Icon>
          </ListItem>
          <Divider />
          <ListItem headline="Teléfono" supportingText={business.legalRepPhone ?? 'Sin configurar'}>
            <Icon slot="start" size={20}>
              phone
            </Icon>
          </ListItem>
          <Divider />
          <ListItem headline="Correo" supportingText={business.legalRepEmail ?? 'Sin configurar'}>
            <Icon slot="start" size={20}>
              alternate_email
            </Icon>
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

function SearchPreview({
  title,
  description,
  slug,
  geoPlacename,
  geoRegion,
}: {
  title: string;
  description: string;
  slug: string;
  geoPlacename?: string;
  geoRegion?: string;
}) {
  const displayTitle = title || 'Tí­tulo de tu tienda | Store Lite';
  const displayDesc =
    description ||
    'Configura la descripción SEO para que tus clientes te encuentren más fácil en Google.';
  const locationLabel = [geoPlacename, geoRegion].filter(Boolean).join(' - ');

  return (
    <div className={styles.searchPreview}>
      <div className={styles.previewHeader}>
        <div>
          <span className={styles.previewLabel}>Vista previa en Google</span>
        </div>
        <span className={styles.previewBadge}>SEO</span>
      </div>

      <div className={styles.previewUrl}>
        <span className={styles.previewUrlDomain}>store.lite</span>
        <span>https://store.lite/{slug}</span>
        <Icon size={12}>arrow_drop_down</Icon>
      </div>

      <a href="#" className={styles.previewTitle} onClick={(e) => e.preventDefault()}>
        {displayTitle}
      </a>

      <p className={styles.previewSnippet}>{displayDesc}</p>

      <div className={styles.previewMeta}>
        <span className={styles.previewMetaItem}>Slug: /{slug}</span>
        {locationLabel ? (
          <span className={styles.previewMetaItem}>Ubicación: {locationLabel}</span>
        ) : (
          <span className={styles.previewMetaItemMuted}>Sin ubicación geográfica configurada</span>
        )}
      </div>
    </div>
  );
}

function StorefrontSectionEditor({
  business,
  entitlements,
  initialStorefrontLayout,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  initialStorefrontLayout: StorefrontLayout;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });
  const [layout, setLayout] = useState<StorefrontLayout>(
    normalizeStorefrontLayout(initialStorefrontLayout),
  );

  const productGridSection =
    layout.sections.find(
      (section): section is ProductGridSection => section.type === 'product_grid',
    ) ??
    createDefaultStorefrontLayout().sections.find(
      (section): section is ProductGridSection => section.type === 'product_grid',
    )!;

  const updateGridConfig = <K extends keyof ProductGridSection['config']>(
    key: K,
    value: ProductGridSection['config'][K],
  ) => {
    setLayout((prev) =>
      updateSection(prev, 'product_grid', (section) =>
        section.type === 'product_grid'
          ? {
              ...section,
              config: {
                ...section.config,
                [key]: value,
              },
            }
          : section,
      ),
    );
  };

  const updateGridColumns = (breakpoint: 'mobile' | 'tablet' | 'desktop', value: number) => {
    const nextColumns = {
      ...productGridSection.config.columns,
      [breakpoint]: value,
    };

    updateGridConfig('columns', nextColumns as ProductGridSection['config']['columns']);
  };

  const updateGridGap = (breakpoint: 'mobile' | 'tablet' | 'desktop', value: GridGap) => {
    updateGridConfig('gap', {
      ...productGridSection.config.gap,
      [breakpoint]: value,
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateStorefrontLayout(
        business.id,
        business.slug,
        layout,
        entitlements.plan,
      );

      if (!result.success) {
        setFeedback({
          open: true,
          description: result.error || 'No se pudo guardar la configuración de la tienda.',
          color: 'error',
          icon: 'error',
        });
        return;
      }

      setLayout(result.layout ? normalizeStorefrontLayout(result.layout) : layout);
      setFeedback({
        open: true,
        description: 'La vista pública de tu tienda se actualizó correctamente.',
        color: 'success',
        icon: 'check_circle',
      });
      router.refresh();
    });
  };

  if (!entitlements.canCustomizeStorefront) {
    return (
      <div className={styles.sectionArea}>
        <SectionHeader
          title="Storefront"
          subtitle="Ordena bloques y configura el catálogo público de tu tienda."
        />
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Builder restringido por bloques</p>
              <p className={styles.upgradeBannerText}>
                Esta configuración está disponible en planes con personalización del storefront.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Mejorar Plan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="Storefront"
        subtitle="Organizá la página pública de tu tienda de una forma simple y segura."
      />

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Bloques visibles en tu página</p>
        <p className={styles.previewSupporting}>
          Elegí qué partes querés mostrar primero en la página pública de tu tienda.
        </p>
        <div className={styles.storefrontBlockList}>
          {layout.sections.map((section, index) => (
            <div key={section.id} className={styles.storefrontBlockRow}>
              <div className={styles.storefrontBlockInfo}>
                <strong>{SECTION_LABELS[section.type]}</strong>
                <span className={styles.storefrontBlockMeta}>
                  Posición {index + 1} en la página
                </span>
              </div>

              <div className={styles.storefrontBlockActions}>
                <div className={styles.storefrontVisibility}>
                  <span>Mostrar</span>
                  <Switch
                    selected={section.visible}
                    onClick={() =>
                      setLayout((prev) =>
                        updateSection(prev, section.id, (current) => ({
                          ...current,
                          visible: !current.visible,
                        })),
                      )
                    }
                  />
                </div>
                <Button
                  variant="outlined"
                  disabled={index === 0}
                  onClick={() => setLayout((prev) => moveSection(prev, section.id, 'up'))}
                >
                  Subir
                </Button>
                <Button
                  variant="outlined"
                  disabled={index === layout.sections.length - 1}
                  onClick={() => setLayout((prev) => moveSection(prev, section.id, 'down'))}
                >
                  Bajar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Configuración del catálogo</p>
        <p className={styles.previewSupporting}>
          Definí cuántos productos se ven por fila y cuánto espacio querés entre ellos según el
          tamaño de pantalla.
        </p>
        <div className={styles.formGrid}>
          <Select
            label="Productos por fila en celular"
            value={String(productGridSection.config.columns.mobile)}
            options={MOBILE_COLUMN_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridColumns('mobile', Number(getSelectValue(e)))
            }
          />
          <Select
            label="Productos por fila en tablet"
            value={String(productGridSection.config.columns.tablet)}
            options={TABLET_COLUMN_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridColumns('tablet', Number(getSelectValue(e)))
            }
          />
          <Select
            label="Productos por fila en computadora"
            value={String(productGridSection.config.columns.desktop)}
            options={DESKTOP_COLUMN_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridColumns('desktop', Number(getSelectValue(e)))
            }
          />

          <Select
            label="Espacio entre productos en celular"
            value={productGridSection.config.gap.mobile}
            options={GAP_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridGap('mobile', getSelectValue(e) as GridGap)
            }
          />
          <Select
            label="Espacio entre productos en tablet"
            value={productGridSection.config.gap.tablet}
            options={GAP_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridGap('tablet', getSelectValue(e) as GridGap)
            }
          />
          <Select
            label="Espacio entre productos en computadora"
            value={productGridSection.config.gap.desktop}
            options={GAP_OPTIONS}
            onChange={(e: SelectValueEvent) =>
              updateGridGap('desktop', getSelectValue(e) as GridGap)
            }
          />
        </div>
        <div className={styles.storefrontInfoNote}>
          <Chips
            label="El estilo visual de las tarjetas lo sumamos en la próxima fase"
            variant="assist"
            elevated
          />
        </div>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Resumen rápido</p>
        <div className={styles.storefrontSummaryRow}>
          <Chips
            label={`Celular: ${productGridSection.config.columns.mobile} por fila`}
            variant="assist"
            elevated
          />
          <Chips
            label={`Tablet: ${productGridSection.config.columns.tablet} por fila`}
            variant="assist"
            elevated
          />
          <Chips
            label={`Computadora: ${productGridSection.config.columns.desktop} por fila`}
            variant="assist"
            elevated
          />
          <Chips
            label={`Espaciado: ${GAP_OPTIONS.find((option) => option.value === productGridSection.config.gap.desktop)?.label ?? 'Equilibrado'}`}
            variant="assist"
            elevated
          />
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="filled" onClick={handleSave} disabled={isPending}>
          <Icon slot="icon" size={20}>
            {isPending ? 'sync' : 'save'}
          </Icon>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
function moveSection(
  layout: StorefrontLayout,
  sectionId: string,
  direction: 'up' | 'down',
): StorefrontLayout {
  const sections = [...layout.sections].sort((left, right) => left.order - right.order);
  const currentIndex = sections.findIndex((section) => section.id === sectionId);

  if (currentIndex === -1) {
    return layout;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sections.length) {
    return layout;
  }

  const nextSections = [...sections];
  [nextSections[currentIndex], nextSections[targetIndex]] = [
    nextSections[targetIndex],
    nextSections[currentIndex],
  ];

  return normalizeStorefrontLayout({
    version: 1,
    sections: nextSections.map((section, index) => ({ ...section, order: index })),
  });
}

function updateSection(
  layout: StorefrontLayout,
  sectionId: string,
  updater: (section: StorefrontSection) => StorefrontSection,
): StorefrontLayout {
  return normalizeStorefrontLayout({
    version: 1,
    sections: layout.sections.map((section) =>
      section.id === sectionId ? updater(section) : section,
    ),
  });
}

interface SelectValueEvent {
  target?: { value?: string } | null;
  currentTarget?: {
    value?: string;
  };
}

function getSelectValue(event: SelectValueEvent): string {
  if (!event) return '';
  return event.currentTarget?.value ?? event.target?.value ?? '';
}

function CharCounter({ current, limit }: { current: number; limit: number }) {
  const isOver = current > limit;
  return (
    <div className={styles.charCounter}>
      <span className={`${styles.charCountText} ${isOver ? styles.charCountWarning : ''}`}>
        {current}/{limit} {isOver ? '⚠️' : ''}
      </span>
    </div>
  );
}

function SEOSection({
  business,
  entitlements,
  isOwner: _isOwner,
  permissions: _permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    seoTitle: business.seoTitle || '',
    seoDescription: business.seoDescription || '',
    seoKeywords: business.seoKeywords?.join(', ') || '',
    latitude: business.latitude || '',
    longitude: business.longitude || '',
    geoRegion: business.geoRegion || '',
    geoPlacename: business.geoPlacename || '',
  });

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateBusinessSEO(
        business.id,
        {
          ...formData,
          seoKeywords: formData.seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        },
        entitlements.plan,
      );
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  if (!entitlements.seoEnabled) {
    return (
      <div className={styles.sectionArea}>
        <SectionHeader
          title="SEO y Ubicación"
          subtitle="Optimiza cómo aparece tu tienda en Google y mapas."
        />
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>SEO Premium</p>
              <p className={styles.upgradeBannerText}>
                Las herramientas de SEO avanzado, meta-tags personalizadas y ubicación geográfica
                están disponibles en planes superiores.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Mejorar Plan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.sectionArea}>
      <SectionHeader
        title="SEO y Ubicación"
        subtitle="Configura cómo aparece tu tienda en buscadores y mapas para atraer más clientes."
      />

      <SearchPreview
        title={formData.seoTitle}
        description={formData.seoDescription}
        slug={business.slug}
        geoPlacename={formData.geoPlacename}
        geoRegion={formData.geoRegion}
      />

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Metadata de Búsqueda</p>
        <div className={styles.formGrid}>
          <div>
            <TextField
              label="Título SEO"
              value={formData.seoTitle}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, seoTitle: e.target.value })
              }
              supportingText="Ideal: entre 50 y 60 caracteres."
            >
              <Icon slot="leading-icon">title</Icon>
            </TextField>
            <CharCounter current={formData.seoTitle.length} limit={60} />
          </div>

          <div>
            <TextField
              label="Descripción SEO"
              type="textarea"
              rows="3"
              value={formData.seoDescription}
              onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, seoDescription: e.target.value })
              }
              supportingText="Ideal: menos de 160 caracteres."
            >
              <Icon slot="leading-icon">description</Icon>
            </TextField>
            <CharCounter current={formData.seoDescription.length} limit={160} />
          </div>

          <TextField
            label="Keywords (etiquetas clave)"
            value={formData.seoKeywords}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, seoKeywords: e.target.value })
            }
            supportingText="Sencilla lista separada por comas."
          >
            <Icon slot="leading-icon">key</Icon>
          </TextField>
        </div>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Posicionamiento Local (GPS)</p>
        <div className={styles.formGrid}>
          <div className={styles.twoColRow}>
            <TextField
              label="Latitud"
              value={formData.latitude}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              placeholder="-16.398"
            >
              <Icon slot="leading-icon">location_on</Icon>
            </TextField>
            <TextField
              label="Longitud"
              value={formData.longitude}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              placeholder="-71.537"
            >
              <Icon slot="leading-icon">explore</Icon>
            </TextField>
          </div>

          <div className={styles.twoColRow}>
            <TextField
              label="Región Geo (ISO)"
              value={formData.geoRegion}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, geoRegion: e.target.value })
              }
              supportingText="Ej: PE-ARE"
            >
              <Icon slot="leading-icon">public</Icon>
            </TextField>
            <TextField
              label="Ciudad / Lugar"
              value={formData.geoPlacename}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, geoPlacename: e.target.value })
              }
              supportingText="Ej: Arequipa"
            >
              <Icon slot="leading-icon">apartment</Icon>
            </TextField>
          </div>
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="filled" onClick={handleSave} disabled={isPending}>
          <Icon slot="icon" size={21}>
            {isPending ? 'sync' : 'save'}
          </Icon>
          {isPending ? 'Guardando...' : 'Guardar Configuración SEO'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM SECTION
// ─────────────────────────────────────────────────────────────────────────────

interface TeamMemberData {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  customPermissions?: string[];
  joinedAt: Date;
}

function TeamSection({
  business,
  entitlements,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  // Modal de edición de permisos
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<Permission[]>([]);

  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);

  // Dialog de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    userId: string;
    fullName: string | null;
  } | null>(null);

  const currentMemberCount = members.length;
  const maxMembers = entitlements.maxTeamMembers;
  const canAddMembers = currentMemberCount < maxMembers;

  const loadTeamData = async () => {
    setIsLoading(true);
    // Load members
    const membersResult = await getTeamMembers(business.id);
    if (membersResult.success && membersResult.members) {
      setMembers(membersResult.members as TeamMemberData[]);
    }

    // Load invitation code
    const codeResult = await getInvitationCode(business.id);
    if (codeResult.success && codeResult.invitation) {
      setInvitationCode(codeResult.invitation.code);
    }
    setIsLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    loadTeamData();
  }, [business.id]);

  const handleGenerateCode = useCallback(() => {
    startTransition(async () => {
      const result = await generateInvitationCode(business.id);
      if (result.success && result.code) {
        setInvitationCode(result.code);
        setFeedback({
          open: true,
          description: 'Código de invitación generado exitosamente.',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setFeedback({
          open: true,
          description: result.error || 'Error al generar el código.',
          color: 'error',
          icon: 'error',
        });
      }
    });
  }, [business.id]);

  // Rotación automática del código (cada 60 segundos)
  useEffect(() => {
    if (!invitationCode || !isOwner || !canAddMembers) return;

    const interval = setInterval(() => {
      handleGenerateCode();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [invitationCode, isOwner, handleGenerateCode, canAddMembers]);

  const handleRevokeCode = () => {
    if (!invitationCode) return;
    startTransition(async () => {
      const result = await revokeInvitationCode(business.id, invitationCode);
      if (result.success) {
        setInvitationCode(null);
        setFeedback({
          open: true,
          description: 'Código de invitación revocado.',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setFeedback({
          open: true,
          description: result.error || 'Error al revocar el código.',
          color: 'error',
          icon: 'error',
        });
      }
    });
  };

  const handleRemoveMember = (userId: string, fullName: string | null) => {
    setMemberToDelete({ userId, fullName });
    setShowDeleteDialog(true);
  };

  const confirmRemoveMember = () => {
    if (!memberToDelete) return;

    startTransition(async () => {
      const result = await removeTeamMember(business.id, memberToDelete.userId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== memberToDelete.userId));
        setFeedback({
          open: true,
          description: 'Miembro eliminado del equipo.',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setFeedback({
          open: true,
          description: result.error || 'Error al eliminar el miembro.',
          color: 'error',
          icon: 'error',
        });
      }
      setShowDeleteDialog(false);
      setMemberToDelete(null);
    });
  };

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode).catch(() => {});
    }
  };

  // Abrir modal de edición de permisos
  const handleOpenPermissionsModal = (member: TeamMemberData) => {
    setSelectedMember(member);
    // Usar permisos custom si existen, si no usar los del rol por defecto
    const memberRole = member.role as 'admin' | 'member';
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[memberRole] || [];
    setEditingPermissions(
      (member.customPermissions && member.customPermissions.length > 0
        ? member.customPermissions
        : defaultPermissions) as Permission[],
    );
    setShowPermissionsModal(true);
  };

  // Cerrar modal
  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedMember(null);
    setEditingPermissions([]);
  };

  // Toggle permiso
  const handleTogglePermission = (permission: Permission, enabled: boolean) => {
    setEditingPermissions((prev) => {
      if (enabled) {
        return [...prev, permission];
      } else {
        return prev.filter((p) => p !== permission);
      }
    });
  };

  // Guardar permisos
  const handleSavePermissions = () => {
    if (!selectedMember) return;

    startTransition(async () => {
      const result = await updateMemberPermissions(
        business.id,
        selectedMember.userId,
        editingPermissions,
      );

      if (result.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === selectedMember.userId
              ? { ...m, customPermissions: editingPermissions }
              : m,
          ),
        );
        setFeedback({
          open: true,
          description: 'Permisos actualizados correctamente.',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setFeedback({
          open: true,
          description: result.error || 'Error al guardar permisos.',
          color: 'error',
          icon: 'error',
        });
      }
      handleClosePermissionsModal();
    });
  };

  // Cambiar rol
  const handleChangeRole = (memberUserId: string, newRole: 'admin' | 'member') => {
    startTransition(async () => {
      const result = await updateMemberRole(business.id, memberUserId, newRole);
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole } : m)),
        );
        setFeedback({
          open: true,
          description: `Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Miembro'}.`,
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setFeedback({
          open: true,
          description: result.error || 'Error al cambiar rol.',
          color: 'error',
          icon: 'error',
        });
      }
    });
  };

  if (entitlements.maxTeamMembers <= 1) {
    return (
      <div className={styles.sectionArea}>
        <SectionHeader
          title="Equipo"
          subtitle="Invita a colaboradores para gestionar tu negocio."
        />
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Equipos multi-usuario</p>
              <p className={styles.upgradeBannerText}>
                Invitar miembros al equipo está disponible en planes Business Pro o superior.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Mejorar Plan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.sectionArea}>
      <SectionHeader title="Equipo" subtitle="Gestiona quién tiene acceso a tu negocio." />

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}
        >
          <CircularProgress indeterminate />
        </div>
      ) : (
        <>
          {/* Members List */}
          <Card variant="outlined" className={styles.infoCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.cardLabel}>
                Miembros ({currentMemberCount}/{maxMembers === -1 ? '∞' : maxMembers})
              </p>
            </div>
            <List>
              {members.map((member, index) => (
                <React.Fragment key={member.userId}>
                  {index > 0 && <Divider />}
                  <ListItem
                    headline={member.fullName || 'Sin nombre'}
                    supportingText={member.email || 'Sin email'}
                    style={
                      {
                        '--md-list-item-headline-size': '16px',
                        '--md-list-item-headline-weight': '600',
                      } as React.CSSProperties
                    }
                    trailingSupportingText={
                      member.role === 'owner' ? (
                        <Chips label="Owner" variant="filter" selected />
                      ) : (
                        <div className={styles.memberActions}>
                          {(isOwner || permissions.includes('team.manage')) && (
                            <>
                              <div className={styles.roleSelectContainer}>
                                <Select
                                  value={member.role}
                                  onChange={(e: any) =>
                                    handleChangeRole(
                                      member.userId,
                                      (e.target?.value || e.currentTarget?.value) as
                                        | 'admin'
                                        | 'member',
                                    )
                                  }
                                  style={{ minWidth: '130px' }}
                                >
                                  <SelectOption value="admin">Admin</SelectOption>
                                  <SelectOption value="member">Miembro</SelectOption>
                                </Select>
                              </div>
                              <div className={styles.actionButtons}>
                                <IconButton
                                  onClick={() => handleOpenPermissionsModal(member)}
                                  disabled={isPending}
                                  title="Ajustar permisos"
                                >
                                  <Icon size={20}>settings</Icon>
                                </IconButton>
                                <IconButton
                                  onClick={() => handleRemoveMember(member.userId, member.fullName)}
                                  disabled={isPending}
                                  title="Eliminar miembro"
                                >
                                  <Icon size={20} style={{ color: 'var(--md-sys-color-error)' }}>
                                    delete
                                  </Icon>
                                </IconButton>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    }
                  >
                    <Icon slot="start" size={20}>
                      {member.avatarUrl ? 'account_circle' : 'person'}
                    </Icon>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Card>

          {/* Invitation Code */}
          {(isOwner || permissions.includes('team.invite')) && (
            <Card variant="outlined" className={styles.infoCard}>
              <p className={styles.cardLabel}>Código de invitación</p>

              {canAddMembers ? (
                <div
                  className={styles.formGrid}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '0 24px 24px',
                  }}
                >
                  <p className={styles.previewSupporting} style={{ padding: 0 }}>
                    {invitationCode
                      ? 'Compartí este código con quienes quieras invitar a tu equipo. Por seguridad, el código cambia automáticamente.'
                      : 'Generá un código para invitar a nuevos miembros.'}
                  </p>

                  {invitationCode ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className={styles.rotationTimer}>
                        <Icon size={16} className={styles.rotatingIcon}>
                          sync
                        </Icon>
                        Protección activa: El código rotará pronto
                      </div>
                      <div
                        className={styles.monoValue}
                        onClick={handleCopyCode}
                        style={{ cursor: 'pointer' }}
                      >
                        {invitationCode}
                      </div>
                      <div className={styles.slugEditActions} style={{ justifyContent: 'center' }}>
                        <Button variant="tonal" onClick={handleCopyCode}>
                          <Icon slot="icon" size={20}>
                            content_copy
                          </Icon>
                          Copiar código
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="filled" onClick={handleGenerateCode} disabled={isPending}>
                      <Icon slot="icon" size={20}>
                        add
                      </Icon>
                      {isPending ? 'Generando...' : 'Generar código de acceso'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className={styles.planLimitBanner}>
                  <div className={styles.planLimitIcon}>
                    <Icon size={32}>group_add</Icon>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p className={styles.planLimitTitle}>¡Límite de equipo alcanzado!</p>
                    <p className={styles.planLimitDescription}>
                      Tu plan actual permite hasta {maxMembers} miembros. Subí de nivel para seguir
                      sumando talento a tu negocio.
                    </p>
                  </div>
                  <div className={styles.planLimitActions}>
                    <Button variant="filled" onClick={() => router.push('/pricing')}>
                      <Icon slot="icon" size={20}>
                        workspace_premium
                      </Icon>
                      Ver Planes Premium
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* How to join */}
          <Card variant="outlined" className={styles.infoCard}>
            <p className={styles.cardLabel}>Cómo unirse</p>
            <div className={styles.formGrid}>
              <p className={styles.previewSupporting}>Los invitados deben:</p>
              <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li style={{ marginBottom: '0.5rem' }}>Iniciar sesión con Google</li>
                <li style={{ marginBottom: '0.5rem' }}>Ir a la página de unirse al equipo</li>
                <li style={{ marginBottom: '0.5rem' }}>Ingresar el código de invitación</li>
              </ol>
            </div>
          </Card>
        </>
      )}

      {/* Modal de edición de permisos */}
      <Dialog open={showPermissionsModal && !!selectedMember} onClose={handleClosePermissionsModal}>
        <div slot="headline">
          {selectedMember
            ? `Permisos de ${selectedMember.fullName || 'Miembro'}`
            : 'Permisos de Miembro'}
        </div>
        <div slot="content">
          <p
            className={styles.permissionsModalSubtitle}
            style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}
          >
            Editá los permisos individuales para este miembro. Las acciones de administración del
            equipo están bloqueadas por defecto para miembros.
          </p>
          {selectedMember && (
            <PermissionsMatrix
              role={selectedMember.role as 'admin' | 'member'}
              permissions={editingPermissions}
              onChange={handleTogglePermission}
            />
          )}
        </div>
        <div slot="actions">
          <Button variant="text" onClick={handleClosePermissionsModal}>
            Cancelar
          </Button>
          <Button variant="filled" onClick={handleSavePermissions} disabled={isPending}>
            <Icon slot="icon" size={20}>
              save
            </Icon>
            {isPending ? 'Guardando...' : 'Guardar Permisos'}
          </Button>
        </div>
      </Dialog>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <div slot="headline">Eliminar miembro</div>
        <div slot="content">
          ¿Estás seguro de que querés eliminar a{' '}
          <strong>{memberToDelete?.fullName || 'este miembro'}</strong> de tu equipo? No podrá
          volver a entrar a menos que lo vuelvas a invitar.
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            onClick={confirmRemoveMember}
            disabled={isPending}
            style={{
              backgroundColor: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)',
            }}
          >
            Eliminar permanentemente
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function PaymentsSection({
  business,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [publicKey, setPublicKey] = useState(business.culqiPublicKey || '');
  const [secretKey, setSecretKey] = useState(business.culqiSecretKey || '');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  const handleSave = () => {
    if (!publicKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
      setError('Las llaves deben tener el formato correcto (pk_... y sk_...)');
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await updateCulqiCredentials(business.id, publicKey, secretKey);
      if (result.success) {
        setFeedback({
          open: true,
          description: 'Credenciales de Culqi actualizadas.',
          color: 'success',
          icon: 'check_circle',
        });
        setShowConfigDialog(false);
      } else {
        setError(result.error || 'Error al guardar credenciales.');
      }
    });
  };

  const maskKey = (key: string | null) => {
    if (!key) return null;
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 4);
    return `${prefix}••••••••${suffix}`;
  };

  const isConfigured = business.culqiPublicKey && business.culqiSecretKey;

  return (
    <div className={styles.sectionArea}>
      <SectionHeader title="Pagos" subtitle="Configurá cómo recibís el dinero de tus ventas." />

      <Card variant="outlined" className={styles.infoCard}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: isConfigured
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container-highest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                size={24}
                style={{
                  color: isConfigured
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                payments
              </Icon>
            </div>
            <div>
              <p className={styles.cardLabel} style={{ padding: 0 }}>
                Pasarela Culqi
              </p>
              <p className={styles.previewSupporting} style={{ padding: 0 }}>
                {isConfigured
                  ? 'Tus clientes pueden pagar con tarjeta directamente a tu cuenta.'
                  : 'Configurá tus llaves de Culqi para aceptar pagos con tarjeta.'}
              </p>
            </div>
          </div>

          {isConfigured ? (
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                  }}
                >
                  Estado
                </span>
                <Chips label="Conectado" variant="filter" selected />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span
                    style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    Public Key
                  </span>
                  <code style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
                    {maskKey(business.culqiPublicKey)}
                  </code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span
                    style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    Secret Key
                  </span>
                  <code style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
                    {maskKey(business.culqiSecretKey)}
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon size={20}>info</Icon>
              Aún no has configurado tus credenciales. Los pagos con tarjeta no estarán disponibles.
            </div>
          )}

          <Button
            variant={isConfigured ? 'outlined' : 'filled'}
            onClick={() => setShowConfigDialog(true)}
            disabled={!isOwner && !permissions.includes('business.edit')}
          >
            <Icon slot="icon" size={20}>
              {isConfigured ? 'edit' : 'add'}
            </Icon>
            {isConfigured ? 'Cambiar credenciales' : 'Configurar Culqi'}
          </Button>
        </div>
      </Card>

      <Dialog open={showConfigDialog} onClose={() => !isPending && setShowConfigDialog(false)}>
        <div slot="headline">Configurar Culqi</div>
        <div slot="content">
          <p
            style={{
              marginBottom: '24px',
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Ingresá tus API Keys de Culqi. Podés encontrarlas en tu panel de Culqi {'>'} Desarrollo{' '}
            {'>'} API Keys.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TextField
              label="Public Key"
              value={publicKey}
              onInput={(e: any) => setPublicKey(e.target.value)}
              placeholder="pk_live_..."
              error={!!error && !publicKey.startsWith('pk_')}
              disabled={isPending}
            />
            <TextField
              label="Secret Key"
              value={secretKey}
              onInput={(e: any) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              type="password"
              error={!!error && !secretKey.startsWith('sk_')}
              disabled={isPending}
            />
            {error && (
              <p style={{ color: 'var(--md-sys-color-error)', fontSize: '12px', margin: 0 }}>
                {error}
              </p>
            )}
          </div>
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setShowConfigDialog(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="filled" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Dialog>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export function SettingsClient({
  business,
  entitlements,
  initialStorefrontLayout,
  initialStorefrontTheme,
  initialHasCustomTheme = false,
  role,
  permissions,
  isOwner,
}: SettingsClientProps) {
  const navItemsWithAccess = React.useMemo(() => {
    return NAV_ITEMS.map((item) => {
      let hasAccess = false;
      if (isOwner) {
        hasAccess = true;
      } else {
        switch (item.id) {
          case 'business':
            hasAccess =
              permissions.includes('business.edit') || permissions.includes('contact.edit');
            break;
          case 'appearance':
          case 'storefront':
            hasAccess = permissions.includes('storefront.edit');
            break;
          case 'plan':
          case 'team':
            break; // Ya es false por defecto
          case 'contact':
            hasAccess = permissions.includes('contact.edit');
            break;
          case 'seo':
            hasAccess = permissions.includes('seo.edit');
            break;
          case 'legal':
            hasAccess = permissions.includes('legal.edit');
            break;
          case 'payments':
            hasAccess = permissions.includes('business.edit');
            break;
        }
      }
      return { ...item, hasAccess };
    });
  }, [isOwner, permissions]);

  const accessibleItems = navItemsWithAccess.filter((i) => i.hasAccess);
  const [active, setActive] = useState<Section>(
    accessibleItems.length > 0 ? accessibleItems[0].id : 'business',
  );

  return (
    <div className={styles.root}>
      {/* Navigation Drawer MD3 sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarGroupLabel}>Ajustes</p>
        </div>
        <div className={styles.sidebarNav}>
          {navItemsWithAccess.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${active === item.id && item.hasAccess ? styles.navItemActive : ''}`}
              onClick={() => item.hasAccess && setActive(item.id)}
              disabled={!item.hasAccess}
              style={{
                opacity: item.hasAccess ? 1 : 0.6,
                cursor: item.hasAccess ? 'pointer' : 'not-allowed',
              }}
            >
              <Icon size={20}>{item.hasAccess ? item.icon : 'lock'}</Icon>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content area */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {accessibleItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
              }}
            >
              <Card
                variant="outlined"
                style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}
              >
                <Icon
                  size={48}
                  style={
                    {
                      color: 'var(--md-sys-color-primary)',
                      marginBottom: '1rem',
                    } as React.CSSProperties
                  }
                >
                  lock_person
                </Icon>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.5rem',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  Acceso restringido
                </h2>
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5' }}>
                  No tienes permisos para ver o editar las configuraciones de este negocio.
                </p>
              </Card>
            </div>
          ) : (
            <>
              {active === 'business' && (
                <BusinessSection
                  business={business}
                  entitlements={entitlements}
                  isOwner={isOwner}
                  permissions={permissions}
                />
              )}
              {active === 'appearance' && (
                <AppearanceSection
                  business={business}
                  entitlements={entitlements}
                  initialStorefrontTheme={initialStorefrontTheme}
                  initialHasCustomTheme={initialHasCustomTheme}
                  isOwner={isOwner}
                  permissions={permissions}
                />
              )}
              {active === 'storefront' && (
                <StorefrontSectionEditor
                  business={business}
                  entitlements={entitlements}
                  initialStorefrontLayout={initialStorefrontLayout}
                  isOwner={isOwner}
                  permissions={permissions}
                />
              )}
              {active === 'plan' && <PlanSection entitlements={entitlements} isOwner={isOwner} />}
              {active === 'team' && (
                <TeamSection
                  business={business}
                  entitlements={entitlements}
                  isOwner={isOwner}
                  permissions={permissions}
                />
              )}
              {active === 'contact' && (
                <ContactSection business={business} isOwner={isOwner} permissions={permissions} />
              )}
              {active === 'seo' && (
                <SEOSection
                  business={business}
                  entitlements={entitlements}
                  isOwner={isOwner}
                  permissions={permissions}
                />
              )}
              {active === 'legal' && (
                <LegalSection business={business} isOwner={isOwner} permissions={permissions} />
              )}
              {active === 'payments' && (
                <PaymentsSection business={business} isOwner={isOwner} permissions={permissions} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
