'use client';

import type { Permission } from '@/lib/permissions/definitions';
import { AlertSnackbar, Button, Card, Icon, IconButton, TextField } from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type CSSProperties } from 'react';
import { updateCulqiCredentials } from '../actions';
import { type Entitlements, type SettingsBusiness } from '../constants';
import { useSnackbarFeedback } from '../hooks/useSettingsState';
import styles from '../settings.module.css';

export function PaymentsConfig({
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

  const {
    feedback,
    showSuccess,
    showError: showErrorFeedback,
    close: closeFeedback,
  } = useSnackbarFeedback();

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
        showSuccess('Credenciales de Culqi actualizadas.');
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
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as CSSProperties}>
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
        onClose={closeFeedback}
      />
    </div>
  );
}
