'use client';

interface OrderSummaryProps {
  productName: string;
  price: number;
  currency: string;
  onClose?: () => void;
}

export function OrderSummary({ productName, price, currency }: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Dalle-3 Sorteo
        </span>
        <div className="h-px flex-1 mx-4 bg-white/5" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#135bec]">
          En Vivo
        </span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center gap-6 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#135bec]/5 rounded-full blur-3xl" />

        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-[#135bec] text-3xl">Auto_Fix_High</span>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-white font-black text-xl tracking-tight">{productName}</h3>
          <p className="text-slate-500 text-xs font-medium max-w-[200px]">
            Suscripción premium con acceso ilimitado a generación de imágenes
          </p>
        </div>

        <div className="flex items-center justify-between w-full pt-6 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              Total a pagar
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-slate-400 text-sm font-black">{currency}</span>
              <span className="text-white text-3xl font-black">{price.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="text-[10px] font-black uppercase tracking-wider">Plan Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
