# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**WordRun** is a mobile word-association puzzle game built with Phaser 3, Vite, TypeScript, and Supabase. Players complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into 120 "lands" of 25 levels each.

### Tech Stack
- **Game Engine**: Phaser 3.90.0
- **Build Tool**: Vite 6.2.6
- **Language**: TypeScript 5.8.3
- **Backend**: Supabase (supabase-js 2.79.0)
- **Styling**: Tailwind CSS
- **Testing**: Vitest 3.2.4
- **UI Extensions**: phaser3-rex-plugins for UI components

### Core Creative Principles

**Story-First Integration** (Non-negotiable):
The story is infused directly into gameplay, not an add-on. The goal is an experience so cohesive that advancing in the game means understanding its lore.

- **Narrative Delivery**: NPC speech cards between levels, context-sensitive dialogue during gameplay
- **Gameplay as Story**: Word choices, mechanics, and difficulty evolve with narrative progression

---

## Development Commands

All commands run from `wordrun-vite/`:

```bash
cd wordrun-vite

# Development
npm run dev              # Start dev server on port 5175

# Build & Preview
npm run build            # Production build (target: ES2020)
npm run preview          # Preview production build on port 4175

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

---

## Architecture Overview

### Scene System

**Core Scenes** (`src/scenes/`):
- `Preloader.ts` - Asset loading
- `TitleScreen.ts` - Main menu
- `MapScene.ts` - Level selection for a land
- `WorldMapScene.ts` - Navigation between 120 lands
- `GameplayScene.ts` - Primary gameplay (4,539 lines)
- `WordChainGameScene.ts` - Alternative game mode (1,819 lines)
- `MapTransition.ts` - Transition animations

**Dev-Only Scenes** (when `GAME_CONFIG.dev.enabled = true`):
- `TestLevel.ts`, `AdminConsole.ts`, `DiagnosticsScene.ts`

### Data Layer

**DataManager** (`src/DataManager.ts`): Singleton handling all Supabase integration with caching and offline support. Manages assets, art packs, levels, player state, and feature flags.

**GameDataManager** (`src/GameDataManager.ts`): Higher-level APIs for gameplay logic.

### Core Systems

| System | File | Purpose |
|--------|------|---------|
| TypingEngine | `src/TypingEngine.ts` | Text input, typo forgiveness (Levenshtein), command parsing |
| GameModeManager | `src/GameModes.ts` | Story, Hidden Letter, Scrabble, multiplayer modes |
| TrapSystem | `src/TrapSystem.ts` | Locked rungs, penalty box with escalating wait times |
| ScoreManager | `src/ScoreManager.ts` | Points, multipliers, combo system, penalties |
| LevelManager | `src/LevelManager.ts` | Level progression and land transitions |

### Configuration

**GAME_CONFIG** (`src/config.ts`):
- Screen: 390 x 844 (mobile portrait)
- Lives per land: 5
- Penalty tiers: [15, 60, 240, 960] minutes
- Dev flags (SET `dev.enabled = false` BEFORE PRODUCTION)

**gameConfig.json** (`src/gameConfig.json`): Data-driven gameplay parameters.

---

## Implementation Notes

### Working with Scenes
1. Scenes registered in `src/main.ts`; dev-only scenes conditional on `GAME_CONFIG.dev.enabled`
2. Use `this.scene.start('SceneKey', { data })` or `this.scene.launch('ParallelScene')`
3. `GameplayScene.ts` is large - layout constants at top, uses DOM manipulation throughout

### Working with Supabase
1. Always use `DataManager.getInstance()`, never call Supabase directly
2. DataManager caches to memory and localStorage for offline support
3. Player state: `DataManager.getPlayerState()` / `DataManager.updatePlayerState()`

### Testing
- Tests in `src/test/` mirroring source structure
- Run single test: `npm run test:watch -- DataManager.test.ts`

### Common Pitfalls
1. Scene keys are string-based - check exact casing
2. Always use `DataManager.getInstance()`, never `new DataManager()`
3. DataManager initialization is async - ensure completion before accessing data
4. TypeScript strict mode requires all types properly defined
5. DOM elements via Phaser's DOM plugin (`this.add.dom()` or utility functions)

---

## Project Structure

```
wordrun-vite/
├── src/
│   ├── scenes/          # Phaser scenes (19 files)
│   ├── services/        # Runtime services (TrapRuntime, Router, Flags)
│   ├── gameplay/        # Gameplay modules (Rules, WheelGesture)
│   ├── ui/              # UI components and layouts
│   ├── dev/             # Development tools (DebugHUD, LogBus)
│   ├── test/            # Vitest tests
│   ├── main.ts          # Entry point
│   ├── config.ts        # Global configuration
│   ├── gameConfig.json  # Data-driven config
│   ├── content.ts       # Puzzle/level content
│   ├── DataManager.ts   # Supabase data layer
│   ├── TypingEngine.ts
│   ├── GameModes.ts
│   ├── ScoreManager.ts
│   ├── TrapSystem.ts
│   └── LevelManager.ts
├── public/assets/       # Game assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Current Project State

### Phase
**Pre-Production - Research & Strategy** (Project Reboot)

Functional prototype exists with 3,000 levels. Focus shifted from "making it work" to "making it great" through strategic design before continuing development.

### The Four Pillars

| Pillar | Status | Key Deliverables |
|--------|--------|------------------|
| 1. Market Research | Complete | Market-Research-Brief-2026.md (73K words) |
| 2. Story & Lore | In Progress | 9 nations, 8 story beats, travel routes defined |
| 3. Monetization | Pending | Awaiting market research integration |
| 4. Design Excellence | Pending | Emotional design research complete (58K words) |

### Latest Accomplishment (2026-01-16 Session v0.0.13)
Brief orientation session with comprehensive handoff preparation:
- **Session Type:** Project state review and context verification
- **No Active Development:** Orientation-only session following v0.0.12 cleanup
- **Critical Observation:** Land Distribution Matrix has been "next priority" for 7 consecutive sessions without execution
- **Handoff Documentation:** v0.0.13-session-summary.md created for seamless continuity
- **Previous Sessions:** v0.0.12 (documentation cleanup), v0.0.11 (UI analysis with 3 configuration options), v0.0.10 (session summaries created)

### Next Priority: Land Distribution Matrix

**Deliverable**: Create `LandDistributionMatrix.md` mapping all 120 lands to:
- Nation (Aethelgard, Carnea, Salomia, Gilead, Niridia, Tobin, Kanaan, Patmos, Corinthia)
- Act (First Half: Lands 1-60, Second Half: Lands 61-120)
- Border relationship ('ally', 'neutral', 'tense', 'enemy')
- Story beat assignment (distribute 8 core beats across 120 lands)
- Language mode ('A' Transformed, 'B' Base, 'C' Rebellion)
- Difficulty tier

**Required Context**:
- WorldState_And_TravelRoutes.md (political relations, travel routes)
- AlignedStorySynopsisBeats_v2.md (8 story beats)
- NationalLanguageDesignSystem.md (language specifications)
- WORDRUN-AI-DEVELOPMENT-PLAN.md Section 6.2.1 (LandTheme schema)

---

## The Nine Nations

| Nation | Fruit of Spirit | Work of Flesh |
|--------|----------------|---------------|
| Aethelgard | Love | Hatred |
| Carnea | Joy | Drunkenness |
| Salomia | Peace | Strife |
| Gilead | Longsuffering | Wrath |
| Niridia | Gentleness | Murders |
| Tobin | Goodness | Envyings |
| Kanaan | Faith | Idolatry |
| Patmos | Meekness | Witchcraft |
| Corinthia | Temperance | Adultery |

---

## Technical Targets

- **Performance**: 60 FPS on mid-range devices (iPhone 11, Samsung Galaxy A52)
- **Bundle**: <2MB initial for optimal UA
- **RAM**: <150MB through object pooling
- **Assets**: Texture atlases, lazy loading (12 groups of 10 lands)

---

## Context Documents

### Strategy & Research
- `Market-Research-Brief-2026.md` - Competitive landscape analysis (73K words)
- `emotional-design-research-report.md` - Player psychology synthesis (58K words)
- `WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md` - Prioritized implementation guide
- `EMOTIONAL_DESIGN_CHECKLIST.md` - Design audit tool

### Story & World
- `Lore&StoryDraft1.md` - Core narrative (9 nations, universal language)
- `AlignedStorySynopsisBeats_v2.md` - Detective-Thriller-Myth structure (8 beats)
- `WorldState_And_TravelRoutes.md` - Political dynamics, protagonist routes
- `NationalLanguageDesignSystem.md` - Language specifications per nation
- `NationalWordPools.md` - Vocabulary pools by nation/mode

### Development
- `WORDRUN-AI-DEVELOPMENT-PLAN.md` - Multi-agent MVP strategy (65 pages)
- `DevTec.md` - Mobile optimization roadmap (8 weeks)
- `WordRunContext.txt` - Original game design document
- `WordRun_PRD_MVP.md` - MVP Product Requirements Document

### UI Analysis & Design
- `WR_UI_A_B_inventory.md` - UI stack & screenshot inventory (22 components, 12 screenshots analyzed)
- `WR_UI_C_D1-D4_options.md` - 3 testable UI configuration options with emotional design principles
- `WR_UI_FINAL_D5_E.md` - ChatGPT mockup prompts & implementation reference

### Reference
- `CLAUDE_SESSION_HISTORY.md` - Archived session logs (v0.0.0 through v0.0.09)
- `v0.0.10-session-summary.md` through `v0.0.13-session-summary.md` - Recent sessions
- `README.md` - Project overview
- `GEMINI.md` - Multi-agent development approach
- `Clarity.txt` - Director's vision document

---

## Navigation

**Primary Menu** (Four Pillars):
1. Market Research & Positioning
2. Story & Lore Integration
3. Monetization Strategy
4. Design Excellence
5. Alt Menu (technical/production)

**Alt Menu** (Technical):
1. Production Status
2. Architecture
3. Content & Design
4. Testing
5. Documentation
6. Next Actions

---

*For detailed session history, see `CLAUDE_SESSION_HISTORY.md`*
*Last updated: 2026-01-16*
