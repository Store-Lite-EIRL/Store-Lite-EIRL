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
      const result = await updateCulqiCredentials(business.id, publicKey, secretKey);
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
  const isTestKeys = business.culqiPublicKey?.startsWith('pk_test_');

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

              {/* ⚠️ Aviso de llaves de prueba */}
              {isTestKeys && (
                <div
                  style={{
                    margin: '16px 0 0',
                    padding: '12px',
                    background: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: 0, color: '#854d0e' }}>
                    <strong>⚠️ Estás usando llaves de PRUEBA.</strong> Los cobros con estas llaves
                    no generan pagos reales. Para recibir dinero de verdad, solicitá la activación
                    de tu comercio en{' '}
                    <a
                      href="https://afiliate.culqi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1e40af', textDecoration: 'underline' }}
                    >
                      Culqi
                    </a>{' '}
                    y reemplazalas por tus llaves de producción (<code>pk_live_</code> /{' '}
                    <code>sk_live_</code>).
                  </p>
                </div>
              )}

              {/* ✅ Checklist de requisitos para producción */}
              <div
                style={{
                  margin: '16px 0 0',
                  padding: '12px',
                  background: 'var(--md-sys-color-surface-container-high)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
                  <Icon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                    checklist
                  </Icon>
                  Antes de pedirle a Culqi que valide tu tienda
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>
                    ✅ Términos y Condiciones publicados —{' '}
                    <a
                      href={`/${business.slug}/terminos`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      Ver página
                    </a>
                  </li>
                  <li>
                    ✅ Política de Devoluciones publicada —{' '}
                    <a
                      href={`/${business.slug}/devoluciones`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      Ver página
                    </a>
                  </li>
                  <li>
                    ✅ Libro de Reclamaciones activo —{' '}
                    <a
                      href={`/${business.slug}/libro-reclamaciones`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      Ver página
                    </a>
                  </li>
                  <li>
                    ✅ <strong>WhatsApp</strong> configurado en Datos del negocio
                  </li>
                  <li>
                    ✅ Al menos <strong>5 productos</strong> con foto, precio y descripción
                  </li>
                  <li>
                    ✅ Cuenta en{' '}
                    <a
                      href="https://afiliate.culqi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      Culqi
                    </a>{' '}
                    activa y en producción
                  </li>
                  <li>
                    ✅ Llaves de <strong>producción</strong> (<code>pk_live_</code> /{' '}
                    <code>sk_live_</code>) configuradas acá
                  </li>
                </ul>
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
          <div
            style={{
              marginBottom: '16px',
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant)',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>
              Ingresá tus llaves de Culqi para activar los pagos en tu tienda. Tus clientes podrán
              pagar con tarjeta, Yape, billeteras móviles y más.
            </p>

            <p style={{ margin: '8px 0 0' }}>
              ¿Todavía no tenés cuenta en Culqi?{' '}
              <a
                href="https://afiliate.culqi.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--md-sys-color-primary)', textDecoration: 'underline' }}
              >
                Registrate acá
              </a>
              . La validación demora entre 1 y 3 días hábiles.
            </p>

            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: 'var(--md-sys-color-surface-container-high)',
                borderRadius: '8px',
              }}
            >
              <p style={{ margin: '0 0 8px', fontWeight: 500, fontSize: '13px' }}>
                Cómo obtener tus llaves
              </p>
              <ol
                style={{
                  paddingLeft: '20px',
                  margin: 0,
                  fontSize: '13px',
                }}
              >
                <li>
                  Ingresá a{' '}
                  <a
                    href="https://culqipanel.culqi.com/login#/desarrollo/llaves"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--md-sys-color-primary)',
                      textDecoration: 'underline',
                    }}
                  >
                    CulqiPanel
                  </a>{' '}
                  (usá el correo y contraseña que te llegó al registrarte)
                </li>
                <li>
                  En el menú izquierdo, andá a <strong>Desarrollo {'>'} API Keys</strong> — es solo
                  el nombre de la sección donde Culqi guarda tus llaves, no necesitas saber de
                  programación
                </li>
                <li>
                  Copiá tu <strong>Public Key</strong> (pk_&hellip;) y <strong>Secret Key</strong>{' '}
                  (sk_&hellip;)
                </li>
              </ol>
            </div>
          </div>

          {/* Información sobre métodos de pago */}
          <div className={styles.paymentMethodsBox}>
            <p className={styles.paymentMethodsTitle}>
              <Icon size={16}>info</Icon>
              Medios de pago disponibles
            </p>
            <ul className={styles.paymentMethodsList}>
              <li>
                <strong>Tarjetas</strong> — Crédito y débito (Visa, Mastercard, American Express y
                más)
              </li>
              <li>
                <strong>Yape</strong> — Pago directo desde la app Yape
              </li>
              <li>
                <strong>Billeteras móviles</strong> — Plin, Yape QR, BBVA Wallet, Interbank y otras
              </li>
              <li>
                <strong>Cuotéalo BCP</strong> — Financiamiento en cuotas sin tarjeta
              </li>
              <li>
                <strong>PagoEfectivo</strong> — Código CIP para pagar en agentes y bodegas
              </li>
            </ul>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--md-sys-color-on-surface-variant)',
                margin: '8px 0 0',
              }}
            >
              Los medios disponibles varían según el monto y la configuración del comercio en Culqi.{' '}
              <a
                href="https://docs.culqi.com/es/documentacion/pagos-online"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--md-sys-color-primary)', textDecoration: 'underline' }}
              >
                Ver documentación oficial
              </a>
            </p>
          </div>

          {/* ⚠️ Información sobre tipo de llaves */}
          <div
            style={{
              padding: '12px',
              background: 'var(--md-sys-color-surface-container-high)',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>💡 Tipos de llaves Culqi</strong>
            </p>
            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
              <li>
                <code>pk_live_</code> / <code>sk_live_</code> — llaves de{' '}
                <strong>producción</strong>. Procesan pagos reales.
              </li>
              <li>
                <code>pk_test_</code> / <code>sk_test_</code> — llaves de <strong>prueba</strong>.
                Solo para desarrollo, no generan cobros reales.
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
