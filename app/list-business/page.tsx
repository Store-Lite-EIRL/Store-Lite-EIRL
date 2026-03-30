import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import AppLayout from '@/shared/components/layout/AppLayout';
import { Icon } from '@/shared/components/ui/data-display';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';

import style from './ListBusiness.module.css';
import BusinessGrid from './components/BusinessGrid';
import CreateBusinessButton from './components/CreateBusinessButton';
import LogoutButton from './components/LogoutButton';
import PremiumButton from './components/PremiumButton';

export default async function ListBusinessPage() {
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get('selected_business_slug')?.value;

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

  if (!user) {
    redirect('/auth');
  }

  const rawBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
    orderBy: (businesses, { desc }) => [desc(businesses.createdAt)],
    with: {
      subscriptions: {
        where: (subscriptions, { eq }) => eq(subscriptions.planStatus, 'active'),
        limit: 1,
      }
    }
  });

  const myBusinesses = rawBusinesses.map(b => ({
    ...b,
    planType: b.subscriptions?.[0]?.planType || 'basico',
  }));

  if (selectedSlug && myBusinesses.some((business) => business.slug === selectedSlug)) {
    redirect(`/${selectedSlug}`);
  }

  // Derive display name and avatar initial from user metadata
  const displayName: string =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuario';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const userEmail: string = user.email ?? '';

  return (
    <AppLayout>
      <div className={style.listingContainer}>
        {/* ── Branding ── */}
        <div className={style.brandHeader}>
          <div className={style.brandLogo}>
            <Image
              src="/img/icon.png"
              alt="Store Lite Logo"
              width={50}
              height={50}
              className={style.brandImage}
            />
          </div>
          <span className={style.brandName}>Store Lite</span>
        </div>

        {/* ── Hero / Header ── */}
        <div className={style.hero}>
          {/* Left: user info */}
          <div className={style.heroLeft}>
            <div className={style.userAvatar}>{avatarInitial}</div>
            <div className={style.userInfo}>
              <span className={style.heroEyebrow}>Bienvenido de vuelta</span>
              <h1 className={style.heroTitle}>{displayName}</h1>
              <span className={style.userEmail}>{userEmail}</span>
            </div>
          </div>

          {/* Right: actions in one row */}
          <div className={style.heroActions}>
            <CreateBusinessButton hasReachedLimit={myBusinesses.length >= 3} />
            <LogoutButton />
          </div>
        </div>

        {/* ── Content ── */}
        {myBusinesses.length > 0 ? (
          <>
            <div className={style.sectionHeader}>
              <span className={style.sectionTitle}>
                {myBusinesses.length === 1
                  ? '1 negocio registrado'
                  : `${myBusinesses.length} negocios registrados`}
              </span>
            </div>
            <BusinessGrid businesses={myBusinesses} />
          </>
        ) : (
          <div className={style.emptyState}>
            <div className={style.emptyIllustration}>
              <div className={style.emptyCircle}>
                <Icon className={style.emptyIcon}>add_business</Icon>
              </div>
            </div>
            <div className={style.emptyContent}>
              <h2 className={style.emptyTitle}>Crea tu primer negocio</h2>
              <p className={style.emptySubtitle}>
                Lanza tu tienda en minutos y empieza a vender desde cualquier lugar del mundo.
              </p>
            </div>
            <CreateBusinessButton hasReachedLimit={false} />
          </div>
        )}

        {/* ── Footer / Limit Info ── */}
        <div className={style.limitFooter}>
          <div className={style.limitInfo}>
            <Icon className={style.limitIcon}>info</Icon>
            <p className={style.limitText}>
              {myBusinesses.length < 3 ? (
                <>
                  {'Te quedan '}
                  <strong>{3 - myBusinesses.length}</strong>
                  {' de '}
                  <strong>3</strong>
                  {' negocios disponibles en el plan gratuito.'}
                </>
              ) : (
                <>
                  {'Invierte en tus '}
                  <strong>{myBusinesses.length}</strong>
                  {' negocios y se el lider de tu industria.'}
                </>
              )}
            </p>
          </div>
          <PremiumButton />
        </div>
      </div>
    </AppLayout>
  );
}
