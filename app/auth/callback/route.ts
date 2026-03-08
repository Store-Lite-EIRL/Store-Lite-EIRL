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
 * Redirects to home page
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
  }

  // Redirect to home page
  return NextResponse.redirect(`${origin}/`);
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

  const profileData = {
    email: user.email!,
    full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
    avatar_url: user.user_metadata.avatar_url || null,
    provider_id: 'google',
  };

  // Create profile if it doesn't exist
  if (!existingProfile && !profileError) {
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
