import type { Metadata } from 'next';

// Landing Components
import FaqSection from './(main)/home/FaqSection';
import FooterSection from './(main)/home/FooterSection';
import HeroLanding from './(main)/home/HeroLanding';
// Server-rendered landing: crawlers always get real HTML, never an empty shell.
import LandingNav from './(main)/home/LandingNav';
import LandingSessionRedirect from './(main)/home/LandingSessionRedirect';
import PricingSection from './(main)/home/PricingSection';
import ProcessSection from './(main)/home/ProcessSection';
import SolutionsSection from './(main)/home/SolutionsSection';
import StatsSection from './(main)/home/StatsSection';
import TrustSection from './(main)/home/TrustSection';
import './(main)/home/landing.css';

export const metadata: Metadata = {
  description:
    'Crea tu tienda online en minutos con Store Lite: inventario, pedidos y pagos en un solo lugar.',
  alternates: { canonical: '/' },
};

// Vista exclusiva para NO AUTENTICADOS (La leading page).
// La sesión se resuelve en cliente vía LandingSessionRedirect: si hay usuario,
// redirige a /onboarding sin ocultar el contenido estático del server.
export default function HomePage() {
  return (
    <div className="landing-page-root">
      <LandingSessionRedirect />
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
