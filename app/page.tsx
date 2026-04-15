'use client';

import { useAuth } from '@/features/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Landing Components
import FooterSection from './(main)/home/FooterSection';
import HeroLanding from './(main)/home/HeroLanding';
import './(main)/home/landing.css';
import LandingNav from './(main)/home/LandingNav';
import PricingSection from './(main)/home/PricingSection';
import ProcessSection from './(main)/home/ProcessSection';
import SolutionsSection from './(main)/home/SolutionsSection';
import StatsSection from './(main)/home/StatsSection';
import TrustSection from './(main)/home/TrustSection';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya está logueado, lo mandamos a su panel
    if (!loading && user) {
      router.replace('/list-business');
    }
  }, [user, loading, router]);

  // Si está cargando o ya hay usuario (y estamos en medio del redireccionamiento)
  if (loading || user) {
    return null;
  }

  // Vista exclusiva para NO AUTHENTICADOS (La leading page)
  return (
    <div className="landing-page-root">
      <LandingNav />
      <main>
        <HeroLanding />
        <SolutionsSection />
        <StatsSection />
        <ProcessSection />
        <PricingSection />
        <TrustSection />
        <FaqSection />
      </main>
      <FooterSection />
    </div>
  );
}
