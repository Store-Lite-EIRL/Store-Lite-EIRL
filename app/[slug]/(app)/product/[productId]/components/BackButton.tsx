'use client';

import { Icon, IconButton } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function BackButton({ href, className, style }: BackButtonProps) {
  const router = useRouter();

  return (
    <IconButton
      variant="filled-tonal"
      aria-label="Volver"
      onClick={() => router.push(href)}
      className={className}
      style={style}
      suppressHydrationWarning
    >
      <Icon suppressHydrationWarning>arrow_back</Icon>
    </IconButton>
  );
}
