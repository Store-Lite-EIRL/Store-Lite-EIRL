'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { getBusinessPath } from '@/shared/utils/url';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { lookupOrderByGoogleIdentity } from '../actions';

interface LookupOrderModalProps {
  open: boolean;
  onClose: () => void;
  businessSlug: string;
  businessName?: string;
}

export function LookupOrderModal({
  open,
  onClose,
  businessSlug,
  businessName,
}: LookupOrderModalProps) {
  const router = useRouter();

  // ─── DNI flow state ───
  const [dni, setDni] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Google auth state ───
  const supabase = useMemo(() => createClient(), []);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{
    authId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [googleOrderNumber, setGoogleOrderNumber] = useState('');

  const AUTH_ORIGIN =
    process.env.NEXT_PUBLIC_AUTH_ORIGIN ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const SESSION_TTL = 1 * 60 * 60 * 1000; // 1 hora

  // ─── Listen for auth tokens from popup ───
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== AUTH_ORIGIN) return;

      if (event.data?.type === 'AUTH_SUCCESS' && event.data?.slug === businessSlug) {
        setIsGoogleLoading(true);
        setGoogleError(null);

        try {
          await supabase.auth.setSession({
            access_token: event.data.access_token,
            refresh_token: event.data.refresh_token,
          });

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.app_metadata?.provider === 'google') {
            const user = session.user;
            setGoogleUser({
              authId: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
              email: user.email || '',
              avatarUrl: user.user_metadata?.avatar_url || null,
            });
          } else {
            setGoogleError('No se pudo obtener tu información de Google.');
          }
        } catch (err) {
          console.error('[LookupOrderModal] Google auth error:', err);
          setGoogleError('Error al verificar tu identidad con Google.');
        } finally {
          setIsGoogleLoading(false);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [businessSlug, supabase, AUTH_ORIGIN]);

  // ─── Open Google sign-in popup ───
  const handleGoogleVerify = useCallback(() => {
    const popupUrl = new URL(`${AUTH_ORIGIN}/auth/customer`);
    popupUrl.searchParams.set('slug', businessSlug);
    popupUrl.searchParams.set('name', businessName || businessSlug);
    popupUrl.searchParams.set('origin', window.location.origin);

    const popup = window.open(popupUrl.toString(), 'customer-auth', 'width=600,height=700,popup=1');

    if (!popup || popup.closed) {
      console.warn('[LookupOrderModal] Popup was blocked');
      return;
    }

    setIsGoogleLoading(true);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsGoogleLoading(false);
      }
    }, 500);
  }, [businessSlug, businessName, AUTH_ORIGIN]);

  // ─── Verify with Google + order number ───
  const handleGoogleOrderLookup = async () => {
    const cleanOrderNumber = googleOrderNumber.trim();
    if (!googleUser || !cleanOrderNumber) return;

    setLoading(true);
    setGoogleError(null);

    try {
      const res = await lookupOrderByGoogleIdentity(
        googleUser.authId,
        cleanOrderNumber,
        businessSlug,
      );

      if (res.success && res.token) {
        const authTokenData = {
          token: res.token,
          method: 'google' as const,
          authId: googleUser.authId,
          expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(`order_session_${res.token}`, JSON.stringify(authTokenData));

        router.push(getBusinessPath(businessSlug, `/order/${res.token}`));
        onClose();
        return;
      }

      switch (res.reason) {
        case 'no_google_link':
          setError(res.error || 'Esta compra fue realizada sin Google. Usá DNI.');
          setGoogleUser(null);
          setGoogleOrderNumber('');
          break;
        case 'wrong_account':
          setGoogleError(res.error || 'Orden vinculada a otra cuenta de Google.');
          break;
        default:
          setGoogleError(res.error || 'No se encontró ninguna orden con esos datos.');
      }
    } catch {
      // El error ya se setea como googleError con el mensaje del server action
      if (!googleError) {
        setGoogleError('Ocurrió un problema al verificar. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset Google flow ───
  const handleResetGoogle = useCallback(() => {
    setGoogleUser(null);
    setGoogleOrderNumber('');
    setGoogleError(null);
  }, []);

  // ─── DNI + order number submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validación frontal ──
    const dniClean = dni.trim();
    const orderClean = orderNumber.trim();

    if (!dniClean || !orderClean) {
      setError('Completá ambos campos para buscar tu pedido.');
      return;
    }

    if (!/^\d{8}$/.test(dniClean)) {
      setError('El DNI debe tener exactamente 8 dígitos numéricos (ej: 12345678).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/order/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dniClean, orderNumber: orderClean, businessSlug }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        const authTokenData = {
          token: data.token,
          dni: dniClean,
          expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(`order_session_${data.token}`, JSON.stringify(authTokenData));

        const targetUrl = getBusinessPath(businessSlug, `/order/${data.token}`);
        onClose();
        window.location.href = targetUrl;
      } else {
        setError(
          data.error || 'No encontramos un pedido con esos datos. Revisá DNI y número de orden.',
        );
      }
    } catch {
      setError('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset state when modal opens/closes ───
  useEffect(() => {
    if (!open) {
      setDni('');
      setOrderNumber('');
      setError(null);
      setLoading(false);
      setGoogleUser(null);
      setGoogleOrderNumber('');
      setGoogleError(null);
      setIsGoogleLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} id="lookup-order-dialog">
      {/* MD3 Dialog Headline */}
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon>search</Icon>
        Ver mi Pedido
      </div>

      {/* MD3 Dialog Content */}
      <div slot="content">
        {googleUser ? (
          /* ═══ GOOGLE AUTHENTICATED: avatar + order number ═══ */
          <div>
            {/* User Avatar + Info */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 1rem',
                  border: '2px solid var(--md-sys-color-primary-container)',
                  background: 'var(--md-sys-color-surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {googleUser.avatarUrl ? (
                  <img
                    src={googleUser.avatarUrl}
                    alt={googleUser.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon size={32}>person</Icon>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{googleUser.name}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{googleUser.email}</div>
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
                opacity: 0.7,
              }}
            >
              Ingresá el <b>N° de orden</b> de tu compra para acceder al seguimiento.
            </p>

            <TextField
              type="text"
              label="Número de Orden"
              placeholder="Ej: ORD-001"
              value={googleOrderNumber}
              onChange={(e: any) => setGoogleOrderNumber(e.target.value)}
              required
              supportingText="Ingresá el número que recibiste al comprar"
            />

            {googleError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  backgroundColor: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  fontSize: '0.875rem',
                  marginTop: '1rem',
                }}
              >
                <Icon style={{ fontSize: '1.125rem' }}>error</Icon>
                {googleError}
              </div>
            )}
          </div>
        ) : (
          /* ═══ DEFAULT: Google button + DNI form ═══ */
          <div>
            <p
              style={{
                marginBottom: '1.5rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: '0.875rem',
                lineHeight: '1.4',
              }}
            >
              Ingresá tu DNI y número de orden para ver el estado de tu compra, o accedé con Google
              si compraste con esa cuenta.
            </p>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleVerify}
              disabled={isGoogleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '100px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                background: 'var(--md-sys-color-surface)',
                cursor: isGoogleLoading ? 'wait' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface)',
                transition: 'all 0.2s',
                opacity: isGoogleLoading ? 0.7 : 1,
                marginBottom: googleError ? '0.5rem' : '1.25rem',
              }}
              onMouseEnter={(e) => {
                if (!isGoogleLoading)
                  e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--md-sys-color-surface)';
              }}
            >
              {isGoogleLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid var(--md-sys-color-outline)',
                      borderTopColor: 'var(--md-sys-color-primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Conectando con Google...
                </span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Acceder con Google
                </>
              )}
            </button>

            {googleError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  backgroundColor: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                <Icon style={{ fontSize: '1.125rem' }}>error</Icon>
                {googleError}
              </div>
            )}

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'var(--md-sys-color-outline-variant)',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                o ingresá tus datos
              </span>
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'var(--md-sys-color-outline-variant)',
                }}
              />
            </div>

            {/* DNI + Order Number Form */}
            <form
              id="lookup-form"
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <TextField
                type="text"
                label="DNI (8 dígitos)"
                placeholder="12345678"
                value={dni}
                onChange={(e: any) => setDni(e.target.value.replace(/\D/g, '').substring(0, 8))}
                maxLength={8}
                required
                supportingText="Ingresa tu DNI de 8 dígitos"
              />

              <TextField
                type="text"
                label="Número de Orden"
                placeholder="Ej: ORD-001"
                value={orderNumber}
                onChange={(e: any) => setOrderNumber(e.target.value)}
                required
              />

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    backgroundColor: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                    fontSize: '0.875rem',
                  }}
                >
                  <Icon style={{ fontSize: '1.125rem' }}>error</Icon>
                  {error}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* MD3 Dialog Actions (direct children of Dialog — required for slot mechanism) */}
      {googleUser ? (
        <div
          slot="actions"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}
        >
          <Button
            variant="filled"
            onClick={handleGoogleOrderLookup}
            disabled={loading || !googleOrderNumber.trim()}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon style={{ fontSize: '1.125rem', animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </Icon>
                Buscando...
              </span>
            ) : (
              'Ver mi Pedido'
            )}
          </Button>
          <Button variant="text" onClick={handleResetGoogle} disabled={loading}>
            Usar otra cuenta de Google o DNI
          </Button>
        </div>
      ) : (
        <div slot="actions">
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            onClick={() => {
              const form = document.getElementById('lookup-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon style={{ fontSize: '1.125rem', animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </Icon>
                Buscando...
              </span>
            ) : (
              'Ver mi Pedido'
            )}
          </Button>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `,
        }}
      />
    </Dialog>
  );
}
