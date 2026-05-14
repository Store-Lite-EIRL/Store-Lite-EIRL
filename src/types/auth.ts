// =====================================================
// AUTH TYPES
// =====================================================
// Description: TypeScript types for authentication
// Usage: Import from '@/types/auth'
// =====================================================

import type { Profile } from '@/core/database/schema';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// =====================================================
// USER TYPES
// =====================================================

/**
 * Extended user type that combines Supabase auth user with profile data
 */
export interface AuthUser extends SupabaseUser {
  profile?: Profile;
}

/**
 * Auth session type from Supabase
 */
export type AuthSession = Session;

/**
 * Auth state for context
 */
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
}

/**
 * Auth context type
 */
export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleForChat: (slug: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | 'facebook';
