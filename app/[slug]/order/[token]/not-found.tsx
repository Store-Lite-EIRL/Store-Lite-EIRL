import { Icon } from '@/shared/components/ui';
import Link from 'next/link';

export default function OrderNotFound() {
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] antialiased p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--md-sys-color-surface-container)] rounded-[2rem] p-8 md:p-12 border border-[var(--md-sys-color-outline-variant)] shadow-sm text-center flex flex-col gap-6 items-center">
        <div className="bg-[var(--md-sys-color-error-container)] p-6 rounded-full text-[var(--md-sys-color-on-error-container)]">
          <Icon size={64}>search_off</Icon>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight uppercase">Orden no encontrada</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-balance">
            No pudimos encontrar la orden que estás buscando. Por favor, verifica que el enlace sea
            correcto o contacta al vendedor.
          </p>
        </div>

        <div className="w-full h-px bg-[var(--md-sys-color-outline-variant)] my-2" />

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/"
            className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] py-4 px-8 rounded-full font-black uppercase text-xs tracking-[0.2em] transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-[var(--md-sys-color-primary)]/20"
          >
            Ir al inicio
          </Link>

          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold tracking-widest">
            Store Lite - Tu compra segura
          </p>
        </div>
      </div>
    </div>
  );
}
