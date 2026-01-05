/* =========================================
   FILE: src/content.ts
   PURPOSE: Tutorial (Land 0) + early demo levels
   ========================================= */

   export type LevelKind = "tutorial" | "main";

   // ⭐ Star system config types
   export type StarMetric = "time" | "points" | "combo";
   
   export interface StarConfig {
     metric: StarMetric;
     direction: "lowerIsBetter" | "higherIsBetter";
     thresholds: {
       three: number; // e.g. <= 30_000 ms OR >= 5000 pts
       two: number;   // e.g. <= 60_000 ms OR >= 3000 pts
       one: number;   // e.g. <= 90_000 ms OR >= 1000 pts
     };
     // Descriptions for what you must do to earn 1/2/3 stars
     // [ index 0 = 1-star, index 1 = 2-star, index 2 = 3-star ]
     descriptions: [string, string, string];
   }

   export type StarChallengeKind =
  | 'time_basic'
  | 'combo_label_awesome'
  | 'combo_medium_count'
  | 'combo_speed'
  | 'no_powerups'
  | 'avoid_trap';

export type StarChallengeConfig = {
  kind: StarChallengeKind;
};

   
   export type LevelSpec = {
     // Canonical ID used for support/debug.
     // For main levels this will match the level number players see (e.g. 1..1397).
     id: number;
   
     // Stage kind: tutorial or main.
     kind: LevelKind;
   
     // Land + local index inside that land.
     land: number;  // 0 = tutorial, 1+ = main lands
     level: number; // 1..N within that land (local index)
   
     // Gameplay content
     words: string[]; // chain of real words in order
   
     // Per-level knobs
     trapsEnabled?: boolean;    // whether TrapSystem runs in this level
     startingLockKeys?: number; // ONLY used in tutorial to introduce Lock Keys
     timeLimitSec?: number;     // for timed / VS modes later
   
     // Meta flags (all optional, safe for now)
     isTutorialLevel?: boolean;   // true for tutorial levels (Land 0)
     usesInventoryKeys?: boolean; // later: use inventory-based keys instead of startingLockKeys
     isBossLevel?: boolean;       // for Land 1–3 level 25s later
     tutorialScriptId?: string | null; // links to tutorial overlay script
   
     // ⭐ Per-level star scoring config (optional)
     starConfig?: StarConfig;

       // ⭐ NEW – per-level star time overrides (optional)
  starTimes?: {
    threeMs: number; // 3★ threshold
    twoMs: number;   // 2★ threshold
    oneMs: number;   // 1★ threshold
  };

  // ⭐ NEW – challenge text mode for pre-level panel (optional)
  starChallenge?: StarChallengeConfig;
     
   };
   
   export const DEMO_LEVELS: LevelSpec[] = [
     //
     // Land 0 (Tutorial) – 2 levels
     //
   
     // Land 0, Level 1 – basic gameplay (no traps, no lock keys)
     {
       id: -1,               // tutorial-only ID (never counted as "Level -1")
       kind: "tutorial",
       land: 0,
       level: 1,             // tutorial index within Land 0
       words: [
         "cat",
         "food",
         "truck",
         "stop",
         "sign",
         "post",
         "office",
         "party",
         "game",
         "board",
         "walk",
         "way",
       ],
       trapsEnabled: false,
       startingLockKeys: 0,
       timeLimitSec: 0,
       isTutorialLevel: true,
       usesInventoryKeys: false,
       isBossLevel: false,
       tutorialScriptId: "tut_basic_controls",
   
       // ⭐ Star logic: time-based, lower is better
       starConfig: {
         metric: "time",
         direction: "lowerIsBetter",
         thresholds: {
           three: 30_000, // <= 30s  → 3⭐
           two: 60_000,   // <= 60s  → 2⭐
           one: 90_000,   // <= 90s  → 1⭐
         },
         descriptions: [
           "Finish the level within 90 seconds", // 1⭐
           "Finish the level within 60 seconds", // 2⭐
           "Finish the level within 30 seconds", // 3⭐
         ],
       },
     },
   
     // Land 0, Level 2 – introduce inventory & Lock Keys
     {
       id: -2,               // another tutorial-only ID
       kind: "tutorial",
       land: 0,
       level: 2,             // tutorial index within Land 0
       words: [
         "lock",
         "smith",
         "shop",
         "window",
         "pane",
         "glass",
         "door",
         "frame",
         "key",
         "ring",
         "tone",
         "deaf",
       ],
       trapsEnabled: true,   // we want a simple lockdown to demo Lock Keys
       startingLockKeys: 2,  // two tutorial keys: one demo, one for them
       timeLimitSec: 0,
       isTutorialLevel: true,
       usesInventoryKeys: false, // NOT inventory-based yet (scripted intro)
       isBossLevel: false,
       tutorialScriptId: "tut_inventory_lock_keys",
   
       // ⭐ Slightly more demanding time targets
       starConfig: {
         metric: "time",
         direction: "lowerIsBetter",
         thresholds: {
           three: 40_000, // <= 40s → 3⭐
           two: 75_000,   // <= 75s → 2⭐
           one: 110_000,  // <= 110s → 1⭐
         },
         descriptions: [
           "Finish within 110 seconds", // 1⭐
           "Finish within 75 seconds",  // 2⭐
           "Finish within 40 seconds",  // 3⭐
         ],
       },
     },
   
     //
     // Land 1 – your existing demo levels
     //
   
     // Land 1, Level 1 – first real level
     {
       id: 1,         // this is "Level 1" for the main game
       kind: "main",
       land: 1,
       level: 3,      // local to Land 1
       words: [
         "car",
         "door",
         "stop",
         "sign",
         "up",
         "start",
         "button",
         "nose",
         "ring",
         "bell",
         "tower",
         "clock",
       ],
       trapsEnabled: false,
       startingLockKeys: 0,
       timeLimitSec: 0,
       isTutorialLevel: false,
       usesInventoryKeys: true, // later: use inventory keys here
       isBossLevel: false,
       tutorialScriptId: null,
   
       // ⭐ Main level: a bit longer allowed time (more words)
       starConfig: {
         metric: "time",
         direction: "lowerIsBetter",
         thresholds: {
           three: 45_000, // <= 45s → 3⭐
           two: 80_000,   // <= 80s → 2⭐
           one: 120_000,  // <= 120s → 1⭐
         },
         descriptions: [
           "Finish within 120 seconds", // 1⭐
           "Finish within 80 seconds",  // 2⭐
           "Finish within 45 seconds",  // 3⭐
         ],
       },
     },
   
     // Land 1, Level 2
     {
       id: 2,         // this is "Level 2"
       kind: "main",
       land: 1,
       level: 4,
       words: [
         "train",
         "station",
         "master",
         "key",
         "lock",
         "pick",
         "pocket",
         "change",
         "rate",
         "heart",
         "beat",
         "box",
       ],
       trapsEnabled: false,
       startingLockKeys: 0,
       timeLimitSec: 0,
       isTutorialLevel: false,
       usesInventoryKeys: true,
       isBossLevel: false,
       tutorialScriptId: null,
   
       starConfig: {
         metric: "time",
         direction: "lowerIsBetter",
         thresholds: {
           three: 50_000, // <= 50s → 3⭐
           two: 90_000,   // <= 90s → 2⭐
           one: 130_000,  // <= 130s → 1⭐
         },
         descriptions: [
           "Finish within 130 seconds", // 1⭐
           "Finish within 90 seconds",  // 2⭐
           "Finish within 50 seconds",  // 3⭐
         ],
       },
     },
   
     // Land 1, Level 3
     {
       id: 3,         // this is "Level 3"
       kind: "main",
       land: 1,
       level: 5,
       words: [
         "moon",
         "light",
         "house",
         "party",
         "line",
         "cook",
         "book",
         "club",
         "soda",
         "pop",
         "quiz",
         "show",
         "boat",
       ],
       trapsEnabled: false,
       startingLockKeys: 0,
       timeLimitSec: 0,
       isTutorialLevel: false,
       usesInventoryKeys: true,
       isBossLevel: false,
       tutorialScriptId: null,
   
       starConfig: {
         metric: "time",
         direction: "lowerIsBetter",
         thresholds: {
           three: 60_000, // <= 60s → 3⭐
           two: 100_000,  // <= 100s → 2⭐
           one: 150_000,  // <= 150s → 1⭐
         },
         descriptions: [
           "Finish within 150 seconds", // 1⭐
           "Finish within 100 seconds", // 2⭐
           "Finish within 60 seconds",  // 3⭐
         ],
       },
     },
   
     // Later: add Land 1 levels 6–27, then Lands 2–3 here
   ];
   