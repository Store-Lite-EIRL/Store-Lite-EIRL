'use client';

import { useAuth } from '@/features/auth';
import ConsentCheckbox from '@/features/auth/ConsentCheckbox';
import { clearBusinessSessionData } from '@/hooks/useBusinessSession';
import { Button } from '@/shared/components/ui/buttons/Button';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import Link from 'next/link';
// Space Grotesk removed to use project default font (Google Sans)
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './page.module.css';

/**
 * Authentication Page
 * Strict implementation of the Future.io design template.
 */
export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [consented, setConsented] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Clean stale business data from previous sessions (defense layer C)
  useEffect(() => {
    clearBusinessSessionData();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed', error);
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !consented) return;

    setPasswordError(null);
    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setPasswordError(error);
        setIsLoading(false);
      }
      // On success signInWithEmail navigates to /onboarding (page unmounts).
    } catch (error) {
      console.error('Password sign in failed', error);
      setPasswordError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    // `dark` is the global MD3 token class from src/styles/material-design/dark.css.
    // The layout boot script only sets light/dark on <body> from the saved/system
    // theme, so /auth (dark by design) forces the token class here so the MD3
    // fields and submit button inside inherit dark tokens in both themes.
    <div className={`${styles.container} dark`}>
      {/* Background Decorative Elements */}
      <div className={styles.backgroundWrapper}>
        {/* Floating Glow Orbs */}
        <div className={`${styles.glowOrb} ${styles.orb1}`} />
        <div className={`${styles.glowOrb} ${styles.orb2}`} />
        <div className={`${styles.glowOrb} ${styles.orb3}`} />

        {/* Abstract Floating Glass Elements */}
        {/* Shard 1: Top Left - Shopping Bag */}
        <div className={`${styles.glassShard} ${styles.shard1}`}>
          <span className={`material-symbols-outlined ${styles.shardIcon} ${styles.iconXl}`}>
            shopping_bag
          </span>
        </div>

        {/* Shard 2: Bottom Right - Inventory */}
        <div className={`${styles.glassShard} ${styles.shard2}`}>
          <span className={`material-symbols-outlined ${styles.shardIcon} ${styles.icon2Xl}`}>
            inventory_2
          </span>
        </div>

        {/* Shard 3: Top Right - Sell */}
        <div className={`${styles.glassShard} ${styles.shard3}`}>
          <span className={`material-symbols-outlined ${styles.shardIcon} ${styles.iconLg}`}>
            sell
          </span>
        </div>

        {/* Shard 4: Bottom Left - Payments */}
        <div className={`${styles.glassShard} ${styles.shard4}`}>
          <span className={`material-symbols-outlined ${styles.shardIcon} ${styles.iconMd}`}>
            payments
          </span>
        </div>

        {/* Subtle Grid Pattern Overlay */}
        <div className={styles.gridPattern} />
      </div>

      {/* Main Content Container */}
      <main className={styles.main}>
        {/* Branding Top */}
        <div className={styles.branding}>
          <div className={styles.logoBox}>
            <svg
              className={styles.logoSvg}
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                fill="currentColor"
                fillRule="evenodd"
              />
              <path
                clipRule="evenodd"
                d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <h2 className={styles.brandText}>
            Store<span className={styles.brandAccent}>.Lite</span>
          </h2>
        </div>

        {/* Auth Card */}
        <div className={styles.card}>
          {/* Inner card lighting effect */}
          <div className={styles.cardHighlight} />

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Tu tienda global comienza aquí.</h1>
            <p className={styles.cardSubtitle}>
              Lanza tus productos virtuales en cuestion de segundos.
            </p>
          </div>

          <div className={styles.formArea}>
            <ConsentCheckbox onConsentChange={setConsented} />

            <button
              className={styles.googleButton}
              onClick={handleGoogleSignIn}
              disabled={!consented || isLoading}
            >
              {isLoading ? (
                <span className="material-symbols-rounded">progress_activity</span>
              ) : (
                <>
                  <svg className={styles.googleIcon} viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className={styles.googleButtonText}>Continuar con Google</span>
                </>
              )}
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>INSTANT ACCESS</span>
              <div className={styles.dividerLine} />
            </div>

            <form className={styles.passwordForm} onSubmit={handlePasswordSignIn}>
              <TextField
                label="Correo electrónico"
                type="email"
                name="email"
                value={email}
                required
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              />
              <TextField
                label="Contraseña"
                type="password"
                name="password"
                value={password}
                required
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              />
              {passwordError ? (
                <p role="alert" className={styles.errorText}>
                  {passwordError}
                </p>
              ) : null}
              <Button type="submit" disabled={isLoading || !consented}>
                {isLoading ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>
        </div>

        {/* Secondary Navigation / Support */}
        <div className={styles.footer}>
          <Link href="#" className={styles.footerLink}>
            <span className={`material-symbols-outlined ${styles.footerIcon}`}>help</span>
            Soporte
          </Link>
          <Link href="#" className={styles.footerLink}>
            <span className={`material-symbols-outlined ${styles.footerIcon}`}>language</span>
            Spanish (ES)
          </Link>
        </div>
      </main>

      {/* Visual Polish: Floating Particles */}
      <div className={styles.particleWrapper}>
        <div className={`${styles.particle} ${styles.p1}`} />
        <div className={`${styles.particle} ${styles.p2}`} />
        <div className={`${styles.particle} ${styles.p3}`} />
        <div className={`${styles.particle} ${styles.p4}`} />
        <div className={`${styles.particle} ${styles.p5}`} />
      </div>
    </div>
  );
}
