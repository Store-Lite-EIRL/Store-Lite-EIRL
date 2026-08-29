import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { formatSoles, PLAN_PRICES } from '@/shared/billing/planPrices';
import { Icon } from '@/shared/components/ui/data-display';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PricingBackButton } from './components/PricingBackButton';
import type { BusinessPlanOption, PricingCardProps } from './components/PricingCard';
import { PricingCard } from './components/PricingCard';
import './pricing.css';

export const metadata: Metadata = {
  title: 'Planes y precios',
  description:
    'Crea tu tienda online en minutos y elige el plan ideal para tu negocio. Acepta pagos con tarjetas vía Culqi y haz crecer tu marca en Perú.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/pricing' },
};

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

  let myBusinesses: BusinessPlanOption[] = [];
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
      marketingNote: 'Ahorra 10% con pago anual',
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
      marketingNote: 'Ahorra 10% con pago anual',
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
        { text: 'Integración con envíos Urbano' },
      ],
    },
    {
      title: 'Plan Enterprise Pro',
      description:
        'Para marcas que necesitan el máximo rendimiento y todas las herramientas para escalar.',
      price: formatSoles(PLAN_PRICES.enterprise_pro.monthly),
      marketingNote: 'Ahorra 10% con pago anual',
      period: 'mes',
      buttonText: 'Obtener máxima potencia',
      buttonVariant: 'tonal',
      badgeText: 'Edición Limitada',
      badgeType: 'secondary',
      features: [
        { text: 'Ecosistema total: Incluye todos los beneficios previos' },
        { text: 'Potencial ampliado: 600 productos' },
        { text: 'Presentación premium con hasta 3 imágenes por producto' },
        { text: 'Escalabilidad extendida: 4 usuarios adicionales para tu equipo' },
        { text: 'Dashboard avanzado con métricas en tiempo real' },
      ],
    },
  ];

  const headerIcons = [
    { label: 'Chat', icon: 'chat' },
    { label: 'Productos', icon: 'shopping_bag' },
    { label: 'Seguridad', icon: 'security' },
    { label: 'Soporte', icon: 'support_agent' },
  ];

  return (
    <div className="pricing-page-container">
      <div className="pricing-shell-row">
        <div className="pricing-content-shell">
          <div className="pricing-top-actions">
            <PricingBackButton />
          </div>

          <div className="pricing-header">
            <div className="pricing-header-icons" aria-label="Características principales">
              {headerIcons.map(({ label, icon }) => (
                <div key={label} className="pricing-header-icon-item" title={label}>
                  <span className="pricing-header-icon" aria-hidden="true">
                    <Icon>{icon}</Icon>
                  </span>
                </div>
              ))}
            </div>

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

          {/* ── Sobre los pagos con Culqi ── */}
          <div className="pricing-culqi-note" role="note">
            <p className="pricing-culqi-note-title">
              <Icon>credit_card</Icon>
              Sobre los pagos con Culqi
            </p>
            <ul className="pricing-culqi-note-list">
              <li>
                <strong>Culqi</strong> es la pasarela de pagos que procesa los cobros de su tienda:
                tarjetas de crédito y débito (Visa, Mastercard, American Express), Yape, Plin,
                billeteras móviles, Cuotéalo BCP y PagoEfectivo.
              </li>
              <li>
                Está incluida en los planes <strong>Business Pro</strong> y{' '}
                <strong>Enterprise Pro</strong>.
              </li>
              <li>
                Antes de activar pagos reales,{' '}
                <strong>Culqi valida su comercio de forma independiente</strong>: su tienda debe
                cumplir requisitos (al menos 5 productos con imagen, precio y descripción, Términos
                y Condiciones, Políticas de Devoluciones, Libro de Reclamaciones, datos de contacto
                y redes sociales).
              </li>
            </ul>
            <p className="pricing-culqi-note-warning">
              ⚠️ La validación de Culqi demora entre 1 y 3 días hábiles. Tenga en cuenta este tiempo
              al elegir la duración de su plan. Puede preparar su tienda con el checklist de
              requisitos en Configuración → Pagos, incluso antes de suscribirse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
