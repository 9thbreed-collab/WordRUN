# WordRun MVP PRD (Vibe-Code Ready)

**Version:** 0.2.0
**Date:** 2026-01-14
**Owner:** Nathaniel Giddens
**Status:** Draft (MVP)

## 1) Vision and Principles

### Product Vision
WordRun is a mobile word-association puzzle game that fuses story, emotion, and mechanics into one cohesive experience. The narrative is not an add-on; it is embedded in gameplay, word pools, environments, NPC cultures, and progression.

### Core Creative Principles (Non-Negotiable)
1. **Story-first integration:** Progression equals narrative comprehension.
2. **Emotional design as a metric:** The game must feel rewarding, human, and alive.
3. **Gameplay as storytelling:** Word pools, difficulty, traps, and map tone reflect story beats.
4. **Quality as a template:** MVP quality becomes the template for scaling to 3,000 levels.

## 2) Target Player and Positioning

### Target Audience (Initial)
- Casual mobile puzzle players who want deeper meaning and narrative.
- Fans of Wordscapes, Candy Crush, and Words With Friends seeking story and emotion.

### Positioning
A narrative puzzler: the dopamine loop of word puzzles + the emotional arc of a story-driven adventure.

## 3) MVP Scope Summary

### MVP Goal
Deliver a playable vertical slice that proves: (1) the core word-chain mechanic, (2) emotional design and game juice, (3) story-first integration via word pools + NPC flavor, and (4) map-based progression with isometric flavor.

### In-Scope (MVP)
- Core gameplay scene (word chain, scoring, streaks, traps, boosts).
- Story-integrated word pools per land/map.
- NPC dialogue and linguistic flavor (lightweight, not fully authored).
- Isometric map scene with node traversal.
- Pre-game and post-game overlays.
- Daily/weekly goals and streak achievements (basic).
- Basic store (skins, boosts, currency packs) with earnable paths.
- VS mode prototype (invite + match stub or local async simulation).

### Out-of-Scope (MVP)
- Full 120 lands content production.
- Full multiplayer backend with ranked ladder.
- Full personalization AI pipeline (use simple rule-based personalization).

## 4) Core Gameplay Loop

1. **Ready overlay** (blurred gameplay behind it). Player taps to begin.
2. **Solve word chain**: first word revealed, only first letter revealed for each subsequent word.
3. **Submit correct association**: input rest of letters to complete each word.
4. **Feedback burst**: animation + sound + haptics + avatar reaction.
5. **Momentum system**: streak builds, bonus words unlock with urgency.
6. **Complete level**: end recap + stars/diamond + story beat + NPC note.

## 5) Gameplay Requirements

### Word Chain Rules
- **12 core words per level**.
- **Bonus streak words:** 3 extra words earned one-at-a-time when on a streak.
- **Association rules:** Must be natural American-lexicon pairings (phrase adjacency), not loose category matches.
- Example: `car > door > stop > sign > up > start > button > nose > ring > tone > deaf`.

### Input Systems
- Default: keyboard typing.
- Power boosts can temporarily replace input with:
  - Swipeable wheel with scrambled/ordered letters.
  - Multiple choice word options.
  - Scrabble-like letter blocks.

### Streak and Momentum
- **Streak (combo) meter** increases with consecutive correct words.
- Momentum reward: score boost and streak word access.
- Momentum decay: if player slows or misses, combo resets.
- Bonus streak words are **double points** and have special animations.

### Mistakes and Lives
- 3 wrong answers in a level = 1 life lost.
- 3 lost lives = cooldown timer.

### Scoring
- Score based on base points, speed multiplier, accuracy, streak multiplier.
- Penalties: wrong answers, hints, skips.

### Traps and Obstacles
- Traps can lock rungs or delay guesses; force skips to continue.
- Power boosts can neutralize traps.

## 6) Emotional Design and Game Juice

### Emotional Targets
- **Primary:** Accomplishment.
- **Supporting:** Curiosity, Calm Confidence, Delight.

### Core Juice Moments
- Correct word: glow + bounce + sound + haptics + avatar cheer.
- Streak surge: intensified audio/visual + momentum meter surge.
- Level complete: recap animation + celebratory payoff.

### Character Presence
- Avatar on side of the word box, reacts to progress, failures, and celebrations.
- Character uses endearing, personalized voice lines (rule-based personalization for MVP).

## 7) Map and Progression

### Map Scene
- Isometric 3/4 bird’s-eye view.
- Zig-zag/snake path on cube tiles, surrounded by abstract void.
- Character auto-walks between nodes; NPCs speak on landing.

### Progression
- Lands (25 levels per land), mapped to story nations.
- Each land has a themed word pool and NPC dialogue tone.

## 8) Story Integration

### Story-First Implementation
- NPC speech cards between levels or during gameplay.
- Story beats influence word pools and trap frequency.
- The map environment and NPC language style reflect nation identity.

### Dependencies
- Land Distribution Matrix (120 lands to 9 nations with beats, difficulty, language mode).

## 9) Economy and Rewards

### Currency and Rewards
- Stars/diamonds earned from performance and challenges.
- Used to unlock maps, special levels, or purchase perks.

### Store
- Skins (cosmetic).
- Power boost packs.
- Star/diamond packs.
- Upgrades (quality-of-life). All earnable through gameplay.

## 10) Daily/Weekly Goals and Achievements

- Daily goals for engagement.
- Weekly challenges for long-term play.
- Streak achievements (number of correct words in a row).

## 11) VS Mode (MVP Prototype)

- Invite and challenge another player in a room.
- Sharing moments for AI-personalized recap lines.
- MVP can be asynchronous or simulated before full multiplayer.

## 12) Technical Requirements

### Tech Stack
- Phaser 3.90.0, Vite 6.2.6, TypeScript 5.8.3.
- Tailwind CSS for UI overlays.
- Supabase (supabase-js 2.79.0) for data and profiles.
- Vitest for testing.

### Architecture
- Scene-based architecture (Gameplay, Map, Transitions).
- DataManager singleton for all Supabase access.
- Componentized gameplay systems (ComboBar, RuutCharacter, HintSystem, PowerUpInventory).

### Performance
- 60 FPS on mid-range devices.
- <150MB RAM, <2MB initial bundle target.

## 13) Analytics and Telemetry (MVP)

- Level completion time.
- Correct/incorrect rate.
- Streak length and drop-off points.
- Power boost usage.
- Retention: D1/D7/D30.

## 14) Testing and QA

- Core mechanic unit tests (TypingEngine, ScoreManager, TrapSystem).
- Visual smoke tests for map and gameplay scenes.
- Playwright MCP for UI feedback and regression screenshots.

## 15) Risks and Mitigations

- **Typing UX friction:** Prototype alternative input quickly and A/B test.
- **Story integration bloat:** Keep narrative snippets short, skippable.
- **Complexity creep:** MVP focuses on one land + template content.

## 16) Open Questions

- Final monetization balance (IAP vs rewards cadence).
- VS mode networking spec.
- Final word-pool curation workflow and tooling.

## 17) Milestones

### Milestone 1: Gameplay (MVP Core)
- Gameplay scene with word box, boosts, traps, and upgrades.
- Emotional design and game juice.
- Pregame overlay and postgame recap.
- Clone gameplay scene for VS mode.

### Milestone 2: Map Scene
- Isometric map with cube tiles and pathing.
- NPC speech bubbles on node landings.
- Modal popup for level start and loadout change.

### Milestone 3: Expand Game
- Expand maps and content templates.
- Store, profiles, onboarding, OAuth/magic email.

## 18) Reference Docs

- `WordRun_PRD_DRAFT.md`
- `CLAUDE.md`
- `EMOTIONAL_DESIGN_CHECKLIST.md`
- `WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md`
- `WorldState_And_TravelRoutes.md`
- `AlignedStorySynopsisBeats_v2.md`

