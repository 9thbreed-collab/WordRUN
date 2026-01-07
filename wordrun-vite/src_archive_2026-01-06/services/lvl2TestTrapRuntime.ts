// src/services/TrapRuntime.ts

import { TrapSystem } from "../TrapSystem";

let trapSystem: TrapSystem | null = null;
let currentWords: string[] = [];
let currentLevel = 1;

/**
 * Call once per level when the GameplayScene is built.
 * We store the words + level and create a TrapSystem instance.
 */
export function initTrapRuntime(words: string[], level: number) {
  currentWords = [...words];
  currentLevel = level;

  trapSystem = new TrapSystem((type, data) => {
    console.log("[TRAP] triggered:", type, data);
  });

  console.log("[TRAP] runtime initialized", {
    level: currentLevel,
    wordCount: currentWords.length,
  });
}

/**
 * Call this when the player successfully solves a word.
 * Step 1: OBSERVER MODE – we only log, we do not modify gameplay.
 */
 export function onCorrectWord(index: number) {
  if (!trapSystem) return;

  try {
    const totalWords = currentWords.length;
    const level = currentLevel;

    console.log("[TRAP] onCorrectWord", {
      index,
      totalWords,
      level,
    });

    // --- Lockdown: tutorial override on level 2 ---
    const maybeLockdown = trapSystem.shouldTriggerLockdown(
      index,
      totalWords,
      level
    );
    console.log("[TRAP] shouldTriggerLockdown?", maybeLockdown);

    if (maybeLockdown) {
      if (level === 2) {
        // 🔒 Tutorial behavior: ALWAYS lock the last word on level 2
        const anyTrap = trapSystem as any;
        const state = anyTrap.state as any;
        const lastIndex = totalWords - 1;

        state.lockdownActive = true;
        state.lockedIndices = new Set([lastIndex]);

        console.log("[TRAP] tutorial lockdown forced on last word", {
          lastIndex,
          totalWords,
        });

        // Fire the same event the normal path would, so UI stays in sync
        if (typeof anyTrap.onTrapTriggered === "function") {
          anyTrap.onTrapTriggered("lockdown", {
            lockedIndices: [lastIndex],
            lockCount: 1,
          });
        }
      } else {
        // Normal behavior for all other levels
        const ok = trapSystem.triggerLockdown(currentWords, index, 2);
        console.log("[TRAP] triggerLockdown result", {
          ok,
          state: trapSystem.getState(),
        });
      }
    }

    // --- Decoy observer (unchanged) ---
    const maybeDecoy = trapSystem.shouldTriggerDecoy(index, true);
    console.log("[TRAP] shouldTriggerDecoy?", maybeDecoy);

    // --- Void Break observer (unchanged) ---
    const currentStreak = 0; // placeholder until streak is wired
    const maybeVoid = trapSystem.shouldTriggerVoidBreak(currentStreak);
    console.log("[TRAP] shouldTriggerVoidBreak?", maybeVoid);
    if (maybeVoid) {
      trapSystem.triggerVoidBreak();
      console.log("[TRAP] voidBreak state", trapSystem.getState());
    }
  } catch (err) {
    console.warn("[TRAP] onCorrectWord internal error (ignored)", err);
  }
}


/**
 * Optional: inspect trap state from DevTools during debugging.
 */
export function getTrapStateSafe() {
  if (!trapSystem) return null;
  try {
    return trapSystem.getState();
  } catch (err) {
    console.warn("[TRAP] getTrapStateSafe error", err);
    return null;
  }
}
