'use client';

import { createClient } from '@/lib/supabase/client';
import type { AuthError } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

/**
 * Chat OAuth Popup
 *
 * This page opens in a popup window when a customer clicks
 * "Continue with Google". It handles the ENTIRE OAuth flow
 * client-side, then signals the parent window via postMessage.
 *
 * Flow:
 *   1st load (no code)→ redirect to Google OAuth
 *   2nd load (has code)→ exchange code → notify parent → close
 *
 * The parent window's AuthProvider detects the session change
 * via BroadcastChannel automatically.
 */
function ChatOAuthPopupContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const slug = searchParams.get('slug');
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    const supabase = createClient();

    if (code && slug) {
      // ── Second load: OAuth callback ──
      // Exchange the auth code for a Supabase session

      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }: { error: AuthError | null }) => {
          if (error) {
            console.error('[ChatPopup] Error exchanging code:', error);
            // Notify parent of failure
            window.opener?.postMessage(
              { type: 'AUTH_ERROR', error: error.message },
              window.location.origin,
            );
          } else {
            console.info('[ChatPopup] Auth successful, notifying parent');
            // Notify parent that auth succeeded
            // The BroadcastChannel in Supabase client will handle
            // syncing the session to the parent window automatically
            window.opener?.postMessage({ type: 'AUTH_SUCCESS', slug }, window.location.origin);
          }
        })
        .finally(() => {
          // Close popup regardless of outcome
          window.close();
        });
    } else if (slug) {
      // ── First load: start OAuth ──
      // Redirect to Google. After auth, Supabase redirects back
      // to this page with the authorization code.
      const redirectTo = `${window.location.origin}/auth/chat-popup?slug=${slug}`;

      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
    } else {
      // Missing slug — nothing to do, close
      console.warn('[ChatPopup] Missing slug parameter');
      window.close();
    }
  }, [code, slug]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#666',
      }}
    >
      {code ? 'Completando autenticación…' : 'Redirigiendo a Google…'}
    </div>
  );
}

export default function ChatOAuthPopup() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          Cargando…
        </div>
      }
    >
      <ChatOAuthPopupContent />
    </Suspense>
  );
}
