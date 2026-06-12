'use client';

import {
  STOREFRONT_FONT_OPTIONS,
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  createRandomStorefrontTheme,
  normalizeStorefrontLayout,
  normalizeStorefrontTheme,
  type GridGap,
  type ProductGridSection,
  type StorefrontColorScheme,
  type StorefrontLayout,
  type StorefrontPalette,
  type StorefrontSection,
  type StorefrontTheme,
} from '@/core/storefront';
import type { Permission } from '@/lib/permissions/definitions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions/definitions';
import {
  AlertSnackbar,
  Button,
  Card,
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
import { getBusinessPath } from '@/shared/utils/url';
import { useParams, useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import { updateBusinessLogo } from '../../../actions/business';
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
  checkSlugAvailability,
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
import { NAV_GROUPS, SettingsNav, type Section } from './SettingsNav';

export interface SettingsBusiness {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
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
  planEndDate: string | null;
  productCount: number;
  memberCount: number;
}

interface SettingsClientProps {
  business: SettingsBusiness;
  entitlements: Entitlements;
  initialStorefrontLayout: StorefrontLayout;
  initialStorefrontTheme: StorefrontTheme;
  initialHasCustomTheme?: boolean;
  initialScheme?: 'light' | 'dark';
  role: string;
  permissions: Permission[];
  isOwner: boolean;
}

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
  key: keyof StorefrontPalette;
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
  const SLUG_MIN = 10;
  const SLUG_MAX = 30;

  // Slug availability check
  const [slugAvailability, setSlugAvailability] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkAvailability = useCallback(
    (slug: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (slug.length < SLUG_MIN || slug.length > SLUG_MAX || slug === business.slug) {
        setSlugAvailability('idle');
        return;
      }

      setSlugAvailability('checking');
      debounceRef.current = setTimeout(async () => {
        const res = await checkSlugAvailability(slug, business.id);
        if (res.success) {
          setSlugAvailability(res.available ? 'available' : 'taken');
        } else {
          setSlugAvailability('idle');
        }
      }, 500);
    },
    [business.id, business.slug],
  );
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const AVATAR_MAX_WIDTH = 2048;
  const AVATAR_MAX_HEIGHT = 2048;
  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validate file type
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Solo se permiten imágenes JPG, PNG o WebP.');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > AVATAR_MAX_SIZE) {
      setAvatarError(`La imagen no debe superar los 5 MB.`);
      e.target.value = '';
      return;
    }

    // Validate image dimensions
    const dimensions = await getImageDimensions(file);
    if (!dimensions) {
      setAvatarError('No se pudo leer la imagen.');
      e.target.value = '';
      return;
    }
    if (dimensions.width > AVATAR_MAX_WIDTH || dimensions.height > AVATAR_MAX_HEIGHT) {
      setAvatarError(`La imagen no debe superar ${AVATAR_MAX_WIDTH}×${AVATAR_MAX_HEIGHT} px.`);
      e.target.value = '';
      return;
    }

    // Upload
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await updateBusinessLogo(business.id, business.slug, formData);
      if (result.success && result.url) {
        setLocalLogoUrl(result.url);
        router.refresh();
      } else {
        setAvatarError(result.error || 'Error al subir el avatar.');
      }
    } catch {
      setAvatarError('Error inesperado al subir el avatar.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // State for slug editing
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
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

    // Client-side validation antes de mandar al server
    if (newSlug.length < SLUG_MIN || newSlug.length > SLUG_MAX) {
      setSlugError(`El slug debe tener entre ${SLUG_MIN} y ${SLUG_MAX} caracteres.`);
      return;
    }

    startTransitionSlug(async () => {
      setSlugError(null);
      const res = await updateBusinessSlug(business.id, newSlug, entitlements.plan);
      if (!res.success) {
        setSlugError(res.error || 'Error al actualizar el slug');
      } else {
        setIsEditingSlug(false);
        setSlugAvailability('idle');
        router.push(getBusinessPath(res.newSlug!, '/settings'));
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
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>store</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Mi Negocio</h2>
          <p className={styles.businessHeroSubtitle}>
            Toda la identidad de tu tienda en un solo lugar. Acá podés cambiar el logo, la
            descripción, la URL y el estado de tu negocio.
          </p>
        </div>
      </div>

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
          <div
            className={styles.logoCircle}
            role="button"
            tabIndex={0}
            aria-label="Cambiar foto de perfil"
            onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') avatarInputRef.current?.click();
            }}
            style={{ cursor: isUploadingAvatar ? 'default' : 'pointer' } as React.CSSProperties}
          >
            {(localLogoUrl ?? business.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={localLogoUrl ?? business.logoUrl!}
                alt="Logo"
                className={styles.logoImage}
              />
            ) : (
              <span className={styles.logoInitial}>{business.name.charAt(0).toUpperCase()}</span>
            )}
            <div className={styles.logoEditOverlay}>
              {isUploadingAvatar ? <CircularProgress /> : <Icon size={28}>photo_camera</Icon>}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.logoFileInput}
              disabled={isUploadingAvatar}
              onChange={handleAvatarChange}
            />
          </div>
          <div className={styles.profileMeta}>
            <p className={styles.businessName}>{business.name}</p>
            <div className={styles.slugBadge}>
              <Icon size={14}>link</Icon>@{business.slug}
            </div>
          </div>

          <div className={styles.statusToggleContainer}>
            <div className={styles.statusLabelWrapper}>
              <span
                className={styles.statusDot}
                data-active={optimisticIsActive}
                data-pending={isPendingActive || undefined}
              />
              {isPendingActive && (
                <Icon className={styles.spinIcon} size={16}>
                  sync
                </Icon>
              )}
              <span className={styles.statusToggleLabel}>
                {isPendingActive ? 'Guardando...' : optimisticIsActive ? 'Activo' : 'Inactivo'}
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

        {avatarError && (
          <div className={styles.avatarError}>
            <Icon size={16}>error</Icon>
            <span>{avatarError}</span>
          </div>
        )}

        {business.description && (
          <div className={styles.descriptionCard}>
            <div className={styles.descriptionInner}>
              <Icon className={styles.descriptionIcon} size={20}>
                description
              </Icon>
              <div className={styles.descriptionContent}>
                <p className={styles.descriptionLabel}>Descripción</p>
                <p className={styles.descriptionText}>{business.description}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Enlace de la Tienda */}
      <Card variant="outlined" className={styles.infoCard}>
        <div className={styles.slugEditHeader}>
          <div className={styles.slugEditHeaderText}>
            <p className={styles.slugEditTitle}>URL del negocio</p>
            <p className={styles.slugCardSupporting}>
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
              <CopyableValue value={`${business.slug}.${appDomain}`} />
            </div>
          ) : (
            <div className={styles.slugEditor}>
              <div className={styles.slugInputWrapper}>
                <TextField
                  value={newSlug}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const val = (e.target as HTMLInputElement).value;
                    const cleanSlug = val
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                    setNewSlug(cleanSlug);
                    setSlugError(null);
                    checkAvailability(cleanSlug);
                  }}
                  placeholder="mi-tienda-ejemplo"
                  className={styles.slugInputStandalone}
                  disabled={isPendingSlug}
                  error={!!slugError}
                  errorText={slugError || ''}
                />
                <span className={styles.slugDomainSuffix}>.{appDomain}</span>
              </div>

              <div className={styles.slugMeta}>
                <span className={styles.slugCharCount}>
                  {newSlug.length}/{SLUG_MAX}
                </span>
                <span className={styles.slugStatusBadge} data-availability={slugAvailability}>
                  {slugAvailability === 'checking' && 'Verificando…'}
                  {slugAvailability === 'available' && '✓ Disponible'}
                  {slugAvailability === 'taken' && '✕ No disponible'}
                </span>
              </div>

              <div className={styles.slugEditActions}>
                <Button
                  variant="text"
                  onClick={() => {
                    setIsEditingSlug(false);
                    setNewSlug(business.slug);
                    setSlugError(null);
                    setSlugAvailability('idle');
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                  }}
                  disabled={isPendingSlug}
                >
                  Cancelar
                </Button>
                <Button
                  variant="filled"
                  onClick={handleSaveSlug}
                  disabled={
                    isPendingSlug ||
                    newSlug === business.slug ||
                    newSlug.length < SLUG_MIN ||
                    slugAvailability !== 'available'
                  }
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info del negocio */}
      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Información del registro</p>
        <List>
          <ListItem
            headline={business.storeType ?? 'Sin configurar'}
            supportingText="Tipo de tienda"
          >
            <Icon slot="start" size={20}>
              store
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline={
              business.country
                ? [business.country, business.city].filter(Boolean).join(', ')
                : 'Sin configurar'
            }
            supportingText="País / Ciudad"
          >
            <Icon slot="start" size={20}>
              location_on
            </Icon>
          </ListItem>
          <Divider />
          <ListItem
            headline={
              [business.departamento, business.provincia, business.distrito]
                .filter(Boolean)
                .join(', ') || 'Sin configurar'
            }
            supportingText="Ubicación"
          >
            <Icon slot="start" size={20}>
              map
            </Icon>
          </ListItem>
          <Divider />
          {business.address && (
            <>
              <ListItem headline={business.address} supportingText="Dirección">
                <Icon slot="start" size={20}>
                  home_pin
                </Icon>
              </ListItem>
              <Divider />
            </>
          )}
          <ListItem
            headline={business.email ?? 'Sin configurar'}
            supportingText="Correo electrónico"
          >
            <Icon slot="start" size={20}>
              mail
            </Icon>
          </ListItem>
          {business.whatsappNumber && (
            <>
              <Divider />
              <ListItem headline={business.whatsappNumber} supportingText="WhatsApp">
                <Icon slot="start" size={20}>
                  chat
                </Icon>
              </ListItem>
            </>
          )}
          <Divider />
          <ListItem
            headline={new Date(business.createdAt).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            supportingText="Registrado el"
          >
            <Icon slot="start" size={20}>
              calendar_today
            </Icon>
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

function getFontFamilyCSS(fontFamily: StorefrontTheme['fontFamily']): string {
  switch (fontFamily) {
    case 'google-sans':
      return "'Google Sans', var(--mio-theme-text-font-family), sans-serif";
    case 'inter':
      return 'var(--font-storefront-inter), var(--mio-theme-text-font-family), sans-serif';
    case 'roboto':
      return 'var(--font-storefront-roboto), var(--mio-theme-text-font-family), sans-serif';
    case 'poppins':
      return 'var(--font-storefront-poppins), var(--mio-theme-text-font-family), sans-serif';
    default:
      return "'Google Sans', var(--mio-theme-text-font-family), sans-serif";
  }
}

function AppearanceSection({
  business,
  entitlements,
  initialStorefrontTheme,
  initialHasCustomTheme = false,
  initialScheme,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  initialStorefrontTheme: StorefrontTheme;
  initialHasCustomTheme?: boolean;
  initialScheme?: 'light' | 'dark';
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [usePlatformColors, setUsePlatformColors] = useState(!initialHasCustomTheme);
  const [storefrontTheme, setStorefrontTheme] = useState<StorefrontTheme>(
    normalizeStorefrontTheme(initialStorefrontTheme),
  );
  const [scheme, setScheme] = useState<StorefrontColorScheme>(initialScheme ?? 'light');
  const currentConfig = storefrontTheme[scheme];
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
          scheme,
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
  const bgChanged =
    JSON.stringify(currentConfig.background) !==
    JSON.stringify(initialStorefrontTheme[scheme].background);
  const themeChanged =
    storefrontTheme.fontFamily !== initialStorefrontTheme.fontFamily ||
    currentConfig.palette.primary !== initialStorefrontTheme[scheme].palette.primary ||
    currentConfig.palette.secondary !== initialStorefrontTheme[scheme].palette.secondary ||
    currentConfig.palette.accent !== initialStorefrontTheme[scheme].palette.accent ||
    bgChanged;
  const hasChanges =
    usePlatformColors !== initialPlatformColors || (!usePlatformColors && themeChanged);

  const canSave = isOwner || permissions.includes('storefront.edit');

  return (
    <div className={styles.sectionArea}>
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>palette</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Apariencia</h2>
          <p className={styles.businessHeroSubtitle}>
            Personalizá el look de tu panel de administración y la imagen pública de tu tienda.
          </p>
        </div>
      </div>

      <Card variant="elevated" className={styles.appearanceCard} style={{ padding: 0 }}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
            <Icon style={{ color: 'var(--md-sys-color-primary)', fontSize: '22px' }}>
              settings_brightness
            </Icon>
            <p className={styles.appearanceSectionTitle} style={{ padding: 0, margin: 0 }}>
              Panel privado
            </p>
          </div>
          <p className={styles.appearanceSectionDesc} style={{ marginTop: '2px', padding: 0 }}>
            Elegí el modo visual y la accesibilidad que más cómodos te queden para administrar.
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

                <div
                  className={styles.fontPreviewCard}
                  style={{
                    opacity: usePlatformColors ? 0.5 : 1,
                    fontFamily: usePlatformColors
                      ? 'inherit'
                      : getFontFamilyCSS(storefrontTheme.fontFamily),
                  }}
                >
                  <p className={styles.fontPreviewLabel}>Vista previa</p>
                  <p className={styles.fontPreviewText}>
                    Cada letra cuenta una historia. Este texto se ve en la tipografía{' '}
                    {STOREFRONT_FONT_OPTIONS.find((o) => o.value === storefrontTheme.fontFamily)
                      ?.label ?? ''}
                    .
                  </p>
                </div>
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
                {THEME_COLOR_FIELDS.map((field) => {
                  const colorValue = currentConfig.palette[field.key];
                  return (
                    <div key={field.key} className={styles.themeColorField}>
                      <label className={styles.themeColorLabel} htmlFor={`theme-${field.key}`}>
                        {field.label}
                      </label>
                      <p className={styles.themeColorHelper}>{field.helper}</p>
                      <div className={styles.themeColorControl}>
                        <div className={styles.themeColorSwatch}>
                          <input
                            id={`theme-${field.key}`}
                            className={styles.themeColorSwatchInput}
                            type="color"
                            disabled={usePlatformColors}
                            value={colorValue}
                            onChange={(event) =>
                              setStorefrontTheme((prev) =>
                                normalizeStorefrontTheme({
                                  ...prev,
                                  [scheme]: {
                                    ...prev[scheme],
                                    palette: {
                                      ...prev[scheme].palette,
                                      [field.key]: event.target.value,
                                    },
                                  },
                                }),
                              )
                            }
                          />
                          <div
                            className={styles.themeColorSwatchFill}
                            style={{ backgroundColor: colorValue }}
                          />
                        </div>
                        <span className={styles.themeColorCode}>
                          <span
                            className={styles.themeColorCodeDot}
                            style={{ backgroundColor: colorValue }}
                          />
                          {colorValue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botones de paleta */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  padding: '4px 24px 24px',
                }}
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
                    casino
                  </Icon>
                  Combinación aleatoria
                </Button>
                <Button
                  variant="text"
                  disabled={usePlatformColors}
                  onClick={() => setStorefrontTheme(createDefaultStorefrontTheme())}
                >
                  <Icon slot="icon" size={20}>
                    restart_alt
                  </Icon>
                  Valores iniciales
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

function getRemainingTime(planEndDate: string | null): string | null {
  if (!planEndDate) return null;
  const end = new Date(planEndDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 'Vencido';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} mes${months !== 1 ? 'es' : ''}`;
    }
    return `${months} mes${months !== 1 ? 'es' : ''} y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`;
  }
  return `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`;
}

function PlanSection({
  entitlements,
  isOwner: _isOwner,
}: {
  entitlements: Entitlements;
  isOwner: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const planKey = entitlements.plan;
  const config = PLAN_CONFIG[planKey as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.basico;
  const remainingTime = getRemainingTime(entitlements.planEndDate);

  const features = [
    {
      label: 'Gateway de pago',
      detail: 'Cobrá con Yape, Plin y tarjeta de crédito/débito',
      enabled: entitlements.hasPaymentGateway,
      icon: 'payments',
    },
    {
      label: 'Productos en catálogo',
      detail:
        entitlements.maxProducts === -1
          ? '∞ Ilimitados'
          : `Hasta ${entitlements.maxProducts} productos`,
      enabled: true,
      icon: 'inventory_2',
    },
    {
      label: 'Importación masiva',
      detail: 'Subí productos desde Excel/CSV en lotes',
      enabled: entitlements.canImportProducts,
      icon: 'upload',
    },
    {
      label: 'Storefront personalizable',
      detail: 'Colores, tipografía y layout de tu tienda',
      enabled: entitlements.canCustomizeStorefront,
      icon: 'tune',
    },
    {
      label: 'Chat con clientes',
      detail: 'Respondé consultas de tus clientes en tiempo real',
      enabled: entitlements.chatEnabled,
      icon: 'chat',
    },
    {
      label: 'Dashboard de métricas',
      detail: 'Ventas, visitas y rendimiento en tiempo real',
      enabled: entitlements.dashboardEnabled,
      icon: 'bar_chart',
    },
    {
      label: 'SEO avanzado',
      detail: 'Meta tags, JSON-LD y sitemap automático',
      enabled: entitlements.seoEnabled,
      icon: 'search',
    },
    {
      label: 'Asistente de IA',
      detail: 'Generación de contenido y respuestas inteligentes',
      enabled: entitlements.canUseAIAssistant,
      icon: 'auto_awesome',
    },
    {
      label: 'Equipo',
      detail:
        entitlements.maxTeamMembers === -1
          ? 'Miembros ilimitados'
          : `Hasta ${entitlements.maxTeamMembers} miembros`,
      enabled: true,
      icon: 'group',
    },
  ];

  // Feature chips for hero — top 3 enabled features
  const heroFeatures = features
    .filter((f) => f.enabled)
    .slice(0, 3)
    .map((f) => ({ label: f.label, icon: f.icon }));

  return (
    <div className={styles.sectionArea}>
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>workspace_premium</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Plan y Límites</h2>
          <p className={styles.businessHeroSubtitle}>Tu plan actual y todo lo que incluye.</p>
        </div>
      </div>

      {/* Hero plan — llamativo según el plan */}
      <div className={styles.planHero} style={{ background: config.gradient, color: config.color }}>
        <span className={styles.planHeroDecoration}>
          <Icon style={{ fontSize: 'inherit' }}>{config.icon}</Icon>
        </span>

        <div className={styles.planHeroBody}>
          <div className={styles.planHeroTop}>
            <div className={styles.planIconCircle}>
              <Icon size={32}>{config.icon}</Icon>
            </div>
            <div className={styles.planHeroInfo}>
              <p className={styles.planHeroLabel}>Plan activo</p>
              <p className={styles.planHeroName}>{config.label}</p>
            </div>
          </div>

          {heroFeatures.length > 0 && (
            <div className={styles.planHeroFeatures}>
              {heroFeatures.map((feat) => (
                <span key={feat.label} className={styles.planHeroFeatureChip}>
                  <Icon size={14}>{feat.icon}</Icon>
                  {feat.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <span
          className={`${styles.planHeroBadge} ${!entitlements.isActive ? styles.planHeroBadgeInactive : ''}`}
        >
          <Icon size={16}>{entitlements.isActive ? 'check_circle' : 'pause_circle'}</Icon>
          {entitlements.isActive ? remainingTime || 'Al día' : 'Inactivo'}
        </span>
      </div>

      {/* Features — layout limpio sin chips/buttons */}
      <Card variant="elevated" className={styles.planFeaturesCard}>
        <div className={styles.teamMembersHeader}>
          <span className={styles.teamMembersTitle}>Funcionalidades incluidas</span>
        </div>
        {features.map((feat, i) => (
          <div key={feat.label}>
            {i > 0 && <div className={styles.planFeatureDivider} />}
            <div
              className={`${styles.planFeatureItem} ${!feat.enabled ? styles.planFeatureDisabled : ''}`}
            >
              <div
                className={`${styles.planFeatureIcon} ${!feat.enabled ? styles.planFeatureIconDisabled : ''}`}
              >
                <Icon size={20}>{feat.icon}</Icon>
              </div>
              <div className={styles.planFeatureBody}>
                <span className={styles.planFeatureLabel}>{feat.label}</span>
                <span className={styles.planFeatureDesc}>{feat.detail}</span>
              </div>
              <div className={styles.planFeatureStatus}>
                <Icon
                  size={20}
                  style={{
                    color: feat.enabled
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  {feat.enabled ? 'check_circle' : 'cancel'}
                </Icon>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Limits */}
      <Card variant="elevated" className={styles.planLimitsCard}>
        <div className={styles.teamMembersHeader}>
          <span className={styles.teamMembersTitle}>Límites del plan</span>
        </div>
        <div className={styles.limitsContainer}>
          <LimitItem
            icon="inventory_2"
            label="Productos en catálogo"
            max={entitlements.maxProducts}
            used={entitlements.productCount}
          />
          <Divider />
          <LimitItem
            icon="group"
            label="Miembros del equipo"
            max={entitlements.maxTeamMembers}
            used={entitlements.memberCount}
          />
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button variant="filled" onClick={() => router.push(`/pricing?slug=${slug}`)}>
          <Icon slot="icon" size={21}>
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
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>gavel</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Información Legal</h2>
          <p className={styles.businessHeroSubtitle}>
            Datos tributarios del negocio e información del representante legal.
          </p>
        </div>
      </div>

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
  logoUrl,
  businessName,
  geoPlacename,
  geoRegion,
}: {
  title: string;
  description: string;
  slug: string;
  logoUrl?: string | null;
  businessName?: string;
  geoPlacename?: string;
  geoRegion?: string;
}) {
  const displayTitle = title || 'Título de tu tienda | Store Lite';
  const displayDesc =
    description ||
    'Configurá la descripción SEO para que tus clientes te encuentren más fácil en Google.';
  const locationLabel = [geoPlacename, geoRegion].filter(Boolean).join(' - ');
  const domain = businessName?.toLowerCase().replace(/\s+/g, '') || 'store.lite';

  return (
    <div className={styles.searchPreview}>
      <div className={styles.googlePreview}>
        {/* URL bar — favicon + breadcrumb estilo Google */}
        <div className={styles.googleUrl}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className={styles.googleFaviconImg}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement)
                  .nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'inline-flex';
              }}
            />
          ) : null}
          <span
            className={styles.googleFavicon}
            style={{
              display: logoUrl ? 'none' : 'inline-flex',
            }}
          >
            {(businessName || 'S')[0].toUpperCase()}
          </span>
          <span>
            {domain} › {slug}
          </span>
          <span className={styles.googleUrlArrow}>▾</span>
        </div>

        {/* Título — azul Google */}
        <a href="#" className={styles.googleTitle} onClick={(e) => e.preventDefault()}>
          {displayTitle}
        </a>

        {/* Descripción — gris, 2 líneas */}
        <p className={styles.googleSnippet}>{displayDesc}</p>

        {/* Ubicación geográfica — opcional */}
        {locationLabel && (
          <div className={styles.googleLocation}>
            <Icon style={{ fontSize: 14, lineHeight: 1 }}>location_on</Icon>
            {locationLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function CharCounter({ current, limit }: { current: number; limit: number }) {
  const isOver = current > limit;
  return (
    <div className={styles.charCounter}>
      <span className={`${styles.charCountText} ${isOver ? styles.charCountWarning : ''}`}>
        {isOver && (
          <Icon style={{ fontSize: 12, marginRight: 2, verticalAlign: 'middle' }}>warning</Icon>
        )}
        {current}/{limit}
      </span>
    </div>
  );
}

/* ── Reusable catalog card (device icon + name header) ──────────── */
function DeviceCard({
  icon,
  name,
  children,
}: {
  icon: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.catalogCard}>
      <div className={styles.catalogCardHeader}>
        <Icon className={styles.catalogCardIcon}>{icon}</Icon>
        <span className={styles.catalogCardName}>{name}</span>
      </div>
      {children}
    </div>
  );
}

/* ── Reusable column chip group ─────────────────────────────────── */
function ColumnChips({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label?: string }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.catalogChipGroup}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.catalogChip} ${String(value) === opt.value ? styles.catalogChipActive : ''}`}
          onClick={() => onChange(Number(opt.value))}
        >
          {opt.label ?? opt.value}
        </button>
      ))}
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

  // Track changes vs. initial normalized state
  const initialRef = useRef<StorefrontLayout>(normalizeStorefrontLayout(initialStorefrontLayout));
  const hasChanges = JSON.stringify(layout) !== JSON.stringify(initialRef.current);
  const canSave = isOwner || permissions.includes('storefront.edit');

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
        <div className={styles.businessHero}>
          <div className={styles.businessHeroIcon}>
            <Icon size={28}>storefront</Icon>
          </div>
          <div>
            <h2 className={styles.businessHeroTitle}>Storefront</h2>
            <p className={styles.businessHeroSubtitle}>
              Organizá la página pública de tu tienda de una forma simple y segura.
            </p>
          </div>
        </div>
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
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>storefront</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Storefront</h2>
          <p className={styles.businessHeroSubtitle}>
            Organizá la página pública de tu tienda de una forma simple y segura.
          </p>
        </div>
      </div>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Bloques visibles en tu página</p>
        <p className={styles.previewSupporting}>
          Elegí qué partes mostrar y en qué orden aparecen.
        </p>
        <div className={styles.storefrontBlockList}>
          {layout.sections.map((section, index) => (
            <div key={section.id} className={styles.storefrontBlockRow}>
              <span className={styles.storefrontBlockDrag}>≡</span>
              <span className={styles.storefrontBlockName}>{SECTION_LABELS[section.type]}</span>
              <div className={styles.storefrontBlockActions}>
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
                <IconButton
                  aria-label="Subir bloque"
                  disabled={index === 0}
                  onClick={() => setLayout((prev) => moveSection(prev, section.id, 'up'))}
                >
                  <Icon>arrow_upward</Icon>
                </IconButton>
                <IconButton
                  aria-label="Bajar bloque"
                  disabled={index === layout.sections.length - 1}
                  onClick={() => setLayout((prev) => moveSection(prev, section.id, 'down'))}
                >
                  <Icon>arrow_downward</Icon>
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Configuración del catálogo</p>
        <p className={styles.previewSupporting}>
          Definí cuántos productos se ven por fila y el espaciado entre ellos para cada tipo de
          pantalla.
        </p>

        <div className={styles.catalogSection}>
          {/* ── Productos por fila ── */}
          <div className={styles.catalogRow}>
            <h4 className={styles.catalogRowTitle}>Productos por fila</h4>
            <p className={styles.catalogRowDesc}>
              Cantidad de columnas visibles según el dispositivo.
            </p>
            <div className={styles.catalogCards}>
              <DeviceCard icon="phone_android" name="Celular">
                <span className={styles.catalogFixedValue}>
                  {productGridSection.config.columns.mobile}
                </span>
              </DeviceCard>

              <DeviceCard icon="tablet" name="Tablet">
                <ColumnChips
                  options={TABLET_COLUMN_OPTIONS}
                  value={productGridSection.config.columns.tablet}
                  onChange={(v) => updateGridColumns('tablet', v)}
                />
              </DeviceCard>

              <DeviceCard icon="desktop_windows" name="Computadora">
                <ColumnChips
                  options={DESKTOP_COLUMN_OPTIONS}
                  value={productGridSection.config.columns.desktop}
                  onChange={(v) => updateGridColumns('desktop', v)}
                />
              </DeviceCard>
            </div>
          </div>

          {/* ── Espaciado ── */}
          <div className={styles.catalogRow}>
            <h4 className={styles.catalogRowTitle}>Espaciado</h4>
            <p className={styles.catalogRowDesc}>Separación entre cada producto en la grilla.</p>
            <div className={styles.catalogCards}>
              {(['mobile', 'tablet', 'desktop'] as const).map((bp) => (
                <DeviceCard
                  key={bp}
                  icon={
                    bp === 'mobile'
                      ? 'phone_android'
                      : bp === 'tablet'
                        ? 'tablet'
                        : 'desktop_windows'
                  }
                  name={bp === 'mobile' ? 'Celular' : bp === 'tablet' ? 'Tablet' : 'Computadora'}
                >
                  <select
                    className={styles.catalogSelect}
                    value={productGridSection.config.gap[bp]}
                    onChange={(e) => updateGridGap(bp, e.target.value as GridGap)}
                  >
                    {GAP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </DeviceCard>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button
          variant="filled"
          onClick={handleSave}
          disabled={isPending || !canSave || !hasChanges}
        >
          <Icon slot="icon" size={20}>
            {isPending ? 'sync' : 'save'}
          </Icon>
          {isPending
            ? 'Guardando...'
            : !canSave
              ? 'Sin permiso para guardar'
              : !hasChanges
                ? 'Sin cambios pendientes'
                : 'Guardar cambios'}
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

function SEOSection({
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
  const initialForm = {
    seoTitle: business.seoTitle || '',
    seoDescription: business.seoDescription || '',
    seoKeywords: business.seoKeywords?.join(', ') || '',
    latitude: business.latitude || '',
    longitude: business.longitude || '',
    geoRegion: business.geoRegion || '',
    geoPlacename: business.geoPlacename || '',
  };
  const [formData, setFormData] = useState(initialForm);
  const initialRef = useRef(initialForm);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialRef.current);
  const canSave = isOwner || permissions.includes('seo.edit');

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
        <div className={styles.businessHero}>
          <div className={styles.businessHeroIcon}>
            <Icon size={28}>travel_explore</Icon>
          </div>
          <div>
            <h2 className={styles.businessHeroTitle}>SEO y Ubicación</h2>
            <p className={styles.businessHeroSubtitle}>
              Optimizá cómo aparece tu tienda en Google y mapas.
            </p>
          </div>
        </div>
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
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>travel_explore</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>SEO y Ubicación</h2>
          <p className={styles.businessHeroSubtitle}>
            Configurá cómo aparece tu tienda en buscadores y mapas para atraer más clientes.
          </p>
        </div>
      </div>

      <SearchPreview
        title={formData.seoTitle}
        description={formData.seoDescription}
        slug={business.slug}
        logoUrl={business.logoUrl}
        businessName={business.name}
        geoPlacename={formData.geoPlacename}
        geoRegion={formData.geoRegion}
      />

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Metadata de Búsqueda</p>
        <div className={styles.metaFields}>
          <div>
            <TextField
              label="Título SEO"
              value={formData.seoTitle}
              placeholder="Ej: Mi Tienda Online | Store Lite"
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, seoTitle: e.target.value })
              }
              supportingText="Entre 50 y 60 caracteres. Aparece como el título azul en Google."
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
              placeholder="Ej: Comprá productos únicos en Mi Tienda — envíos a todo el país."
              onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, seoDescription: e.target.value })
              }
              supportingText="Máximo 160 caracteres. Aparece como el texto gris debajo del título en Google."
            >
              <Icon slot="leading-icon">description</Icon>
            </TextField>
            <CharCounter current={formData.seoDescription.length} limit={160} />
          </div>

          <Divider />

          <div>
            <TextField
              label="Keywords (etiquetas clave)"
              value={formData.seoKeywords}
              placeholder="ropa, zapatos, ofertas, envíos"
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, seoKeywords: e.target.value })
              }
              supportingText="Palabras clave separadas por comas. Ayudan a Google a entender el contenido de tu tienda."
            >
              <Icon slot="leading-icon">key</Icon>
            </TextField>
          </div>
        </div>
      </Card>

      <Card variant="outlined" className={styles.infoCard}>
        <p className={styles.cardLabel}>Posicionamiento Local (GPS)</p>
        <p className={styles.previewSupporting} style={{ padding: '0 24px', margin: 0 }}>
          Estas coordenadas y datos geográficos ayudan a Google a mostrar tu tienda en resultados
          locales y Google Maps.
        </p>
        <div className={styles.formGrid}>
          <div className={styles.twoColRow} style={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Latitud"
              value={formData.latitude}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              placeholder="-16.398764"
              supportingText="Coordenada sur o norte de tu tienda."
            >
              <Icon slot="leading-icon">location_on</Icon>
            </TextField>
            <TextField
              label="Longitud"
              value={formData.longitude}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              placeholder="-71.535004"
              supportingText="Coordenada este u oeste de tu tienda."
            >
              <Icon slot="leading-icon">explore</Icon>
            </TextField>
          </div>

          <div className={styles.twoColRow} style={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Región Geo (ISO)"
              value={formData.geoRegion}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, geoRegion: e.target.value })
              }
              placeholder="PE-ARE"
              supportingText="Código ISO de la región. Ej: PE-ARE para Arequipa."
            >
              <Icon slot="leading-icon">public</Icon>
            </TextField>
            <TextField
              label="Ciudad / Localidad"
              value={formData.geoPlacename}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, geoPlacename: e.target.value })
              }
              placeholder="ej: Arequipa"
              supportingText="Nombre de la ciudad o localidad de tu tienda."
            >
              <Icon slot="leading-icon">apartment</Icon>
            </TextField>
          </div>
        </div>
      </Card>

      <div className={styles.actionRow}>
        <Button
          variant="filled"
          onClick={handleSave}
          disabled={isPending || !canSave || !hasChanges}
        >
          <Icon slot="icon" size={21}>
            {isPending ? 'sync' : 'save'}
          </Icon>
          {isPending
            ? 'Guardando...'
            : !canSave
              ? 'Sin permiso'
              : !hasChanges
                ? 'Sin cambios pendientes'
                : 'Guardar Configuración SEO'}
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
        <div className={styles.businessHero}>
          <div className={styles.businessHeroIcon}>
            <Icon size={28}>group</Icon>
          </div>
          <div>
            <h2 className={styles.businessHeroTitle}>Equipo</h2>
            <p className={styles.businessHeroSubtitle}>
              Invitá a colaboradores para gestionar tu negocio.
            </p>
          </div>
        </div>
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
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>group</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Equipo</h2>
          <p className={styles.businessHeroSubtitle}>Gestioná quién tiene acceso a tu negocio.</p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.teamLoading}>
          <CircularProgress indeterminate />
        </div>
      ) : (
        <>
          {/* Members List */}
          <Card variant="elevated" className={styles.teamMembersCard}>
            <div className={styles.teamMembersHeader}>
              <span className={styles.teamMembersTitle}>Miembros</span>
              <span className={styles.teamMembersCount}>
                {currentMemberCount}/{maxMembers === -1 ? '∞' : maxMembers}
              </span>
            </div>
            {members.map((member, index) => (
              <React.Fragment key={member.userId}>
                {index > 0 && <div className={styles.teamMemberDivider} />}
                <div className={styles.teamMemberItem}>
                  <div
                    className={`${styles.teamMemberAvatar} ${member.role === 'owner' ? styles.teamMemberAvatarOwner : ''}`}
                  >
                    {(member.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.teamMemberInfo}>
                    <span className={styles.teamMemberName}>{member.fullName || 'Sin nombre'}</span>
                    <span className={styles.teamMemberEmail}>{member.email || 'Sin email'}</span>
                  </div>
                  <div className={styles.teamMemberMeta}>
                    {member.role === 'owner' ? (
                      <span className={`${styles.teamRoleBadge} ${styles.teamRoleBadgeOwner}`}>
                        <Icon size={14}>star</Icon>
                        Owner
                      </span>
                    ) : (
                      <>
                        <div className={styles.teamMemberRoleSelect}>
                          <Select
                            value={member.role}
                            onChange={(e: any) =>
                              handleChangeRole(
                                member.userId,
                                (e.target?.value || e.currentTarget?.value) as 'admin' | 'member',
                              )
                            }
                          >
                            <SelectOption value="admin">Admin</SelectOption>
                            <SelectOption value="member">Miembro</SelectOption>
                          </Select>
                        </div>
                        {(isOwner || permissions.includes('team.manage')) && (
                          <div className={styles.teamMemberActions}>
                            <IconButton
                              onClick={() => handleOpenPermissionsModal(member)}
                              disabled={isPending}
                              title="Permisos"
                            >
                              <Icon size={20}>settings</Icon>
                            </IconButton>
                            <IconButton
                              onClick={() => handleRemoveMember(member.userId, member.fullName)}
                              disabled={isPending}
                              title="Eliminar"
                            >
                              <Icon size={20} style={{ color: 'var(--md-sys-color-error)' }}>
                                delete
                              </Icon>
                            </IconButton>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </Card>

          {/* Invitation Code */}
          {(isOwner || permissions.includes('team.invite')) && (
            <Card variant="elevated" className={styles.teamInviteCard}>
              <div className={styles.teamMembersHeader}>
                <span className={styles.teamMembersTitle}>Código de invitación</span>
              </div>

              {canAddMembers ? (
                <div className={styles.teamInviteContent}>
                  <p className={styles.teamMemberEmail} style={{ padding: 0, margin: 0 }}>
                    {invitationCode
                      ? 'Compartí este código con quienes quieras invitar. Por seguridad, rota automáticamente.'
                      : 'Generá un código para invitar a nuevos miembros al equipo.'}
                  </p>

                  {invitationCode ? (
                    <div className={styles.teamInviteCodeDisplay}>
                      <div className={styles.teamInviteRotation}>
                        <Icon size={16} className={styles.rotatingIcon}>
                          sync
                        </Icon>
                        Protección activa — rotación automática
                      </div>
                      <span className={styles.teamInviteCode} onClick={handleCopyCode}>
                        {invitationCode}
                      </span>
                      <div className={styles.teamInviteActions}>
                        <Button variant="tonal" onClick={handleCopyCode}>
                          <Icon slot="icon" size={20}>
                            content_copy
                          </Icon>
                          Copiar código
                        </Button>
                        <Button variant="text" onClick={handleRevokeCode} disabled={isPending}>
                          <Icon slot="icon" size={20}>
                            block
                          </Icon>
                          Revocar
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
          <Card variant="elevated" className={styles.teamHowCard}>
            <div className={styles.teamMembersHeader}>
              <span className={styles.teamMembersTitle}>Cómo unirse</span>
            </div>
            <ol className={styles.teamHowList}>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>1</span>
                <span className={styles.teamHowStepText}>
                  Iniciar sesión con Google en la plataforma
                </span>
              </li>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>2</span>
                <span className={styles.teamHowStepText}>Ir a la página de unirse al equipo</span>
              </li>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>3</span>
                <span className={styles.teamHowStepText}>
                  Ingresar el código de invitación compartido
                </span>
              </li>
            </ol>
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
  entitlements,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [publicKey, setPublicKey] = useState(business.culqiPublicKey || '');
  const [secretKey, setSecretKey] = useState(business.culqiSecretKey || '');
  const [error, setError] = useState<string | null>(null);

  // Estados para visibilidad de llaves
  const [showPublicKeyPreview, setShowPublicKeyPreview] = useState(false);
  const [showSecretKeyPreview, setShowSecretKeyPreview] = useState(false);
  const [showSecretKeyInput, setShowSecretKeyInput] = useState(false);

  const router = useRouter();

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
      const result = await updateCulqiCredentials(
        business.id,
        publicKey,
        secretKey,
        entitlements.plan,
      );
      if (result.success) {
        setFeedback({
          open: true,
          description: 'Credenciales de Culqi actualizadas.',
          color: 'success',
          icon: 'check_circle',
        });
        setShowConfigDialog(false);
        router.refresh();
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

  const isPremiumPlan = ['business_pro', 'enterprise_ai'].includes(entitlements.plan);

  if (!isPremiumPlan) {
    return (
      <div className={styles.sectionArea}>
        <div className={styles.businessHero}>
          <div className={styles.businessHeroIcon}>
            <Icon size={28}>payments</Icon>
          </div>
          <div>
            <h2 className={styles.businessHeroTitle}>Pagos</h2>
            <p className={styles.businessHeroSubtitle}>
              Configurá cómo recibís el dinero de tus ventas.
            </p>
          </div>
        </div>
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Pasarela de pagos premium</p>
              <p className={styles.upgradeBannerText}>
                La integración con Culqi para recibir cobros automáticos está disponible en planes
                Business Pro o superior.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Sube de nivel
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.sectionArea}>
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>payments</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Pagos</h2>
          <p className={styles.businessHeroSubtitle}>
            Configurá cómo recibís el dinero de tus ventas.
          </p>
        </div>
      </div>

      <Card variant="elevated" className={styles.paymentCard}>
        {/* ── Cabecera Pasarela Culqi ── */}
        <div className={styles.paymentCardInner}>
          <div className={styles.paymentServiceRow}>
            <span className={styles.paymentServiceLabel}>Pasarela Culqi</span>
            <div className={styles.statusIndicator}>
              <div
                className={`${styles.statusDot} ${isConfigured ? styles.statusDotActive : styles.statusDotInactive}`}
              />
              <span className={styles.statusText}>
                {isConfigured ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          {isConfigured ? (
            <>
              <div className={styles.paymentKeysList}>
                <div className={styles.paymentKeyItem}>
                  <div>
                    <div className={styles.paymentKeyLabel}>Public Key</div>
                    <div className={styles.paymentKeyValue}>
                      {showPublicKeyPreview
                        ? business.culqiPublicKey
                        : maskKey(business.culqiPublicKey)}
                    </div>
                  </div>
                  <div className={styles.paymentKeyActions}>
                    <IconButton
                      aria-label={showPublicKeyPreview ? 'Ocultar' : 'Mostrar'}
                      onClick={() => setShowPublicKeyPreview(!showPublicKeyPreview)}
                    >
                      <Icon size={20}>
                        {showPublicKeyPreview ? 'visibility_off' : 'visibility'}
                      </Icon>
                    </IconButton>
                  </div>
                </div>

                <div className={styles.paymentKeyItem}>
                  <div>
                    <div className={styles.paymentKeyLabel}>Secret Key</div>
                    <div className={styles.paymentKeyValue}>
                      {showSecretKeyPreview
                        ? business.culqiSecretKey
                        : maskKey(business.culqiSecretKey)}
                    </div>
                  </div>
                  <div className={styles.paymentKeyActions}>
                    <IconButton
                      aria-label={showSecretKeyPreview ? 'Ocultar' : 'Mostrar'}
                      onClick={() => setShowSecretKeyPreview(!showSecretKeyPreview)}
                    >
                      <Icon size={20}>
                        {showSecretKeyPreview ? 'visibility_off' : 'visibility'}
                      </Icon>
                    </IconButton>
                  </div>
                </div>
              </div>

              <div className={styles.paymentActionRow}>
                <Button
                  variant="outlined"
                  onClick={() => setShowConfigDialog(true)}
                  disabled={!isOwner && !permissions.includes('business.edit')}
                >
                  <Icon slot="icon" size={20}>
                    edit
                  </Icon>
                  Cambiar credenciales
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.paymentEmptyState}>
                <Icon size={18}>info</Icon>
                Acción requerida: Configurá tus llaves para activar los pagos con tarjeta.
              </div>

              <div className={styles.paymentActionRow}>
                <Button
                  variant="filled"
                  onClick={() => setShowConfigDialog(true)}
                  disabled={!isOwner && !permissions.includes('business.edit')}
                >
                  <Icon slot="icon" size={20}>
                    add
                  </Icon>
                  Configurar Culqi
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={showConfigDialog} onClose={() => !isPending && setShowConfigDialog(false)}>
        <div slot="headline">Configurar Culqi</div>
        <div slot="content">
          <p
            style={{
              marginBottom: '16px',
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Ingresá tus API Keys de Culqi. Podés encontrarlas en tu panel de Culqi {'>'} Desarrollo{' '}
            {'>'} API Keys.
          </p>

          {/* Información sobre métodos de pago */}
          <div className={styles.paymentMethodsBox}>
            <p className={styles.paymentMethodsTitle}>
              <Icon size={16}>info</Icon>
              Métodos de pago disponibles
            </p>
            <ul className={styles.paymentMethodsList}>
              <li>
                <strong>Yape:</strong> Monto entre S/ 6.00 y S/ 1,000.00 — Por límite de Yape para
                compras por internet (el tope de Culqi es S/ 2,000).
              </li>
              <li>
                <strong>Tarjeta:</strong> Crédito y débito (Visa, Mastercard, American Express) —
                sin límite fijo, depende del emisor.
              </li>
              <li>
                <strong>Nota:</strong> Los métodos de pago se muestran automáticamente según el
                monto de la compra.
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TextField
              label="Public Key"
              value={publicKey}
              onInput={(e: any) => setPublicKey(e.target.value)}
              placeholder="pk_live_..."
              error={!!error && !publicKey.startsWith('pk_')}
              disabled={isPending}
            >
              <Icon slot="leading-icon">key</Icon>
            </TextField>
            <TextField
              label="Secret Key"
              value={secretKey}
              onInput={(e: any) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              type={showSecretKeyInput ? 'text' : 'password'}
              error={!!error && !secretKey.startsWith('sk_')}
              disabled={isPending}
            >
              <Icon slot="leading-icon">lock</Icon>
              <IconButton
                slot="trailing-icon"
                onClick={() => setShowSecretKeyInput(!showSecretKeyInput)}
                disabled={isPending}
              >
                <Icon>{showSecretKeyInput ? 'visibility_off' : 'visibility'}</Icon>
              </IconButton>
            </TextField>
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
  initialScheme,
  role,
  permissions,
  isOwner,
}: SettingsClientProps) {
  const navItemsWithAccess = React.useMemo(() => {
    return NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => {
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
              break;
            case 'legal':
              hasAccess = permissions.includes('legal.edit');
              break;
            case 'seo':
              hasAccess = permissions.includes('seo.edit');
              break;
            case 'payments': {
              const isPremiumPlan = ['business_pro', 'enterprise_ai'].includes(entitlements.plan);
              hasAccess = isPremiumPlan && permissions.includes('business.edit');
              break;
            }
          }
        }
        return { ...item, hasAccess };
      }),
    );
  }, [isOwner, permissions, entitlements]);

  const accessibleItems = navItemsWithAccess.filter((i) => i.hasAccess);
  const [active, setActive] = useState<Section>(
    accessibleItems.length > 0 ? accessibleItems[0].id : 'business',
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className={styles.root}>
        <SettingsNav items={navItemsWithAccess} active={active} onChange={setActive} />

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
                    initialScheme={initialScheme}
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
                  <PaymentsSection
                    business={business}
                    entitlements={entitlements}
                    isOwner={isOwner}
                    permissions={permissions}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
