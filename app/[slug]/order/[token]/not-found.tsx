'use client';

import { Icon } from '@/shared/components/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderNotFound() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] antialiased p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--md-sys-color-surface-container)] rounded-[2rem] p-8 md:p-12 border border-[var(--md-sys-color-outline-variant)] shadow-sm text-center flex flex-col gap-6 items-center">
        <div className="bg-[var(--md-sys-color-error-container)] p-6 rounded-full text-[var(--md-sys-color-on-error-container)]">
          <Icon size={64}>search_off</Icon>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight uppercase">Orden no encontrada</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-balance">
            No pudimos encontrar la orden que estás buscando. El enlace podría ser incorrecto, la
            orden pudo haber expirado o el pedido fue realizado en otra tienda.
          </p>
        </div>

        <div className="w-full h-px bg-[var(--md-sys-color-outline-variant)] my-2" />

        <div className="flex flex-col gap-3 w-full">
          {slug && (
            <Link
              href={`/${slug}`}
              className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] py-4 px-8 rounded-full font-black uppercase text-xs tracking-[0.2em] transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-[var(--md-sys-color-primary)]/20"
            >
              <span className="flex items-center justify-center gap-2">
                <Icon size={18}>store</Icon>
                Ir a la tienda
              </span>
            </Link>
          )}
          <Link
            href="/"
            className="text-[var(--md-sys-color-on-surface-variant)] py-3 px-8 rounded-full font-bold uppercase text-xs tracking-[0.15em] border border-[var(--md-sys-color-outline-variant)] transition-all hover:bg-[var(--md-sys-color-surface-container-high)] active:scale-95"
          >
            Ir al inicio
          </Link>
        </div>

        <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold tracking-widest">
          Store Lite - Tu compra segura
        </p>
      </div>
    </div>
  );
}
