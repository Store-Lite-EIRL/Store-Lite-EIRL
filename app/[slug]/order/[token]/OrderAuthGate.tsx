'use client';

import { Icon } from '@/shared/components/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { verifyOrderAccess } from './actions';

interface OrderAuthGateProps {
  token: string;
  businessName: string;
  orderNumber: string;
  children: React.ReactNode;
}

const SESSION_TTL = 1 * 60 * 60 * 1000; // 1 Hora

export default function OrderAuthGate({
  token,
  businessName,
  orderNumber,
  children,
}: OrderAuthGateProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [dni, setDni] = useState('');
  const [inputOrderNumber, setInputOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `order_session_${token}`;

  useEffect(() => {
    const checkAuth = () => {
      // 1. Verificar si hay sesión válida en LocalStorage
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { expiresAt } = JSON.parse(stored);
          if (Date.now() < expiresAt) {
            setIsAuthenticated(true);
            return;
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (e) {
          localStorage.removeItem(storageKey);
        }
      }

      // 2. Si no hay sesión, verificar si el DNI viene por URL (Auto-Auth)
      const dniFromUrl = searchParams.get('dni');
      if (dniFromUrl && dniFromUrl.length >= 8) {
        const performAutoAuth = async () => {
          setLoading(true);
          try {
            const res = await verifyOrderAccess(token, dniFromUrl);
            if (res.success) {
              const sessionData = {
                dni: dniFromUrl,
                expiresAt: Date.now() + SESSION_TTL,
              };
              localStorage.setItem(storageKey, JSON.stringify(sessionData));
              setIsAuthenticated(true);

              const newParams = new URLSearchParams(searchParams.toString());
              newParams.delete('dni');
              const query = newParams.toString() ? `?${newParams.toString()}` : '';
              router.replace(`${pathname}${query}`);
            }
          } catch (err) {
            console.error('[OrderAuthGate] Auto-auth error:', err);
          } finally {
            setLoading(false);
          }
        };
        performAutoAuth();
        return;
      }

      setIsAuthenticated(false);
    };

    checkAuth();
  }, [storageKey, searchParams, token, pathname, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dni.trim();
    const cleanOrderNumber = inputOrderNumber.trim();

    if (cleanDni.length < 8) {
      setError('Por favor, ingresá un DNI válido.');
      return;
    }
    if (!cleanOrderNumber) {
      setError('Por favor, ingresá el N° de orden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOrderAccess(token, cleanDni, cleanOrderNumber);
      if (res.success) {
        const sessionData = {
          dni: cleanDni,
          orderNumber: cleanOrderNumber,
          expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(storageKey, JSON.stringify(sessionData));
        setIsAuthenticated(true);
      } else {
        setError('El DNI o N° de orden no coinciden con esta orden.');
      }
    } catch (err) {
      setError('Ocurrió un problema al verificar el acceso. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null || (loading && !isAuthenticated)) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--md-sys-color-surface)',
          gap: '2rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--md-sys-color-primary-container)',
            borderTopColor: 'var(--md-sys-color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'var(--md-sys-color-on-surface)',
            opacity: 0.6,
          }}
        >
          ESTABLECIENDO CONEXIÓN SEGURA
        </p>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `,
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'var(--md-sys-color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundImage:
            'radial-gradient(circle at 50% 50%, var(--md-sys-color-primary-container) 0%, transparent 70%)',
          backgroundSize: '100% 100%',
          opacity: 0.98,
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            borderRadius: '48px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              background:
                'linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-tertiary) 100%)',
              color: 'white',
              borderRadius: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2.5rem',
              boxShadow: '0 20px 40px rgba(var(--md-sys-color-primary-rgb), 0.3)',
              transform: 'rotate(-5deg)',
            }}
          >
            <Icon size={48}>verified_user</Icon>
          </div>

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 950,
              marginBottom: '1rem',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Verificá tu Identidad
          </h2>

          <p
            style={{
              fontSize: '1rem',
              opacity: 0.7,
              marginBottom: '3rem',
              lineHeight: 1.5,
              padding: '0 1rem',
            }}
          >
            Para ver los detalles de tu compra en <b>{businessName}</b>, ingresá el DNI del
            comprador y el <b>N° de orden</b>.
          </p>

          <form
            onSubmit={handleVerify}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* DNI Field */}
            <div style={{ textAlign: 'left', position: 'relative' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  paddingLeft: '1.25rem',
                  color: 'var(--md-sys-color-primary)',
                  display: 'block',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}
              >
                Documento de Identidad (DNI)
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="00000000"
                maxLength={12}
                autoFocus
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '24px',
                  border: '2px solid var(--md-sys-color-outline-variant)',
                  background: 'var(--md-sys-color-surface)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  letterSpacing: '0.2em',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--md-sys-color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--md-sys-color-outline-variant)')}
              />
            </div>

            {/* Order Number Field */}
            <div style={{ textAlign: 'left', position: 'relative' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  paddingLeft: '1.25rem',
                  color: 'var(--md-sys-color-tertiary)',
                  display: 'block',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}
              >
                N° de Orden
              </label>
              <input
                type="text"
                value={inputOrderNumber}
                onChange={(e) => setInputOrderNumber(e.target.value)}
                placeholder={orderNumber || 'Ej: ORD-001234'}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '24px',
                  border: '2px solid var(--md-sys-color-outline-variant)',
                  background: 'var(--md-sys-color-surface)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--md-sys-color-tertiary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--md-sys-color-outline-variant)')}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  padding: '1rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18}>error</Icon>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || dni.length < 8 || !inputOrderNumber.trim()}
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'white',
                border: 'none',
                padding: '1.5rem',
                borderRadius: '100px',
                fontWeight: 950,
                fontSize: '1rem',
                textTransform: 'uppercase',
                cursor: 'pointer',
                opacity: loading || dni.length < 8 || !inputOrderNumber.trim() ? 0.5 : 1,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow:
                  dni.length >= 8 && inputOrderNumber.trim()
                    ? '0 15px 30px rgba(var(--md-sys-color-primary-rgb), 0.3)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              {loading ? (
                'VERIFICANDO...'
              ) : (
                <>
                  ACCEDER AL SEGUIMIENTO
                  <Icon>arrow_forward</Icon>
                </>
              )}
            </button>
          </form>

          <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', opacity: 0.5, fontWeight: 700 }}>
            <Icon size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}>
              lock
            </Icon>
            Conexión cifrada de punto a punto
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
