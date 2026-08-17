import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { formatSoles, PLAN_PRICES } from '@/shared/billing/planPrices';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { PricingBackButton } from './components/PricingBackButton';
import type { PricingCardProps } from './components/PricingCard';
import { PricingCard } from './components/PricingCard';
import './pricing.css';

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const searchParamsAwaited = await searchParams;
  const slug = searchParamsAwaited.slug as string;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myBusinesses: any[] = [];
  if (user) {
    const rawBusinesses = await db.query.businesses.findMany({
      where: eq(businesses.ownerId, user.id),
      orderBy: (businesses, { desc }) => [desc(businesses.createdAt)],
      with: {
        subscriptions: {
          where: (subscriptions, { eq }) => eq(subscriptions.planStatus, 'active'),
          limit: 1,
        },
      },
    });
    myBusinesses = rawBusinesses.map((b) => ({
      ...b,
      planType: b.subscriptions?.[0]?.planType || 'basico',
      planEndDate: b.subscriptions?.[0]?.planEndDate,
    }));
  }

  const preselectedBusinessId = myBusinesses.find((b) => b.slug === slug)?.id;

  const plans: PricingCardProps[] = [
    {
      title: 'Plan Emprendedor',
      description:
        'La base sólida e inteligente para formalizar y despegar tu primer gran proyecto.',
      price: formatSoles(PLAN_PRICES.emprendedor.monthly),
      period: 'mes',
      buttonText: 'Comenzar ahora',
      buttonVariant: 'outlined',
      features: [
        { text: 'Dominio personalizado + SEO' },
        { text: 'Catálogo de hasta 150 productos' },
        { text: 'Gestión de pedidos: Vía WhatsApp y Chat directo' },
        { text: 'Control total: Activa o desactiva tu negocio al instante' },
      ],
    },
    {
      title: 'Plan Business Pro',
      description: 'Escala sin límites con herramientas avanzadas de personalización y equipo.',
      price: formatSoles(PLAN_PRICES.business_pro.monthly),
      period: 'mes',
      buttonText: 'Impulsar mi negocio',
      buttonVariant: 'filled',
      isHighlighted: true,
      badgeText: 'Más popular',
      badgeType: 'primary',
      features: [
        { text: 'Pasarela completa: Pagos digitales y tarjetas bancarias' },
        { text: 'Almacenamiento premium para 300 productos' },
        { text: 'Personalización avanzada: Edición del negocio' },
        { text: 'Colaboración élite: Equipo de trabajo con 2 usuarios adicionales' },
        { text: 'Centro de mando: Dashboard de ventas y métricas de progreso' },
        { text: 'Servicio de envios con Urbano en tiempo real' },
      ],
    },
    {
      title: 'Plan Enterprise AI',
      description:
        'La solución definitiva con potencia de Inteligencia Artificial y datos masivos.',
      price: formatSoles(PLAN_PRICES.enterprise_ai.monthly),
      period: 'mes',
      buttonText: 'Obtener máxima potencia',
      buttonVariant: 'tonal',
      badgeText: 'Edición Limitada',
      badgeType: 'secondary',
      features: [
        { text: 'Ecosistema total: Incluye todos los beneficios previos' },
        { text: 'Asistencia técnica prioritaria 24/7 con expertos' },
        {
          text: 'Potencial ilimitado: 1000+ productos y presentación premium con hasta 3 imágenes por producto',
        },
        { text: 'Presentación premium con hasta 3 imágenes por producto' },
        { text: 'Escalabilidad extendida: 5 usuarios adicionales para tu equipo' },
        { text: 'Inteligencia en tiempo real: Dashboard interactivo con sugerencias IA' },
        { text: 'Base de datos exclusiva para fidelización de tus clientes' },
      ],
    },
  ];

  return (
    <div className="pricing-page-container">
      <div className="pricing-top-actions">
        <PricingBackButton />
      </div>

      <div className="pricing-header">
        <h1 className="pricing-title">Planes y Precios</h1>
        <p className="pricing-subtitle">
          Elige el plan que mejor se adapte al tamaño y las necesidades de tu negocio. Cambia o
          cancela en cualquier momento.
        </p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <PricingCard
            key={index}
            {...plan}
            businesses={myBusinesses}
            preselectedBusinessId={preselectedBusinessId}
          />
        ))}
      </div>
    </div>
  );
}
