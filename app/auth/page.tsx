'use client';

import { useAuth } from '@/features/auth';
import ConsentCheckbox from '@/features/auth/ConsentCheckbox';
import { clearBusinessSessionData } from '@/hooks/useBusinessSession';
import { Button } from '@/shared/components/ui/buttons/Button';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import Image from 'next/image';
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
  // Email/password form is hidden by default behind a discreet toggle.
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
        {/* Auth Card */}
        <div className={styles.card}>
          {/* Inner card lighting effect */}
          <div className={styles.cardHighlight} />

          <div className={styles.cardContent}>
            <section className={styles.formPanel} aria-labelledby="auth-title">
              <div className={styles.cardBranding}>
                <div className={styles.logoBox}>
                  <Image
                    className={styles.logoImage}
                    src="/img/icon.png"
                    alt="Store Lite"
                    width={40}
                    height={40}
                    priority
                  />
                </div>
                <h2 className={styles.brandText}>
                  Store <span className={styles.brandAccent}>Lite</span>
                </h2>
              </div>

              <div className={styles.cardHeader}>
                <p className={styles.formEyebrow}>Bienvenido de nuevo</p>
                <h1 id="auth-title" className={styles.cardTitle}>
                  Tu tienda global comienza aquí.
                </h1>
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

                <button
                  type="button"
                  className={styles.toggleLink}
                  aria-expanded={showPasswordForm}
                  aria-controls="password-sign-in"
                  onClick={() => setShowPasswordForm((visible) => !visible)}
                >
                  {showPasswordForm ? 'Ocultar' : '¿Acceso con correo electrónico?'}
                </button>

                {showPasswordForm ? (
                  <div id="password-sign-in">
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setEmail(event.target.value)
                        }
                      />
                      <TextField
                        label="Contraseña"
                        type="password"
                        name="password"
                        value={password}
                        required
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setPassword(event.target.value)
                        }
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
                ) : null}
              </div>
            </section>

            <hr className={styles.columnDivider} aria-hidden="true" />

            <aside className={styles.insightPanel} aria-label="Store Lite">
              <div className={styles.insightCopy}>
                <p className={styles.insightEyebrow}>Tu negocio, en movimiento</p>
                <h2 className={styles.insightTitle}>Todo lo que vendes, en un solo lugar.</h2>
                <p className={styles.insightDescription}>
                  Organiza tu catálogo, recibe pagos y haz crecer tu tienda desde cualquier lugar.
                </p>
              </div>

              <div className={styles.insightVisual} aria-hidden="true">
                <div className={`${styles.visualTile} ${styles.visualTilePrimary}`}>
                  <span className="material-symbols-rounded">storefront</span>
                  <strong>Tu tienda</strong>
                  <small>Lista para vender</small>
                </div>
                <div className={`${styles.visualTile} ${styles.visualTileSecondary}`}>
                  <span className="material-symbols-rounded">payments</span>
                  <strong>Pagos simples</strong>
                </div>
                <div className={styles.visualLine} />
                <div className={styles.visualDot} />
              </div>

              <div className={styles.insightFooter}>
                <span className="material-symbols-rounded">verified</span>
                <span>Una experiencia simple para empezar.</span>
              </div>
            </aside>
          </div>
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
