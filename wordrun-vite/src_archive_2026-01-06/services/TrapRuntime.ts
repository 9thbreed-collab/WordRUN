// src/services/TrapRuntime.ts

import { TrapSystem } from "../TrapSystem";
type TrapEvent =
  | { kind: "incoming"; type: TrapType; targetIndex: number; icon: string }
  | { kind: "applied"; type: TrapType; targetIndex: number }
  | { kind: "cleared"; type: TrapType; targetIndex: number };

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
    const tryFreeze = solvedIndex === 1; // ALWAYS trigger freeze on 2nd solve
const tryLock = false;


    console.log("[TRAP] onCorrectWord", {
      index,
      totalWords,
      level,
    });

        // --- Lockdown observer (TEMP: force ON for testing) ---
       // const maybeLockdown = true; // 🔥 TEMP: ALWAYS ON so we can SEE it
        //console.log("[TRAP] shouldTriggerLockdown? (forced)", maybeLockdown);
    
        //if (maybeLockdown) {
          //const ok = trapSystem.triggerLockdown(currentWords, index, 2);
         // console.log("[TRAP] triggerLockdown result (forced)", {
         //   ok,
          //  state: trapSystem.getState(),
         // });
        //}
        const maybeLockdown = trapSystem.shouldTriggerLockdown(index, totalWords, level);
console.log("[TRAP] shouldTriggerLockdown?", maybeLockdown);
if (maybeLockdown) {
  const ok = trapSystem.triggerLockdown(currentWords, index, 1);
  console.log("[TRAP] triggerLockdown result", { ok, state: trapSystem.getState() });
}

    

    // --- Decoy observer (no actual UI change yet) ---
    const maybeDecoy = trapSystem.shouldTriggerDecoy(index, true);
    console.log("[TRAP] shouldTriggerDecoy?", maybeDecoy);

    // --- Void Break observer ---
    const currentStreak = 0; // Step 1: placeholder
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
