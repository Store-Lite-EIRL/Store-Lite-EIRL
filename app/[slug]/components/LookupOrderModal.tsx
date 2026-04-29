'use client';

import { useState } from 'react';
import { Icon } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';

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
        // Generar token de auth (sesión de 1 hora)
        const authTokenData = {
          token: data.token, // trackingToken para la URL
          expiresAt: Date.now() + (1 * 60 * 60 * 1000), // 1 hora
        };
        // Guardar en localStorage bajo la key del negocio
        localStorage.setItem(`order_session_${businessSlug}`, JSON.stringify(authTokenData));
        
        // Redirigir a /order/{token}
        router.push(`/${businessSlug}/order/${data.token}`);
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a2e] rounded-3xl border border-white/10 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-all"
        >
          <Icon className="material-symbols-outlined text-slate-400">close</Icon>
        </button>

        <h2 className="text-xl font-black text-white mb-2">Ver mi Pedido</h2>
        <p className="text-sm text-slate-400 mb-6">
          Ingresa tu DNI y número de orden para ver el estado de tu compra.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              DNI (8 dígitos)
            </label>
            <input
              type="text"
              placeholder="12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, '').substring(0, 8))}
              maxLength={8}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#135bec]/50 transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Número de Orden
            </label>
            <input
              type="text"
              placeholder="Ej: ORD-001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#135bec]/50 transition-all"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
              <Icon className="material-symbols-outlined text-red-500 text-sm">error</Icon>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-2xl disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-[#135bec] group-hover:bg-[#1565f5] transition-colors" />
            <div className="relative py-5 px-6 flex items-center justify-center gap-3">
              {loading ? (
                <span className="flex items-center gap-2 text-white font-black uppercase tracking-wide text-sm">
                  <Icon className="material-symbols-outlined animate-spin">progress_activity</Icon>
                  Buscando...
                </span>
              ) : (
                <span className="text-white font-black uppercase tracking-wide text-sm">
                  Ver mi Pedido
                </span>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
