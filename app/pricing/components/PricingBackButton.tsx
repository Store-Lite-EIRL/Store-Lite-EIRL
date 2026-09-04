'use client';

import { Icon, IconButton } from '@/shared/components/ui';
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
    <IconButton
      variant="filled-tonal"
      aria-label="Volver"
      onClick={handleBack}
      suppressHydrationWarning
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );
}
