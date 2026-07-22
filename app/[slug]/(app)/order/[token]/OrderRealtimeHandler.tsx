'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderRealtimeHandler({ orderId }: { orderId: string }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Escuchamos cambios en la tabla payments para este ID específico
    const channel = supabase
      .channel(`payment_update_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `id=eq.${orderId}`,
        },
        () => {
          console.log('[Realtime] Payment updated, refreshing...');
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, router]);

  return null;
}
