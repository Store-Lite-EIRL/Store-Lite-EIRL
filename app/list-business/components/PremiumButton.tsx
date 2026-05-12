'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import style from '../ListBusiness.module.css';

export default function PremiumButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push('/pricing');
  };

  return (
    <button
      onClick={handleClick}
      className={style.pricingLink}
      disabled={isLoading}
      style={{ border: 'none', cursor: isLoading ? 'wait' : 'pointer' }}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Cargando...{' '}
          <CircularProgress
            indeterminate
            style={{ width: '18px', height: '18px', color: 'inherit' }}
          />
        </span>
      ) : (
        <>
          Ver planes Premium <Icon size={18}>chevron_right</Icon>
        </>
      )}
    </button>
  );
}
