import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import AppLayout from '@/shared/components/layout/AppLayout';
import { Icon } from '@/shared/components/ui/data-display';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import style from './ListBusiness.module.css';
import BusinessGrid from './components/BusinessGrid';
import CreateBusinessButton from './components/CreateBusinessButton';
import LogoutButton from './components/LogoutButton';

export default async function ListBusinessPage() {
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get('selected_business_slug')?.value;

  if (selectedSlug) {
    redirect(`/${selectedSlug}`);
  }

  // 1. Get authenticated user
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

  // 2. Fetch businesses for this owner
  const myBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
    orderBy: (businesses, { desc }) => [desc(businesses.createdAt)],
  });

  return (
    <AppLayout>
      <div className={style.listingContainer}>
        <header className={style.header}>
          <div>
            <h1 className={style.title}>Mis Negocios</h1>
            <p className={style.subtitle}>
              Selecciona una empresa para gestionar o visualiza su tienda.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <CreateBusinessButton hasReachedLimit={myBusinesses.length >= 3} />
            <LogoutButton />
          </div>
        </header>

        {myBusinesses.length > 0 ? (
          <BusinessGrid businesses={myBusinesses} />
        ) : (
          <div className={style.emptyState}>
            <Icon style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>business</Icon>
            <h2 className={style.emptyTitle}>Aún no tienes empresas registradas</h2>
            <CreateBusinessButton hasReachedLimit={myBusinesses.length >= 3} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
