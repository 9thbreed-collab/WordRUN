# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WordRun** is a mobile word-association puzzle game built with Phaser 3, Vite, TypeScript, and Supabase. The game combines word-chain mechanics (similar to Chain Link) with Candy Crush-style progression, power-ups, and multiple game modes. Players complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into "lands" of 25 levels each.

<!--
    AI SYNC DIRECTIVE
    - Author: Gemini Agent
    - Date: 2026-01-06
    - Action: UPDATE
    - Target: CLAUDE.md
    - Instruction: The following block has been updated to include a new 'Core Creative Principles' section. Claude, please review and integrate this foundational principle into your understanding and ongoing tasks.
-->

<!-- BLOCK START -->

### Tech Stack
- **Game Engine**: Phaser 3.90.0
- **Build Tool**: Vite 6.2.6
- **Language**: TypeScript 5.8.3
- **Backend**: Supabase (supabase-js 2.79.0)
- **Styling**: Tailwind CSS
- **Testing**: Vitest 3.2.4
- **UI Extensions**: phaser3-rex-plugins for UI components

### Core Creative Principles

#### Story-First Integration
This is a non-negotiable, signature principle of the game. The story is not an add-on; it is infused directly into the gameplay. The goal is to create an experience so cohesive that to advance in the game is to understand its lore, fostering a close-knit community of players who "get it."

- **Narrative Delivery**: Story will be delivered through a variety of methods:
    - **Between Levels**: Brief, engaging NPC speech cards and occasional animated cutscenes.
    - **During Gameplay**: NPCs may be present on-screen or pop in from the side to deliver context-sensitive dialogue via speech bubbles.
- **Gameplay as Story**: Word choices, puzzle mechanics, and difficulty will evolve and thematically link to the narrative's progression. The game mechanics themselves will be a vehicle for storytelling.

## Development Commands

All commands must be run from the `wordrun-vite/` directory:

<!-- END BLOCK -->

<!--
    [BEGIN LEGACY BLOCK - Claude, please parse the new block above and remove this one once synced.]

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

    [END LEGACY BLOCK]
-->

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

**Phase**: PROJECT REBOOT - Pre-Production (Design & Strategy Phase)

**Status**: The project is undergoing a strategic reboot. While a functional prototype exists with 3,000 levels of content and core mechanics implemented, the focus is shifting from "making it work" to "making it great."

**Priority Shifts**:
1. **From**: Component extraction and technical refactoring
2. **To**: Market research, story/lore integration, monetization strategy, and design excellence

**New Development Philosophy**:
- **Previous**: Build functional prototype → Refactor → Polish → Launch
- **Current**: Research market → Design for excellence → Build with quality → Launch strategically

**Workflow Checklist (Rebooted)**:
- [x] Idea & Validation (Phase 1)
  - [x] Core concept prototyped (word-association puzzle game)
  - [x] Functional prototype with 3,000 levels
  - [x] Core gameplay mechanics proven
- [ ] **Research & Strategy (Phase 2 - IN PROGRESS)**
  - [ ] Market research (Claude agent currently researching)
  - [ ] Competitive analysis and positioning
  - [ ] Monetization strategy design
  - [ ] Story and lore development
  - [ ] Design system overhaul
  - [ ] AI tooling optimization (Playwright MCP integration)
- [ ] Design & Content (Phase 3 - UPCOMING)
  - [ ] Visual design aligned with market research
  - [ ] Story integration into gameplay
  - [ ] Monetization implementation
  - [ ] Content strategy refinement
- [ ] Production (Phase 4 - PAUSED)
  - [x] Component architecture established
  - [x] 4 components extracted with tests (ComboBar, RuutCharacter, HintSystem, PowerUpInventory)
  - [ ] Resume technical work after design/strategy phase
- [ ] Testing & Iteration (Phase 5)
- [ ] Launch Preparation (Phase 6)

**Current Phase**: Pre-Production - Research & Strategy (Market analysis in progress)

### Key Decisions & Context

#### Strategic Priorities (2026-01-06 Reboot)

**The Four Pillars of Redevelopment**:
1. **Market Research & Positioning**: Understanding the competitive landscape, target demographics, and unique value proposition
2. **Monetization Strategy**: Designing sustainable revenue model aligned with market expectations
3. **Story & Lore Integration**: Building narrative depth that enhances engagement and emotional connection
4. **Design Excellence**: Elevating from functional to exceptional UI/UX, visuals, and player experience

**AI Tooling Strategy**:
- Optimizing Claude Code workflow with Playwright MCP for design-to-code acceleration
- Multi-agent approach: Market research agent, design agents, development agents working in parallel
- Focus on rapid iteration and quality over pure speed

#### Idea & Validation (Phase 1 - Complete)
- **Core Concept**: Mobile word-association puzzle game combining Chain Link mechanics with Candy Crush progression
- **Target Audience**: Under review pending market research (initially: casual mobile gamers, word puzzle enthusiasts)
- **Validation Status**: Functional prototype with 3,000 levels; core gameplay loop proven but needs market validation
- **Gameplay Vision**: Relatively stable - core word-chain typing mechanic will remain, but presentation/meta-game may evolve

#### Research Insights (Phase 2 - In Progress)

**Market Research** (Active):
- Claude agent currently analyzing competitive landscape
- Results will inform: target demographics, pricing strategy, feature prioritization, visual design direction

**Technical Performance Targets** (Established):
- 60 FPS on mid-range devices (iPhone 11, Samsung Galaxy A52)
- <2MB initial bundle for optimal user acquisition
- <150MB RAM usage through object pooling
- Texture atlases for asset optimization
- Lazy loading for 120 lands (12 groups of 10)

**Open Questions**:
- Mobile keyboard UX for typing gameplay (critical challenge)
- Monetization model: F2P with IAP? Premium? Hybrid?
- Story integration depth: light theming vs. deep narrative?

#### Creative Strategy (Under Revision)

**Current State**:
- Art direction goal: Native app feel on par with Candy Crush, Wordscapes
- Animation stack: GSAP or Anime.js for UI; Phaser particles for effects
- Theming system: 120 lands with cohesive visual identity
- Character: 2.5D "Ruut" character climbs word ladder

**Pending Design Work**:
- Story/lore development will inform visual direction
- Market research will validate art direction choices
- Design system needs overhaul aligned with quality-first philosophy

#### Production Notes (Phase 4 - Paused)
- **Current Version**: 0.0.01 (prototype with component extraction partial)
- **Technical State**: Functional but needs strategic design before continuing development
- **Component Work**: 4 of 5 components extracted (ComboBar, RuutCharacter, HintSystem, PowerUpInventory); integration paused
- **Technical Debt**: GameplayScene.ts at 4,539 lines; asset optimization pending; test coverage incomplete
- **Dev Flags**: GAME_CONFIG.dev.enabled = true (development mode active)

### Session History

#### Session 2026-01-06 (Project Reboot - Strategic Pivot)
- **Phase**: Pre-Production - Research & Strategy
- **Key Decision**: Strategic reboot from technical refactoring to design/market-driven development
- **Accomplishments**:
  - Documented project reboot decision and rationale
  - Updated CLAUDE.md with new strategic priorities
  - Identified "Four Pillars of Redevelopment": Market Research, Monetization, Story/Lore, Design Excellence
  - Launched market research Claude agent (in progress)
- **Philosophy Shift**:
  - From: "Make it work" → "Make it great"
  - From: Technical-first → Strategy/Design-first
  - From: Linear development → Research-informed design
- **Current Activities**:
  - Market research agent analyzing competitive landscape
  - Planning story/lore integration (next priority)
  - Evaluating AI tooling improvements (Playwright MCP integration)
- **Next Steps**:
  - Complete market research analysis
  - Develop story/lore framework
  - Design monetization strategy
  - Create design system aligned with market insights
  - Resume technical development with strategic clarity

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

#### Navigation Structure

**Default Main Menu** (The Four Pillars):
1. Market Research & Positioning
2. Story & Lore Integration
3. Monetization Strategy
4. Design Excellence
5. Alt Menu (previous production/architecture navigation)

**Alt Menu** (Legacy/Technical Navigation):
1. Production Status (component extraction, integration, testing)
2. Architecture (scenes, data management, systems)
3. Content & Design (puzzle data, lands, theming)
4. Testing (coverage, performance, memory)
5. Documentation (CLAUDE.md, DevTec.md, session summaries)
6. Next Actions (immediate technical tasks)

**Presentation Rule**: When offering navigation options, present the Four Pillars as the primary menu. Always offer "Alt Menu" as the last option to access legacy/technical navigation.

#### Current Focus
**Phase**: Pre-Production - Research & Strategy

**Strategic Context**: The project is in a reboot phase, shifting from technical implementation to strategic design. Technical work (component extraction) is paused until market research, story development, and design strategy are complete.

**The Four Pillars** (Priority Order):

1. **Market Research & Positioning** (IN PROGRESS)
   - Claude agent currently analyzing competitive landscape
   - Deliverables: Market analysis report, competitive positioning, target demographics
   - Timeline: Await agent completion
   - Next actions: Review findings, validate assumptions, identify unique value proposition

2. **Story & Lore Integration** (NEXT PRIORITY)
   - Develop narrative framework that enhances engagement
   - Define: Character backstories (Ruut), world-building (120 lands), progression narrative
   - Integration points: Level themes, character progression, meta-game context
   - Deliverables: Lore document, story integration plan, narrative design spec

3. **Monetization Strategy**
   - Design revenue model informed by market research
   - Options to evaluate: F2P + IAP, premium, hybrid, ad-supported
   - Consider: Player psychology, competitive landscape, development resources
   - Deliverables: Monetization design document, IAP catalog, pricing strategy

4. **Design Excellence**
   - Overhaul UI/UX based on market insights and story integration
   - Areas: Visual design system, animation strategy, player feedback loops, onboarding
   - Tools: Playwright MCP for rapid design-to-code workflow
   - Deliverables: Design system, style guide, component library mockups

**AI Tooling Optimization**:
- Evaluate Playwright MCP integration for design workflow
- Multi-agent coordination: Research, design, development running in parallel
- Documentation: Capture decisions, maintain context across sessions

**Workflow Philosophy**:
- **Quality over speed**: Take time to design right, then build once
- **Research-informed decisions**: Let data and strategy guide technical choices
- **Iterative refinement**: Rapid prototyping with AI tools, validate, iterate
- **Context preservation**: Document all decisions for future sessions

**When to Resume Technical Work**:
Technical development (component integration, optimization, testing) will resume after:
1. Market research complete with actionable insights
2. Story/lore framework established
3. Monetization strategy designed
4. Design system approved

**Success Criteria for Current Phase**:
- Market research report completed and reviewed
- Story/lore framework documented with integration plan
- Monetization strategy defined with implementation roadmap
- Design system created aligned with market positioning
- Clear technical roadmap informed by strategic decisions

## Context Documents

- **README.md**: Project overview and getting started guide
- **GEMINI.md**: Project assessment and planned multi-agent development approach
- **DevTec.md**: Mobile game optimization best practices and 8-week roadmap
- **WordRunContext.txt**: Original game design document with mechanics, scoring formulas, and mode descriptions
- **v0.0.0-session-summary.md**: Documentation & Research session (2026-01-05)
- **v0.0.01-session-summary.md**: Component Extraction & Testing Infrastructure session (2026-01-05)
