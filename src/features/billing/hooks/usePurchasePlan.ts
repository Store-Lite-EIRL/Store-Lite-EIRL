'use client';

import { createClient } from '@/lib/supabase/client';
import { toPng } from 'html-to-image';
import { useCallback, useRef, useState } from 'react';

/**
 * usePurchasePlan
 * Hook que orquesta el flujo completo de compra de un plan SaaS:
 *  1. POST /api/billing/purchase-plan → cobra, guarda en BD, activa suscripción
 *  2. Captura PlanTicketTemplate como PNG (html-to-image, igual que en Checkout)
 *  3. Upload a Supabase bucket 'tickets_plans'
 *  4. POST /api/billing/update-plan-ticket → guarda ticket_url en plan_payments
 */

export interface PurchasePlanData {
  token: string;
  planType: 'basico' | 'emprendedor' | 'business_pro' | 'enterprise_ai';
  period: 'monthly' | 'annual';
  businessId: string;
  buyerEmail: string;
  buyerFullName: string;
  buyerDocumentType: 'DNI' | 'RUC';
  buyerDocumentNumber: string;
  buyerAddress?: string;
}

export interface PurchasePlanResult {
  planPaymentId: string;
  ticketNumber: string;
  planActivatedUntil: string;
  amountTotal: number;
  ticketUrl?: string;
}

export function usePurchasePlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchasePlanResult | null>(null);

  const [capturingData, setCapturingData] = useState<
    (PurchasePlanResult & { buyerData: PurchasePlanData }) | null
  >(null);

  /**
   * Ref al nodo DOM del PlanTicketTemplate para capturar con html-to-image.
   */
  const ticketRef = useRef<HTMLDivElement>(null);

  const purchase = useCallback(
    async (data: PurchasePlanData): Promise<PurchasePlanResult | null> => {
      setLoading(true);
      setError(null);
      setCapturingData(null);

      try {
        // ── 1. Comprar el plan en el backend ───────────────────────────────────
        const purchaseResponse = await fetch('/api/billing/purchase-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const purchaseJson = await purchaseResponse.json();

        if (!purchaseResponse.ok || !purchaseJson.success) {
          const errorMsg =
            purchaseJson.details || purchaseJson.error || 'Error al procesar el pago';
          setError(errorMsg);
          return null;
        }

        const purchaseResult = purchaseJson as PurchasePlanResult;

        // ── 2. Preparar datos para el render del ticket ────────────────────────
        // Seteamos estos datos para que el PlanTicketTemplate se renderice en el DOM
        setCapturingData({ ...purchaseResult, buyerData: data });

        // Esperar dos frames para asegurar que React renderizó y fuentes cargadas
        await new Promise((resolve) => setTimeout(resolve, 600));

        let ticketUrl: string | undefined;

        // ── 3. Generar PNG del ticket ──────────────────────────────────────────
        if (ticketRef.current) {
          try {
            // IMPORTANTE: skipFonts:true es la única solución real al SecurityError.
            // html-to-image itera document.styleSheets internamente para inlinear fuentes.
            // Esto falla con SecurityError en hojas cross-origin (Google Fonts, Material Symbols, etc.).
            // El `filter` solo filtra nodos DOM, NO el proceso de lectura de stylesheets.
            // Con skipFonts:true la librería omite ese proceso completamente.
            // Las fuentes del sistema (Inter, Roboto, Segoe UI) seguirán funcionando correctamente.
            const dataUrl = await toPng(ticketRef.current, {
              cacheBust: true,
              backgroundColor: '#ffffff',
              pixelRatio: 2,
              skipFonts: true,
              quality: 0.95,
            });

            // ── 4. Subir PNG a Supabase bucket 'tickets_plans' ─────────────────
            const supabase = createClient();
            const blob = await fetch(dataUrl).then((r) => r.blob());
            const fileName = `${purchaseResult.ticketNumber.replace('-', '_')}_${purchaseResult.planPaymentId}.png`;

            const { error: uploadError } = await supabase.storage
              .from('tickets_plans')
              .upload(fileName, blob, { contentType: 'image/png', upsert: true });

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from('tickets_plans').getPublicUrl(fileName);

              ticketUrl = publicUrl;

              // ── 5. Actualizar ticket_url en plan_payments ────────────────────
              await fetch('/api/billing/update-plan-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planPaymentId: purchaseResult.planPaymentId, ticketUrl }),
              });
            }
          } catch (ticketError) {
            console.error('[usePurchasePlan] Error generando ticket PNG:', ticketError);
          }
        }

        const finalResult: PurchasePlanResult = {
          ...purchaseResult,
          ticketUrl,
        };

        setResult(finalResult);
        setCapturingData(null);
        return finalResult;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error inesperado al comprar el plan';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setLoading(false);
    setCapturingData(null);
  }, []);

  return {
    purchase,
    loading,
    error,
    result,
    capturingData,
    ticketRef,
    reset,
  };
}
