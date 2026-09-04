import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CreateBusinessLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

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

  // Si no está logueado, redirigir al login
  if (!user) {
    redirect('/auth');
  }

  // Verificar el límite de 3 negocios (Guard a nivel de ruta)
  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
    columns: { id: true },
  });

  if (userBusinesses.length >= 3) {
    // Si ya tiene 3 o más, no puede acceder a esta ruta. Lo enviamos a la lista.
    redirect('/list-business');
  }

  return <>{children}</>;
}
