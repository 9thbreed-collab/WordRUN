// FILE: src/devFlags.ts
// Simple toggle switches for dev vs real auth behavior.
//
// When you're READY for full login, set ENABLE_REAL_AUTH to 'Y'.
// Until then, leave it 'N' so you can work without Supabase OAuth
// blowing up the editor preview.

export const DEV_FLAGS = {
  /**
   * 'N'  → use a fake user, skip real Supabase OAuth (good for dev & editor preview)
   * 'Y'  → use real Supabase auth flow (Google OAuth, etc.)
   */
  ENABLE_REAL_AUTH: 'N' as 'Y' | 'N',

  /**
   * When real auth is enabled:
   * 'N'  → block OAuth if the game is running inside an iframe (editor preview),
   *        and tell you to open it in a separate tab.
   * 'Y'  → allow OAuth even inside an iframe (only safe on real hosting).
   */
  ALLOW_OAUTH_IN_IFRAME: 'N' as 'Y' | 'N',

  /**
   * Fake user id used when ENABLE_REAL_AUTH === 'N'.
   * This will still create/use a real `profiles` row in Supabase, just under this id.
   */
  FAKE_USER_ID: '00000000-0000-0000-0000-000000000001',
};
