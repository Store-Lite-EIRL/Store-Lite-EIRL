'use client';

import { createClient } from '@/lib/supabase/client';
import type { AuthContextType, AuthSession, AuthUser } from '@/types/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (session: AuthSession) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return;

        if (error) {
          // PGRST116 is 'no rows returned', which is expected if a user hasn't created a profile yet
          if (error.code === 'PGRST116') {
            setUser({ ...session.user, profile: undefined } as AuthUser);
            return;
          }

          // Specifically ignore AbortError/signal errors from logging
          if (error.message?.includes('abort') || error.code === 'abort') return;

          console.error('Error fetching profile:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details,
          });

          // Set user even if profile is missing (just basic session user)
          setUser({ ...session.user, profile: undefined } as AuthUser);
          return;
        }

        setUser({ ...session.user, profile: profile || undefined } as AuthUser);
      } catch (error) {
        // Specifically ignore AbortError as it is expected during navigation and resizing
        if (error instanceof Error && error.name === 'AbortError') return;
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError'
        )
          return;

        console.error('Unexpected error in profile fetch:', error);
        setUser({ ...session.user } as AuthUser);
      }
    };

    const getInitialSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        if (session?.user) {
          await fetchProfile(session);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError'
        )
          return;
        console.error('Error fetching session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: AuthSession | null) => {
      if (!isMounted) return;

      setSession(session);
      if (session?.user) {
        await fetchProfile(session);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
