import type { Metadata } from 'next';

// Landing Components
import ContactSection from './(main)/home/ContactSection';
import CtaBanner from './(main)/home/CtaBanner';
import FaqSection from './(main)/home/FaqSection';
import FloatingNav from './(main)/home/FloatingNav';
import FooterSection from './(main)/home/FooterSection';
import HeroSection from './(main)/home/HeroSection';
// Server-rendered landing: crawlers always get real HTML, never an empty shell.
import LandingSessionRedirect from './(main)/home/LandingSessionRedirect';
import PricingSection from './(main)/home/PricingSection';
import ProcessSection from './(main)/home/ProcessSection';
import SolutionsSection from './(main)/home/SolutionsSection';
import StatsSection from './(main)/home/StatsSection';
import TrustSection from './(main)/home/TrustSection';

export const metadata: Metadata = {
  description:
    'Crea tu tienda online en minutos con Store Lite: inventario, pedidos y pagos en un solo lugar.',
  alternates: { canonical: '/' },
};

// Vista exclusiva para NO AUTENTICADOS (La landing page).
// La sesión se resuelve en cliente vía LandingSessionRedirect: si hay usuario,
// redirige a /onboarding sin ocultar el contenido estático del server.
export default function HomePage() {
  return (
    <div>
      <LandingSessionRedirect />
      <FloatingNav />
      <main>
        <HeroSection />
        <SolutionsSection />
        <CtaBanner />
        <StatsSection />
        <ProcessSection />
        <PricingSection />
        <TrustSection />
        <ContactSection />
        <FaqSection />
      </main>
      <FooterSection />
    </div>
  );
}
