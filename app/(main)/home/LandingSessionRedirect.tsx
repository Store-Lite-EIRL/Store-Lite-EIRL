'use client';

import { useAuth } from '@/features/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirector invisible para la landing. Renderiza null: el contenido de la
// landing vive en el server component y sigue siendo rastreable por crawlers.
// Solo redirige a onboarding cuando detecta una sesión activa.
export default function LandingSessionRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya está logueado, lo mandamos a onboarding
    // (ahí elige qué hacer: crear negocio, unirse a equipo, ir a lista)
    if (!loading && user) {
      router.replace('/onboarding');
    }
  }, [user, loading, router]);

  return null;
}
