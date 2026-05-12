'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { getBusinessPath } from '@/shared/utils/url';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LookupOrderModalProps {
  open: boolean;
  onClose: () => void;
  businessSlug: string;
}

export function LookupOrderModal({ open, onClose, businessSlug }: LookupOrderModalProps) {
  const router = useRouter();
  const [dni, setDni] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.length < 8 || !orderNumber.trim()) {
      setError('Completa todos los campos correctamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/order/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, orderNumber, businessSlug }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        // Guardar sesión local de 1 hora por seguridad
        const SESSION_TTL = 1 * 60 * 60 * 1000; // 1 hora en milisegundos
        const authTokenData = {
          token: data.token,
          dni: dni, // Guardamos el DNI para que OrderAuthGate pueda verificar
          expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(`order_session_${data.token}`, JSON.stringify(authTokenData));

        router.push(getBusinessPath(businessSlug, `/order/${data.token}`));
        onClose();
      } else {
        setError(data.error || 'Orden no encontrada. Verifica tus datos.');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} id="lookup-order-dialog">
      {/* MD3 Dialog Headline */}
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon>search</Icon>
        Ver mi Pedido
      </div>

      {/* MD3 Dialog Content */}
      <div slot="content">
        <p
          style={{
            marginBottom: '1.5rem',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: '0.875rem',
            lineHeight: '1.4',
          }}
        >
          Ingresa tu DNI y número de orden para ver el estado de tu compra.
        </p>

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

      {/* MD3 Dialog Actions */}
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
    </Dialog>
  );
}
