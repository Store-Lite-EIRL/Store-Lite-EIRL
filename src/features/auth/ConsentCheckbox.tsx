'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import styles from './ConsentCheckbox.module.css';

interface ConsentCheckboxProps {
  onConsentChange: (checked: boolean) => void;
  storeName?: string;
}

export default function ConsentCheckbox({ onConsentChange, storeName }: ConsentCheckboxProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onConsentChange(e.target.checked);
    },
    [onConsentChange],
  );

  return (
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        className={styles.checkbox}
        onChange={handleChange}
        aria-label={storeName ? 'Aceptar términos y condiciones' : 'Accept terms and conditions'}
      />
      <span className={styles.checkboxText}>
        {storeName ? (
          <>
            Acepto los{' '}
            <Link href="/terminos" className={styles.link}>
              términos
            </Link>{' '}
            y{' '}
            <Link href="/privacidad" className={styles.link}>
              política de privacidad
            </Link>{' '}
            de {storeName}
          </>
        ) : (
          <>
            Al continuar, aceptas nuestros{' '}
            <Link href="/terminos" className={styles.link}>
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacidad" className={styles.link}>
              Política de Privacidad
            </Link>
            .
          </>
        )}
      </span>
    </label>
  );
}
