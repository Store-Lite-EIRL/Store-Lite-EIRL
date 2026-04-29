'use client';

import { Button, Dialog, Icon, TextField } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface TrackOrderModalProps {
  open: boolean;
  onClose: () => void;
  businessSlug: string;
}

export function TrackOrderModal({ open, onClose, businessSlug }: TrackOrderModalProps) {
  const [dni, setDni] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClose = () => {
    onClose();
    setDni('');
    setOrderNumber('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/order/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, orderNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se encontró el pedido');
      }

      router.push(`/${businessSlug}/order/${data.token}?dni=${dni}`);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <div slot="headline" className="flex items-center gap-3">
        <Icon>package_2</Icon>
        <span className="font-bold tracking-tight">Seguimiento de Pedido</span>
      </div>

      <form
        id="track-order-form"
        slot="content"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 py-4"
      >
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          Ingresa tus datos para conocer el estado actual de tu pedido.
        </p>

        <TextField
          label="DNI del Comprador"
          placeholder="8 dígitos"
          value={dni}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => setDni(e.target.value)}
          required
          minLength={8}
          maxLength={8}
          error={!!error}
        >
          <Icon slot="leading-icon">fingerprint</Icon>
        </TextField>

        <TextField
          label="Número de Orden"
          placeholder="Ej: #12345"
          value={orderNumber}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => setOrderNumber(e.target.value)}
          required
          error={!!error}
          errorText={error || undefined}
        >
          <Icon slot="leading-icon">tag</Icon>
        </TextField>

        {loading && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--md-sys-color-primary)]" />
          </div>
        )}
      </form>

      <div slot="actions">
        <Button variant="text" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="filled" form="track-order-form" type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Consultar'}
        </Button>
      </div>
    </Dialog>
  );
}
