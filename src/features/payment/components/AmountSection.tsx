'use client';

interface AmountSectionProps {
  currency: string;
  price: number;
  currentMethodLabel: string;
}

export function AmountSection({ currency, price, currentMethodLabel }: AmountSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-400 text-sm font-medium uppercase tracking-[0.2em]">
        Total a pagar
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-white">
          {currency} {price.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="bg-[#135bec] size-2 rounded-full animate-pulse" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Pagando con {currentMethodLabel}
        </span>
      </div>
    </div>
  );
}
