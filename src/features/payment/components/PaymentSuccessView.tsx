import { Button } from '@/shared/components/ui';
import * as React from 'react';

interface PaymentSuccessViewProps {
  productName: string;
  amount: string;
  currency: string;
  deliveryCode: string;
  culqiChargeId?: string;
  onClose: () => void;
}

export function PaymentSuccessView({
  productName,
  amount,
  currency,
  deliveryCode,
  culqiChargeId,
  onClose,
}: PaymentSuccessViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deliveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Dynamic Success Icon */}
      <div className="relative group">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100 dark:bg-emerald-900/30 opacity-40 duration-[3s]" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_30px_-5px_theme(colors.emerald.400)] dark:shadow-none">
          <span className="material-symbols-outlined text-white text-[56px]">check_circle</span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          ¡Pago Exitoso!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[300px] leading-relaxed">
          Tu compra de{' '}
          <span className="font-bold text-slate-900 dark:text-slate-200">{productName}</span> por{' '}
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {currency} {amount}
          </span>{' '}
          ha sido confirmada.
        </p>
      </div>

      {/* Premium Ticket Card */}
      <div className="relative w-full max-w-[320px] rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="p-8 pb-6 flex flex-col items-center gap-5">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">
            Código de Canje
          </div>

          <div className="relative">
            <span className="font-mono text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-slate-100 drop-shadow-sm font-display">
              {deliveryCode}
            </span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500/30 rounded-full" />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {copied ? 'done' : 'content_copy'}
            </span>
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
        </div>

        {/* Realistic Ticket Perforation */}
        <div className="relative h-6 w-full flex items-center justify-center">
          <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900" />
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700 mx-4" />
          <div className="absolute right-0 translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900" />
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 flex gap-3 items-center">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">
            warning
          </span>
          <p className="text-[11px] font-bold leading-tight text-amber-800 dark:text-amber-200 text-left">
            PRESENTA ESTE CÓDIGO al vendedor para que pueda entregarte tu producto físico.
          </p>
        </div>
      </div>

      <div className="w-full space-y-4">
        {culqiChargeId && (
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Transacción: {culqiChargeId}
          </p>
        )}

        <Button
          variant="filled"
          onClick={onClose}
          className="w-full h-14 rounded-3xl bg-[#1a1a1a] hover:bg-black text-white font-bold text-base shadow-lg shadow-black/10 active:scale-[0.98] transition-transform"
        >
          Finalizar Compra
        </Button>
      </div>
    </div>
  );
}
