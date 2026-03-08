'use client';

import dynamic from 'next/dynamic';

const ComponentCatalog = dynamic(() => import('@/shared/components/ui/AllMaterialComponents'), {
  ssr: false,
});

export default function BetaPage() {
  return (
    <main>
      <ComponentCatalog />
    </main>
  );
}
