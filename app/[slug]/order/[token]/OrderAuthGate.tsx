'use client';

import { Icon } from '@/shared/components/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { verifyOrderAccess } from './actions';

interface OrderAuthGateProps {
  token: string;
  businessName: string;
  children: React.ReactNode;
}

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 Horas

export default function OrderAuthGate({ token, businessName, children }: OrderAuthGateProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `order_session_${token}`;

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Verificar si hay sesión válida en LocalStorage
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { expiresAt } = JSON.parse(stored);
        if (Date.now() < expiresAt) {
          setIsAuthenticated(true);
          return;
        }
      }

      // 2. Si no hay sesión, verificar si el DNI viene por URL (Auto-Auth)
      const dniFromUrl = searchParams.get('dni');
      if (dniFromUrl && dniFromUrl.length >= 8) {
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

            // Limpiar el DNI de la URL para mayor privacidad
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('dni');
            const query = newParams.toString() ? `?${newParams.toString()}` : '';
            router.replace(`${pathname}${query}`);
            return;
          }
        } catch (err) {
          console.error('[OrderAuthGate] Auto-auth error:', err);
        } finally {
          setLoading(false);
        }
      }

      setIsAuthenticated(false);
    };

    checkAuth();
  }, [storageKey, searchParams, token, pathname, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.length < 8) {
      setError('DNI inválido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOrderAccess(token, dni);
      if (res.success) {
        const sessionData = {
          dni,
          expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(storageKey, JSON.stringify(sessionData));
        setIsAuthenticated(true);
      } else {
        setError(res.error || 'DNI no coincide con esta orden');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--md-sys-color-surface)',
        }}
      >
        <p style={{ fontWeight: 900, opacity: 0.4 }}>VALIDANDO ACCESO SEGURO...</p>
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
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '40px',
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'var(--md-sys-color-primary)',
              color: 'white',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
            }}
          >
            <Icon size={40}>lock</Icon>
          </div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Seguimiento Seguro
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '2.5rem' }}>
            Para proteger tu privacidad, ingresa tu DNI para ver los detalles de la orden en{' '}
            <b>{businessName}</b>.
          </p>

          <form
            onSubmit={handleVerify}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  paddingLeft: '1rem',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                Número de DNI
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa tu DNI"
                maxLength={12}
                autoFocus
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  borderRadius: '16px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  background: 'var(--md-sys-color-surface)',
                  fontSize: '1rem',
                  marginTop: '4px',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <p
                style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', fontWeight: 700 }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || dni.length < 8}
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'white',
                border: 'none',
                padding: '1.25rem',
                borderRadius: '100px',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: 'pointer',
                opacity: loading || dni.length < 8 ? 0.5 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'VERIFICANDO...' : 'DESBLOQUEAR SEGUIMIENTO'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
