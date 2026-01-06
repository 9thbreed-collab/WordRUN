# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WordRun** is a mobile word-association puzzle game built with Phaser 3, Vite, TypeScript, and Supabase. The game combines word-chain mechanics (similar to Chain Link) with Candy Crush-style progression, power-ups, and multiple game modes. Players complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into "lands" of 25 levels each.

### Tech Stack
- **Game Engine**: Phaser 3.90.0
- **Build Tool**: Vite 6.2.6
- **Language**: TypeScript 5.8.3
- **Backend**: Supabase (supabase-js 2.79.0)
- **Styling**: Tailwind CSS
- **Testing**: Vitest 3.2.4
- **UI Extensions**: phaser3-rex-plugins for UI components

## Development Commands

All commands must be run from the `wordrun-vite/` directory:

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

## Architecture Overview

### Scene-Based Structure

The game uses Phaser's scene system with a clear separation between gameplay, UI, and transitions:

**Core Scenes** (src/scenes/):
- `Preloader.ts` - Asset loading
- `TitleScreen.ts` - Main menu entry point
- `MapScene.ts` - Level selection for a single land
- `WorldMapScene.ts` - Meta-map for navigating between lands (3,000 levels / 25 = 120 lands)
- `GameplayScene.ts` - Primary gameplay scene (4,539 lines, handles typing-based word chains)
- `WordChainGameScene.ts` - Alternative game mode scene (1,819 lines)
- `MapTransition.ts` - Transition animations between scenes

**Dev-Only Scenes** (only loaded when `GAME_CONFIG.dev.enabled = true`):
- `TestLevel.ts` - Testing environment
- `AdminConsole.ts` - Administrative tools
- `DiagnosticsScene.ts` - Performance diagnostics

### Data Management Layer

**DataManager** (`src/DataManager.ts`): Singleton class that handles all Supabase integration with caching and offline safety. It manages:
- Assets (sprites, animations)
- Art packs (theming system)
- Map nodes and edges
- Levels and puzzles
- Player state (hearts, lives, progress)
- Feature flags and localization
- Seeding default data on first run

**GameDataManager** (`src/GameDataManager.ts`): Game-specific data wrapper providing higher-level APIs for gameplay logic.

### Core Gameplay Systems

**TypingEngine** (`src/TypingEngine.ts`): Handles text input with:
- Command parsing (`?` for hints, `/skip`, `!surge`, `!freeze`, etc.)
- Typo forgiveness using Levenshtein distance (1-character difference allowed within 2 seconds for words ≥4 characters)
- Target word matching

**GameModeManager** (`src/GameModes.ts`): Manages different game modes:
- **Story Mode**: Sequential progression through 3,000 levels with lives and penalty box
- **Hidden Letter Mode**: All words covered, reveal within 10s for bonus
- **Scrabble Mode**: Unscramble letters on each rung
- **Versus/Teams/Co-op**: Multiplayer modes (planned/in development)

**TrapSystem** (`src/TrapSystem.ts` + `src/services/TrapRuntime.ts`): Handles gameplay obstacles:
- Locked rungs that force skipping
- Number of locked rungs varies by meta-level (up to 10)
- Auto-solves locked rungs at end but increases total rungs required
- Penalty box system with escalating wait times

**ScoreManager** (`src/ScoreManager.ts`): Tracks scoring with:
- Base points per word: 100 (configurable in gameConfig.json)
- Speed multipliers (1.0 → 2.0 based on avg link time)
- Accuracy multipliers
- Combo system (COMBO_MIN 0.01 → COMBO_MAX 1.0 with drainage tiers)
- Penalties for hints (-25), skips (-100), wrong words (-50)

**LevelManager** (`src/LevelManager.ts`): Handles level progression and meta-level (land) transitions.

### Configuration System

**GAME_CONFIG** (`src/config.ts`): Central configuration object containing:
- Screen dimensions (390 x 844 - mobile portrait)
- Lives per land (5)
- Penalty wait tiers: [15, 60, 240, 960] minutes
- **Dev flags** (critical for testing):
  - `dev.enabled`: Master switch for dev tools (SET TO FALSE BEFORE PRODUCTION)
  - `dev.skipMapScene`: Jump straight to gameplay
  - `dev.ignorePenaltyAtStartup`: Bypass penalty box on startup
  - `dev.fillSampleChain`: Pre-fill sample word chains
  - `dev.showTitleTestButtons`: Show test buttons on title screen
  - `dev.showHudAdminButtons`: Show theme/admin buttons in gameplay HUD

**gameConfig.json** (`src/gameConfig.json`): Data-driven configuration for:
- Screen size, debug mode, render settings
- Gameplay parameters (lives, skips, hint tokens, typo forgiveness)
- Scoring constants
- Penalty box durations

### Content & Puzzle Data

**DEMO_LEVELS** (`src/content.ts`): Contains the actual word chain puzzles with metadata:
- Each level specifies the chain of words
- StarChallengeConfig for bonus objectives
- Difficulty progression

**Lands System** (`src/lands.ts` + `src/landMeta.ts`):
- 120 lands total (3,000 levels / 25 per land)
- Each land has theming, difficulty, and metadata
- Land progression tracked in player state

### UI Components

**Layout System** (`src/ui/Layout.ts`): Responsive scaling with `configureScale()` function.

**NameOverlay** (`src/ui/NameOverlay.ts`): Player name input/display component.

**DOM Utilities** (`src/utils.ts`): Helper functions including `mountDom()` and `basicColumn()` for creating HTML UI elements within Phaser scenes.

### Development Tools

**DebugBus** (`src/dev/DebugHUD.ts`): Scene transition tracking and debugging.

**LogBus** (`src/dev/LogBus.ts`): Centralized logging system.

**LogOverlay** (`src/scenes/LogOverlay.ts`): Visual debug overlay (toggled via dev flags).

## Important Implementation Notes

### Working with Scenes

1. **Scene Registration**: All scenes are registered in `src/main.ts`. Dev-only scenes are conditionally added based on `GAME_CONFIG.dev.enabled`.

2. **Scene Transitions**: Use Phaser's scene management:
   ```typescript
   this.scene.start('SceneKey', { data: passedData })
   this.scene.launch('ParallelScene') // Run alongside current scene
   ```

3. **Large Scene Files**: `GameplayScene.ts` is 4,539 lines. When modifying:
   - Look for layout constants at the top (LOCK_LAYOUT, WORDBOX_MAX_W_PX, etc.)
   - The file uses extensive DOM manipulation for UI
   - Combo system is integrated throughout

### Working with Supabase

1. **Always use DataManager**: Never call Supabase directly. Use `DataManager.getInstance()`.

2. **Caching**: DataManager caches data in-memory and localStorage for offline support.

3. **Player State**: Access via `DataManager.getPlayerState()`, update via `DataManager.updatePlayerState()`.

4. **Initialization**: `DataManager.initialize()` is called early in `main.ts` and seeds default data if needed.

### Testing

1. **Test Structure**: Tests live in `src/test/` with subdirectories matching source structure.

2. **Running Single Test**:
   ```bash
   npm run test:watch -- DataManager.test.ts
   ```

3. **Setup**: `src/test/setup.ts` configures the Vitest environment.

### Development vs Production

**Before submitting to app stores**:
1. Set `GAME_CONFIG.dev.enabled = false` in `src/config.ts`
2. This will:
   - Remove all dev-only scenes (TestLevel, AdminConsole, DiagnosticsScene)
   - Hide test buttons on title screen
   - Disable debug overlays
   - Enforce penalty box timing
   - Remove sample data pre-filling

### Common Pitfalls

1. **Scene Key Typos**: Scene keys are string-based. Double-check exact casing when calling `this.scene.start()`.

2. **DataManager Singleton**: Always use `getInstance()`, never `new DataManager()`.

3. **Async Initialization**: DataManager initialization is async. Ensure it completes before accessing player data.

4. **TypeScript Strict Mode**: The project uses strict TypeScript. All types must be properly defined.

5. **DOM Elements in Phaser**: The game uses Phaser's DOM plugin (`dom: { createContainer: true }`). HTML elements are created via `this.add.dom()` or utility functions.

## Project Structure Reference

```
wordrun-vite/
├── src/
│   ├── scenes/          # Phaser scenes (19 files)
│   ├── services/        # Runtime services (TrapRuntime, Router, Flags, etc.)
│   ├── gameplay/        # Gameplay-specific modules (Rules, WheelGesture, etc.)
│   ├── ui/              # UI components and layouts
│   ├── dev/             # Development tools (DebugHUD, LogBus)
│   ├── test/            # Vitest tests
│   ├── config/          # Configuration modules
│   ├── data/            # Data adapters
│   ├── db/              # Database schemas
│   ├── map/             # Map-related utilities
│   ├── styles/          # CSS modules
│   ├── main.ts          # Phaser bootstrap entry point
│   ├── config.ts        # Global game configuration
│   ├── gameConfig.json  # Data-driven configuration
│   ├── content.ts       # Puzzle/level content
│   ├── DataManager.ts   # Supabase data layer
│   ├── GameDataManager.ts
│   ├── TypingEngine.ts
│   ├── GameModes.ts
│   ├── ScoreManager.ts
│   ├── TrapSystem.ts
│   ├── LevelManager.ts
│   ├── ProfileStore.ts
│   ├── AdManager.ts
│   ├── AdminConsole.ts
│   ├── AssetLoader.ts
│   ├── PuzzleData.ts
│   ├── auth.ts
│   ├── supabase.ts
│   ├── utils.ts
│   └── style.css
├── public/
│   └── assets/         # Game assets (animations.json, asset-pack.json)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Project State

### Current Workflow Phase

**Phase**: Production - Code Refactoring (Week 1-2 of DevTec.md roadmap)

**Workflow Checklist**:
- [x] Idea & Validation
  - [x] Core concept defined (word-association puzzle game)
  - [x] Target audience identified (mobile casual gamers)
  - [x] Prototype implemented (functional but unpolished)
- [x] Research & Planning
  - [x] Codebase analysis completed
  - [x] Architecture documented (CLAUDE.md)
  - [x] Mobile optimization research (DevTec.md)
- [ ] Production (In Progress - Week 1-2)
  - [x] Component architecture established (dependency injection, lifecycle management)
  - [x] ComboBar component extracted with tests
  - [x] RuutCharacter component extracted with tests
  - [x] HintSystem component extracted with tests
  - [x] PowerUpInventory component extracted with tests
  - [ ] WordBox component extraction (next session)
  - [ ] Component integration into GameplayScene.ts
  - [ ] Test coverage report and optimization
  - [ ] Memory leak testing (Chrome DevTools)
  - [ ] Asset optimization (texture atlases) - Week 3-4
  - [ ] Mobile testing setup - Week 5-6
  - [ ] Visual polish - Week 7-8
  - [ ] Build optimization - Week 9-10
- [ ] Testing & Iteration
  - [ ] Integration tests
  - [ ] Real device testing
  - [ ] Performance profiling
  - [ ] Bug fixes
- [ ] Launch Preparation
  - [ ] App Store submission
  - [ ] Google Play submission
  - [ ] Marketing materials

**Current Phase**: Production - Code Refactoring (Week 1-2, 80% complete)

### Key Decisions & Context

#### Idea & Validation
- **Core Concept**: Mobile word-association puzzle game combining Chain Link mechanics with Candy Crush progression
- **Target Audience**: Casual mobile gamers who enjoy word puzzles (Wordscapes, Chain Link players)
- **Validation Status**: Prototype functional with 3,000 levels of content; core gameplay loop proven

#### Research Insights
- **Performance Target**: 60 FPS on mid-range devices (iPhone 11, Samsung Galaxy A52)
- **Bundle Size**: Target <2MB initial load for optimal user acquisition
- **Memory Management**: Object pooling essential for mobile (target: <150MB RAM usage)
- **Asset Strategy**: Texture atlases required; lazy loading for 120 lands (12 groups of 10)
- **Mobile Input**: Virtual keyboard UX is critical challenge for typing gameplay

#### Creative Strategy
- **Art Direction**: Native app feel on par with Candy Crush, Wordscapes
- **Animation Approach**: GSAP or Anime.js for UI; Phaser particles for gameplay effects
- **Theming System**: 120 lands with cohesive visual identity per land
- **Character**: 2.5D "Ruut" character climbs word ladder (currently static)

#### Production Notes
- **Current Version**: 0.0.01 (component extraction phase)
- **Critical Technical Debt**: GameplayScene.ts at 4,539 lines needs component-based refactoring (4 of 5 components extracted, integration pending)
- **Asset Issues**: Individual PNGs in `/public/assets/ui/` should be atlases
- **Testing Gap**: Vitest configured; 4 new test files created for extracted components; coverage report pending
- **Dev Flags**: GAME_CONFIG.dev.enabled must be false before production (currently true)

### Session History

#### Session 2026-01-05 (Component Extraction & Testing Infrastructure)
- **Phase**: Production - Code Refactoring (Week 1-2 of DevTec.md roadmap)
- **Accomplishments**:
  - Extracted 4 components from GameplayScene.ts: ComboBar, RuutCharacter, HintSystem, PowerUpInventory
  - Created 4 test files with comprehensive test cases
  - Implemented dependency injection pattern for testability
  - Added proper lifecycle management (init/shutdown) to prevent memory leaks
  - Established component architecture patterns (UI vs gameplay separation)
  - Created "Text docs/" directory with extraction planning materials
- **Key Decisions**:
  - Use dependency injection for components (not singleton managers)
  - Separate UI components (src/ui/) from gameplay components (src/gameplay/)
  - Implement callback-based integration for separation of concerns
  - Defer GameplayScene.ts integration to next session (test components first)
  - Keep DOM approach with improved cleanup (revisit Phaser canvas later if needed)
- **Next Steps**:
  - Extract WordBox component (most complex, ~500+ lines)
  - Integrate all 5 components into GameplayScene.ts
  - Run test coverage report (`npm run test:coverage`)
  - Memory leak testing with Chrome DevTools

#### Session 2026-01-05 (Documentation & Research)
- **Phase**: Pre-production (Code Architecture Review)
- **Accomplishments**:
  - Created comprehensive CLAUDE.md (255 lines) documenting architecture, systems, and patterns
  - Researched mobile game optimization using mobile-game-dev-expert agent
  - Created DevTec.md with 8-week implementation roadmap
  - Analyzed codebase: 19 scenes, 4,539-line GameplayScene.ts, DataManager singleton pattern
  - Documented current technical debt and optimization priorities
- **Key Decisions**:
  - Prioritize component-based refactoring before asset optimization
  - Use texture atlases exclusively for production builds
  - Implement lazy loading for 120 lands in 12 groups
  - Target 60 FPS, <2MB bundle, <150MB RAM for mobile performance
- **Next Steps**:
  - Week 1-2: Extract components from GameplayScene.ts (WordBox, ComboBar, RuutCharacter, PowerUpInventory, HintSystem)
  - Week 3-4: Create texture atlases and implement lazy loading
  - Week 5-6: Mobile testing setup with real iOS/Android devices

### Working Instructions

#### Current Focus
**Phase**: Production - Code Refactoring (Week 1-2, 80% complete)

**Immediate Task**: Complete component extraction and integration

**Workflow Prompt**:
When working on final component extraction and integration:
1. **Extract WordBox component** (next priority):
   - Most complex component (~500+ lines)
   - Handles word display, input, typo forgiveness
   - Consider sub-components: WordBoxDisplay, WordBoxInput, WordBoxAnimations
   - Create WordBox.test.ts with comprehensive test cases
   - Follow established patterns: dependency injection, init/shutdown lifecycle

2. **Integrate components into GameplayScene.ts**:
   - Import all 5 components: ComboBar, RuutCharacter, HintSystem, PowerUpInventory, WordBox
   - Replace inline code with component instantiation
   - Pass required dependencies and callbacks
   - Integrate one component at a time (test after each)
   - Keep original code commented until components verified
   - Test gameplay thoroughly after each integration

3. **Run test coverage report**:
   - Execute `npm run test:coverage`
   - Analyze coverage gaps
   - Add tests for uncovered code paths
   - Target: 80% for components, 60% for scenes

4. **Memory leak testing**:
   - Profile with Chrome DevTools Memory tab
   - Test scene transitions (memory should not grow)
   - Verify shutdown methods working correctly
   - Target: <150MB RAM usage

**Constraints**:
- Preserve existing gameplay behavior (no feature changes during refactoring)
- Maintain TypeScript strict mode compliance
- Test each component integration independently
- Document component APIs in code comments

**Success Criteria**:
- All 5 components extracted and tested
- GameplayScene.ts reduced from 4,539 lines to <500 lines
- Each component is <300 lines
- Test coverage >80% for components
- Memory leaks eliminated (verified with Chrome DevTools)
- All gameplay functionality preserved

## Context Documents

- **README.md**: Project overview and getting started guide
- **GEMINI.md**: Project assessment and planned multi-agent development approach
- **DevTec.md**: Mobile game optimization best practices and 8-week roadmap
- **WordRunContext.txt**: Original game design document with mechanics, scoring formulas, and mode descriptions
- **v0.0.0-session-summary.md**: Documentation & Research session (2026-01-05)
- **v0.0.01-session-summary.md**: Component Extraction & Testing Infrastructure session (2026-01-05)
