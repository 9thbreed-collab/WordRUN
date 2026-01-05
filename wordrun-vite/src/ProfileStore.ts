import { supabase } from './supabase';
import type { Profile } from './supabase';
import { DEV_FLAGS } from './devFlags';


let currentProfile: Profile | null = null;
// --- SIMPLE PROFILE CHANGE SUBSCRIPTIONS ----------------------------
// (Used so gameplay UI can auto-refresh when the player customizes their Ruut.)
type ProfileListener = (p: Profile | null) => void;
const profileListeners = new Set<ProfileListener>();

/** Subscribe to profile changes. Returns an unsubscribe function. */
export function onProfileChanged(fn: ProfileListener): () => void {
  profileListeners.add(fn);
  return () => profileListeners.delete(fn);
}

function emitProfileChanged() {
  for (const fn of profileListeners) {
    try { fn(currentProfile); } catch (err) {
      console.warn('[ProfileStore] profile listener error', err);
    }
  }
}


// --- NAME GENERATOR -------------------------------------------------

const ADJECTIVES = [
  'Swift', 'Lucky', 'Quiet', 'Bright', 'Clever',
  'Brave', 'Calm', 'Electric', 'Sharp', 'Witty'
];

const NOUNS = [
  'Ruut', 'Runner', 'Cipher', 'Wordsmith', 'Navigator',
  'Sprout', 'Spark', 'Comet', 'Echo', 'Glyph'
];

function pickRandom<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// Exported so the overlay can roll more names later
export function generateRandomName(seed?: string): string {
  // Simple deterministic tweak if we have a seed
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const adj = ADJECTIVES[hash % ADJECTIVES.length];
    const noun = NOUNS[(hash >> 4) % NOUNS.length];
    const number = (hash % 9000) + 1000;
    return `${adj} ${noun} ${number}`;
  }

  // Fallback: purely random
  const adj = pickRandom(ADJECTIVES);
  const noun = pickRandom(NOUNS);
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${adj} ${noun} ${number}`;
}

// --- RUUT CUSTOMIZATION (MVP) --------------------------------------
export type RuutCosmetic = {
  /** Asset key (or skin id) for the gameplay companion. */
  skinKey: string;
};

/** Default cosmetic used until the player picks something else. */
const DEFAULT_RUUT: RuutCosmetic = { skinKey: 'ruut_walk' };

export function getRuutCosmetic(): RuutCosmetic {
  const p = getCurrentProfile();
  const meta = (p?.meta ?? {}) as any;
  const skinKey = typeof meta.ruut_skinKey === 'string' ? meta.ruut_skinKey : DEFAULT_RUUT.skinKey;
  return { skinKey };
}

/**
 * Update the in-memory profile meta for Ruut.
 * (MVP: local only if DEV auth; otherwise also persists to Supabase profiles.meta)
 */
export async function updateRuutCosmetic(next: Partial<RuutCosmetic>): Promise<boolean> {
  const profile = getCurrentProfile();
  if (!profile) return false;

  const merged: RuutCosmetic = {
    ...getRuutCosmetic(),
    ...next,
  };

  const nextMeta: any = {
    ...(profile.meta ?? {}),
    ruut_skinKey: merged.skinKey,
  };

  // DEV MODE: local-only update (no network)
  if (DEV_FLAGS?.skipAuth === true || DEV_FLAGS?.ENABLE_REAL_AUTH === 'N') {
    const updated: Profile = { ...profile, meta: nextMeta } as any;
    setCurrentProfile(updated);
    return true;
  }

  // REAL MODE: persist to Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ meta: nextMeta })
    .eq('id', profile.id);

  if (error) {
    console.error('updateRuutCosmetic error', error);
    return false;
  }

  const updated: Profile = { ...profile, meta: nextMeta } as any;
  setCurrentProfile(updated);
  return true;
}


// --- PROFILE LOAD / CREATE ------------------------------------------

export function getCurrentProfile(): Profile | null {
  return currentProfile;
}

export function setCurrentProfile(profile: Profile | null) {
  currentProfile = profile;
  emitProfileChanged();
}


/**
 * Load an existing profile or create one with an auto-generated name.
 * Called right after login.
 */
export async function loadOrCreateProfileForUser(userId: string): Promise<Profile | null> {
  try {
    // Try to load existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile', error);
      // If it's a real error, stop here
      // If it's "no rows", data will just be null
    }

    if (data) {
      const normalized: Profile = {
        ...data,
        meta: data.meta ?? {},
      };
      currentProfile = normalized;
      return normalized;
    }

    // No profile yet -> create starter profile with auto-generated name
    const starterName = generateRandomName(userId);
    const starterMeta = {
      name_locked: false,
      has_custom_name: false,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: starterName,
        meta: starterMeta,
      })
      .select()
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('Error creating profile', insertError);
      return null;
    }

    const normalizedInserted: Profile = {
      ...inserted,
      meta: inserted.meta ?? starterMeta,
    };

    currentProfile = normalizedInserted;
    return normalizedInserted;
  } catch (err) {
    console.error('Unexpected profile load/create error', err);
    return null;
  }
}

/**
 * Update the current profile's name and optionally lock it.
 * Used when the player confirms a new name in the overlay.
 */
 export async function updateProfileName(newName: string, lockName: boolean): Promise<boolean> {
  const profile = getCurrentProfile();
  if (!profile) return false;

  // 🚧 DEV MODE: no Supabase, just mutate local profile
  if (DEV_FLAGS.ENABLE_REAL_AUTH === 'N') {
    const updated: Profile = {
      ...profile,
      display_name: newName,
      meta: {
        ...(profile.meta ?? {}),
        name_locked: lockName,
        has_custom_name: true,
      },
    } as any;

    setCurrentProfile(updated);
    return true;
  }

  // REAL MODE: hit Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: newName,
      meta: { ...(profile.meta ?? {}), name_locked: lockName, has_custom_name: true },
    })
    .eq('id', profile.id);

  if (error) {
    console.error('updateProfileName error', error);
    return false;
  }

  const updated: Profile = {
    ...profile,
    display_name: newName,
    meta: { ...(profile.meta ?? {}), name_locked: lockName, has_custom_name: true },
  } as any;

  setCurrentProfile(updated);
  return true;
}
