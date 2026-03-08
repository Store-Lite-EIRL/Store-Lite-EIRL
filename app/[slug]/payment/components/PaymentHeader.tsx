'use client';

interface PaymentHeaderProps {
  businessName: string;
}

export function PaymentHeader({ businessName }: PaymentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="bg-white/10 p-2 rounded-lg">
          <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-white tracking-tight">{businessName}</h1>
        <div className="size-1.5 rounded-full bg-slate-500/50" />
      </div>
    </div>
  );
}
