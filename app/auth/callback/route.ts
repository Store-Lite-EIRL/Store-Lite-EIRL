// =====================================================
// AUTH CALLBACK ROUTE HANDLER
// =====================================================
// Description: Handles OAuth callback from Google
// Usage: Called automatically by Supabase after OAuth
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET handler for OAuth callback
 * Exchanges the authorization code for a session
 * Creates or updates user profile in database
 * Always redirects to /onboarding — the page shows relevant
 * options based on whether the user has businesses or not.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth`);
  }

  const supabase = await createClient();

  // Exchange code for session
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError);
    return NextResponse.redirect(`${origin}/auth?error=exchange_failed`);
  }

  if (data.user) {
    await syncUserProfile(supabase, data.user);

    // Check for chat intent from storefront
    const chat = requestUrl.searchParams.get('chat');
    const slug = requestUrl.searchParams.get('slug');

    if (chat === 'true' && slug) {
      // Redirect back to the store with chat_ready signal
      return NextResponse.redirect(`${origin}/${slug}?chat_ready=true`);
    }

    // Always redirect to onboarding — the page checks the user's state
    // and shows relevant options (create business, join team, go to list)
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Fallback — same destination for any edge case
  return NextResponse.redirect(`${origin}/onboarding`);
}

import { type SupabaseClient, type User } from '@supabase/supabase-js';

// ... (existing imports)

/**
 * Syncs Auth User with Profiles table
 */
async function syncUserProfile(supabase: SupabaseClient, user: User) {
  // Check if profile exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  // Extract avatar URL from different providers
  const getAvatarUrl = (metadata: Record<string, unknown>, provider: string): string | null => {
    if (provider === 'facebook') {
      // Facebook: picture.data.url or picture
      const picture = metadata.picture as { data?: { url?: string } } | undefined;
      return picture?.data?.url ?? (picture as string) ?? null;
    }
    // Google: avatar_url or picture
    return (metadata.avatar_url as string) ?? (metadata.picture as string) ?? null;
  };

  const provider = user.app_metadata?.provider ?? 'email';
  const avatarUrl = getAvatarUrl(user.user_metadata ?? {}, provider);

  const profileData = {
    email: user.email!,
    full_name:
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email?.split('@')[0] ??
      'User',
    avatar_url: avatarUrl,
    provider_id: provider,
  };

  // Create profile if it doesn't exist
  if (!existingProfile || (profileError && (profileError as any).code === 'PGRST116')) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      ...profileData,
    });

    if (insertError) {
      console.error('Error creating profile:', insertError);
    }
  } else if (existingProfile) {
    // Update existing profile with latest info
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    }
  }
}
