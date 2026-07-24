'use client';

import { loadCulqiScript } from '@/shared/payments/culqiScript';
import React, { useCallback, useEffect, useState } from 'react';

interface CulqiCheckoutProps {
  planId: string;
  planName: string;
  amount: number; // Monto en céntimos (ej. 10.00 = 1000)
  businessName?: string; // Nombre del negocio seleccionado
  period?: string; // "mes" | "año" etc.
  disabled?: boolean;
  onTokenSuccess: (token: string) => void;
  onOpening?: () => void;
  children: React.ReactNode;
}

export function CulqiCheckout({
  planId,
  planName,
  amount,
  businessName,
  period = 'mes',
  disabled = false,
  onTokenSuccess,
  onOpening,
  children,
}: CulqiCheckoutProps) {
  const [isCulqiReady, setIsCulqiReady] = useState(false);

  // Inicializa las opciones de Culqi una vez que el script carga
  const initCulqi = useCallback(() => {
    if (window.Culqi) {
      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PK;

      // Descripción rica: muestra plan, negocio y período al usuario
      const businessLabel = businessName ? ` · ${businessName}` : '';
      const description = `Plan ${planName}${businessLabel} — por ${period}`;

      window.Culqi.settings({
        title: `Store Lite | ${planName}`,
        currency: 'PEN',
        description,
        amount,
      });

      window.Culqi.options({
        lang: 'auto',
        modal: true,
        installments: true,
        style: {
          // Color primario del sistema de diseño de Store Lite
          maincolor: '#0061A4',
        },
      });
      setIsCulqiReady(true);
    }
  }, [amount, planName, businessName, period]);

  // Re-inicializar si las props cambian pero el script ya había cargado
  useEffect(() => {
    if (window.Culqi) {
      initCulqi();
    }
  }, [initCulqi]);

  // Hookea la función global `culqi` que es invocada por el v4 interno
  useEffect(() => {
    window.culqi = function () {
      if (window.Culqi?.token) {
        const token = window.Culqi.token.id;
        console.log('✅ Token de Culqi recibido exitosamente:', token, 'para el plan:', planId);
        window.Culqi.close();
        onTokenSuccess(token);
      } else if (window.Culqi?.error) {
        console.error('❌ Error desde Culqi:', window.Culqi.error);
      }
    };

    return () => {
      // Limpieza preventiva (aunque el window.culqi podría quedarse)
      window.culqi = () => {};
    };
  }, [onTokenSuccess, planId]);

  const openCheckout = async () => {
    if (disabled) return;

    const culqi = window.Culqi;
    if (culqi) {
      initCulqi();
      if (onOpening) onOpening();
      culqi.open();
    } else {
      console.log('🔄 Culqi no detectado, intentando cargar manualmente...');
      try {
        await loadCulqiScript(process.env.NEXT_PUBLIC_CULQI_PK || '');
        initCulqi();
        if (onOpening) onOpening();
        const culqiAfterLoad = window.Culqi;
        if (culqiAfterLoad) culqiAfterLoad.open();
      } catch (error) {
        console.error('❌ Error cargando Culqi al intentar pagar:', error);
      }
    }
  };

  useEffect(() => {
    loadCulqiScript(process.env.NEXT_PUBLIC_CULQI_PK || '')
      .then(() => {
        if (window.Culqi) setIsCulqiReady(true);
      })
      .catch(() => {
        console.error('Failed to load Culqi script');
      });
  }, []);

  return (
    <div
      onClick={openCheckout}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-block',
        width: '100%',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
      title={!isCulqiReady ? 'Cargando pasarela de pagos segura...' : ''}
    >
      {children}
    </div>
  );
}
