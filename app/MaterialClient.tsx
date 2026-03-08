// app/MaterialClient.tsx
'use client';

import dynamic from 'next/dynamic';

const MaterialDemo = dynamic(() => import('@/shared/components/ui/MaterialDemo'), { ssr: false });

export default function MaterialClient() {
  return <MaterialDemo />;
}
