'use client';

import { Icon } from '@/shared/components/ui';
import { getBusinessPath } from '@/shared/utils/url';
import { useRouter } from 'next/navigation';

export default function LogoutButton({
  token,
  businessSlug,
}: {
  token: string;
  businessSlug: string;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem(`order_session_${token}`);
    router.push(getBusinessPath(businessSlug));
  };

  return (
    <button
      onClick={handleLogout}
      title="Cerrar sesión"
      style={{
        background: 'var(--md-sys-color-error-container)',
        border: '1px solid var(--md-sys-color-outline)',
        cursor: 'pointer',
        padding: '10px 16px',
        borderRadius: '16px',
        color: 'var(--md-sys-color-on-error-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 700,
        fontSize: '0.8rem',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--md-sys-color-error)';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.borderColor = 'var(--md-sys-color-error)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--md-sys-color-error-rgb), 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--md-sys-color-error-container)';
        e.currentTarget.style.color = 'var(--md-sys-color-on-error-container)';
        e.currentTarget.style.borderColor = 'var(--md-sys-color-outline)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Icon size={20}>logout</Icon>
      Cerrar sesión
    </button>
  );
}
