'use client';

import BackButton from 'app/[slug]/(app)/product/[productId]/components/BackButton';
import { useRouter } from 'next/navigation';

export function PricingBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/list-business');
  };

  return (
    // <Button variant="text" onClick={handleBack} className="pricing-back-button">
    //   <Icon size={21}>
    //     arrow_back
    //   </Icon>
    //   Volver
    // </Button>
    <BackButton href="/list-business" style={{ position: 'absolute', top: 50 }} />
  );
}
