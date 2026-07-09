import { Button } from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailButtonProps {
  href: string;
  children: ReactNode;
}

function addUtmParams(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=email&utm_medium=email`;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={addUtmParams(href)}
      style={{
        backgroundColor: '#6366f1',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '600',
        lineHeight: '100%',
        padding: '14px 32px',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Button>
  );
}
