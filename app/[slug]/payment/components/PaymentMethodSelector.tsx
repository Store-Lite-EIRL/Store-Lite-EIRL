'use client';

import { Icon } from '@/shared/components/ui';

export type PaymentMethodId = 'card' | 'yape' | 'plin' | 'mp';

interface PaymentMethodSelectorProps {
  paymentMethods: { id: PaymentMethodId; label: string; icon: string }[];
  activeTab: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

export function PaymentMethodSelector({
  paymentMethods,
  activeTab,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Métodos de Pago
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {paymentMethods.map((method) => {
          const isActive = activeTab === method.id;
          const isYape = method.id === 'yape';

          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`
                relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-300 border
                ${
                  isActive
                    ? 'bg-white/10 border-[#135bec] shadow-[0_10px_30px_rgba(19,91,236,0.15)] scale-[1.02]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }
              `}
            >
              {isYape && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              <div
                className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-[#135bec] text-white' : 'bg-slate-900 text-slate-500'}
              `}
              >
                <Icon>{method.icon}</Icon>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}
                >
                  {method.label}
                </span>
                {isActive && (
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#135bec]">
                    Seleccionado
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
