# WordRun Shared Alignment Notes

This file aligns the perspectives in `CLAUDE.md` (technical architecture) and `GEMINI.md` (project assessment/roadmap) so all models work from the same shared baseline.

## 1) Common Ground (Both Sources Agree)
- WordRun is a Phaser + Vite + TypeScript mobile word‑association game with Supabase backend.
- Core gameplay logic exists (word chain mechanic, typing input, scoring, traps, and progression).
- The project uses a scene‑based architecture and a data‑driven configuration system.
- Current state is “prototype with core systems implemented” but needs polish and modularization.

## 2) Unified Technical Baseline
- **Architecture:** Phaser scenes for gameplay, UI, map, and transitions. Dev‑only scenes gated by config.
- **Data Layer:** `DataManager` (Supabase integration + caching + offline support) and `GameDataManager` wrapper.
- **Core Systems:** `TypingEngine`, `ScoreManager`, `TrapSystem`, `LevelManager`.
- **Config:** `src/config.ts` + `src/gameConfig.json` control dev flags and gameplay constants.
- **Testing:** Vitest in `src/test/`.

## 3) Known Gaps / Pain Points
- UI is functional but unpolished; UI logic is embedded in large scene files.
- `WordChainGameScene.ts` is monolithic; needs modularization.
- Art direction and 2.5D character integration are incomplete.
- Audio pipeline and asset optimization (atlases, lazy‑loading) are missing.

## 4) Shared Priority Roadmap (Synthesized)
1) **Refactor + UI Separation**
   - Split `WordChainGameScene.ts` into UI, input, state, and effects modules.
   - Reduce DOM construction inside scene logic; move into `src/ui/` helpers.

2) **Visual Direction + Asset Pipeline**
   - Establish a cohesive style guide (colors, typography, UI components).
   - Convert UI assets into atlases and plan per‑land lazy loading.

3) **Character Integration**
   - Decide animation format (spritesheet vs skeletal) and integrate into gameplay loop.

4) **Audio**
   - Add SFX for feedback + looping music; define load strategy.

5) **Backend/Meta Systems**
   - Define data models for leaderboards, daily/weekly bonuses, and referrals.

## 5) Operating Agreement for Agents
- **Use `DataManager` for Supabase access**; avoid direct calls.
- **Respect dev flags** in `src/config.ts` when adding debug features.
- **Keep scenes small and composable**; prefer new modules over expanding monoliths.
- **Document new systems** in concise Markdown for cross‑model handoff.

