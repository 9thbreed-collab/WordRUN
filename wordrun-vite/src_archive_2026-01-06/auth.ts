// FILE: src/auth.ts

import { supabase } from './supabase';
import type { Profile } from './supabase';
import { loadOrCreateProfileForUser, setCurrentProfile } from './ProfileStore';
import { DEV_FLAGS } from './devFlags';

/**
 * Low-level auth check.
 * - When ENABLE_REAL_AUTH === 'N':
 *      returns FAKE_USER_ID immediately (no Supabase OAuth).
 * - When ENABLE_REAL_AUTH === 'Y':
 *      uses real Supabase session + OAuth, with optional iframe guard.
 */
export async function requireAuth(): Promise<string | null> {
  // 🚧 DEV MODE: skip real auth entirely and pretend we are logged in
  if (DEV_FLAGS.ENABLE_REAL_AUTH === 'N') {
    return DEV_FLAGS.FAKE_USER_ID;
  }

  // Optional guard: block OAuth inside embedded editor preview (iframe)
  if (
    DEV_FLAGS.ALLOW_OAUTH_IN_IFRAME === 'N' &&
    typeof window !== 'undefined' &&
    window.top !== window.self
  ) {
    alert(
      'Login is disabled in the embedded editor preview.\n\n' +
      'Open the game in a separate tab/window to sign in.'
    );
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth check failed', error);
      alert('Could not check login. Please try again.');
      return null;
    }

    const session = data?.session;
    if (session?.user) {
      return session.user.id;
    }

    // Not logged in → start OAuth
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (signInError) {
      console.error('OAuth sign-in error', signInError);
      alert('Sign-in failed: ' + signInError.message);
      return null;
    }

    // After this, the browser will redirect, so returning null is fine
    return null;
  } catch (err: any) {
    console.error('Unexpected auth error', err);
    alert('Unexpected sign-in error. Check your connection and try again.');
    return null;
  }
}

/**
 * High-level helper:
 * - Ensures we have a user id (fake or real).
 * - Loads or creates a profile row (with starter name) in REAL mode.
 * - Uses an in-memory fake profile in DEV mode.
 */
export async function requireAuthWithProfile(): Promise<{ userId: string; profile: Profile } | null> {
  // DEV SHORTCUT:
  // If real auth is disabled, DO NOT touch Supabase at all.
  if (DEV_FLAGS.ENABLE_REAL_AUTH === 'N') {
    const userId = DEV_FLAGS.FAKE_USER_ID;

    const fakeProfile: Profile = {
      // Adjust these keys if your Profile type has different names,
      // but this is enough for the name overlay & UI.
      id: userId,
      display_name: 'Test Runner',
      meta: {
        name_locked: false,
        has_custom_name: false,
      },
    } as any;

    setCurrentProfile(fakeProfile);
    return { userId, profile: fakeProfile };
  }

  // REAL AUTH PATH:
  const userId = await requireAuth();
  if (!userId) return null;

  const profile = await loadOrCreateProfileForUser(userId);
  if (!profile) return null;

  setCurrentProfile(profile);
  return { userId, profile };
}
