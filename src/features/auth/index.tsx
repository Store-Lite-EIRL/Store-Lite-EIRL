'use client';

import { createClient } from '@/lib/supabase/client';
import type { AuthContextType, AuthSession, AuthUser } from '@/types/auth';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEBUG_ABORTS = process.env.NEXT_PUBLIC_DEBUG_ABORTS === '1';

function isAbortLikeError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (error.name === 'AbortError' || message.includes('abort') || message.includes('aborted')) {
      return true;
    }
  }

  if (typeof error === 'object' && error !== null) {
    const maybeName = 'name' in error ? String(error.name) : '';
    const maybeCode = 'code' in error ? String(error.code) : '';
    const maybeMessage = 'message' in error ? String(error.message).toLowerCase() : '';
    const maybeCause =
      'cause' in error && error.cause instanceof Error ? error.cause.message.toLowerCase() : '';

    return (
      maybeName === 'AbortError' ||
      maybeCode === 'ABORT_ERR' ||
      maybeCode === 'abort' ||
      maybeMessage.includes('abort') ||
      maybeMessage.includes('aborted') ||
      maybeCause.includes('abort')
    );
  }

  return false;
}

function authDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEBUG_ABORTS) return;
  console.warn('[AuthDebug]', message, payload ?? {});
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const profileRequestIdRef = useRef(0);
  const stableSessionRef = useRef<AuthSession | null>(null);
  const stableUserRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    authDebug('effect:start');

    const setStableAuthState = (nextSession: AuthSession | null, nextUser: AuthUser | null) => {
      stableSessionRef.current = nextSession;
      stableUserRef.current = nextUser;
      setSession(nextSession);
      setUser(nextUser);
    };

    const applySession = (nextSession: AuthSession | null) => {
      if (!nextSession?.user) {
        profileRequestIdRef.current += 1;
        authDebug('applySession:no-user', { requestId: profileRequestIdRef.current });
        setStableAuthState(null, null);
        return;
      }

      const basicUser = { ...nextSession.user, profile: undefined } as AuthUser;
      setStableAuthState(nextSession, basicUser);
    };

    const fetchProfile = async (session: AuthSession) => {
      const requestId = ++profileRequestIdRef.current;
      authDebug('fetchProfile:start', { requestId, userId: session.user.id });
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!isMounted || requestId !== profileRequestIdRef.current) {
          authDebug('fetchProfile:stale', { requestId, currentRequestId: profileRequestIdRef.current });
          return;
        }

        if (error) {
          // PGRST116 is 'no rows returned', which is expected if a user hasn't created a profile yet
          if (error.code === 'PGRST116') {
            setStableAuthState(session, { ...session.user, profile: undefined } as AuthUser);
            return;
          }

          // Ignore abort-like errors caused by navigation/unmount races
          if (isAbortLikeError(error)) {
            authDebug('fetchProfile:abort-like-error', {
              requestId,
              code: error.code,
              message: error.message,
            });
            setStableAuthState(session, { ...session.user, profile: undefined } as AuthUser);
            return;
          }

          console.error('Error fetching profile:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details,
          });

          // Set user even if profile is missing (just basic session user)
          setStableAuthState(session, { ...session.user, profile: undefined } as AuthUser);
          return;
        }

        authDebug('fetchProfile:success', { requestId, hasProfile: Boolean(profile) });
        setStableAuthState(session, { ...session.user, profile: profile || undefined } as AuthUser);
      } catch (error) {
        if (!isMounted || requestId !== profileRequestIdRef.current) {
          authDebug('fetchProfile:catch-stale', {
            requestId,
            currentRequestId: profileRequestIdRef.current,
          });
          return;
        }
        if (isAbortLikeError(error)) {
          authDebug('fetchProfile:catch-abort-like', { requestId });
          setStableAuthState(session, { ...session.user, profile: undefined } as AuthUser);
          return;
        }

        console.error('Unexpected error in profile fetch:', error);
        setStableAuthState(session, { ...session.user, profile: undefined } as AuthUser);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: AuthSession | null) => {
      if (!isMounted) return;
      authDebug('onAuthStateChange', { event: _event, hasSession: Boolean(session) });

      if (session?.user) {
        applySession(session);

        // Supabase recomienda NO hacer awaits de otros métodos de Supabase dentro
        // del callback de onAuthStateChange. Se difiere para evitar deadlocks/races.
        setTimeout(() => {
          if (!isMounted) return;
          void fetchProfile(session);
        }, 0);
      } else {
        applySession(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      profileRequestIdRef.current += 1;
      authDebug('effect:cleanup', { requestId: profileRequestIdRef.current });
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.warn('🔗 Redirecting to:', redirectUrl);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return a safe default instead of throwing, so public pages (e.g. /[slug])
  // don't crash when the context is briefly undefined during hydration or Fast Refresh.
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: false,
      signInWithGoogle: async () => {
        console.warn('[useAuth] signInWithGoogle called outside AuthProvider');
      },
      signOut: async () => {
        console.warn('[useAuth] signOut called outside AuthProvider');
      },
    } satisfies AuthContextType;
  }
  return context;
};
