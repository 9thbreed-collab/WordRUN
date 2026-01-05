# Repository Guidelines

## Project Structure & Module Organization
- `wordrun-vite/` is the active game project (Vite + Phaser + TypeScript).
- Source code: `wordrun-vite/src/` (scenes in `src/scenes/`, gameplay systems in `src/gameplay/`, data in `src/data/`).
- Tests: `wordrun-vite/src/test/` (Vitest).
- Assets: `wordrun-vite/public/assets/` (UI, fonts, animations, character art).
- Top-level docs: `CLAUDE.md`, `GEMINI.md`, `DevTec.md`, `WordRunContext.txt`.

## Build, Test, and Development Commands
Run from `wordrun-vite/`:
- `npm run dev` — start the Vite dev server (default port 5175).
- `npm run build` — create a production build (ES2020 target).
- `npm run preview` — preview the production build (default port 4175).
- `npm run test` — run Vitest once.
- `npm run test:watch` — watch mode.
- `npm run test:coverage` — coverage report.

## Coding Style & Naming Conventions
- Language: TypeScript (Phaser scenes and systems).
- Indentation: follow existing style in `wordrun-vite/src/` (2 spaces in most files).
- Naming: PascalCase for classes/scenes (`GameplayScene`), camelCase for variables/functions.
- Keep scene logic modular; prefer moving large UI blocks into `src/ui/` utilities.

## Testing Guidelines
- Framework: Vitest with setup in `wordrun-vite/src/test/setup.ts`.
- Naming: `*.test.ts` (e.g., `DataManager.test.ts`).
- Run a single test: `npm run test:watch -- DataManager.test.ts`.

## Commit & Pull Request Guidelines
- No git history was available in this workspace, so commit conventions are unknown.
- If contributing via PRs, include:
  - A short description of scope and risks.
  - Test results or a note on why tests weren't run.
  - Screenshots/GIFs for UI changes when applicable.

## Configuration & Runtime Notes
- Central config lives in `wordrun-vite/src/config.ts` and `wordrun-vite/src/gameConfig.json`.
- Dev flags (e.g., `GAME_CONFIG.dev.enabled`) gate test scenes and debug tools.
- Supabase access should go through `DataManager.getInstance()`; avoid direct API calls.

## Project State

### Current Workflow Phase

**Phase**: Pre-production (Code Architecture Review)

**Workflow Checklist**:
- [x] Idea & Validation
  - [x] Core concept defined (word-association puzzle game)
  - [x] Target audience identified (mobile casual gamers)
  - [x] Prototype implemented (functional but unpolished)
- [x] Research & Planning
  - [x] Codebase analysis completed
  - [x] Architecture documented (CLAUDE.md)
  - [x] Mobile optimization research (DevTec.md)
- [ ] Production (In Progress)
  - [ ] Code refactoring (GameplayScene.ts component extraction)
  - [ ] Asset optimization (texture atlases)
  - [ ] Mobile testing setup
  - [ ] Visual polish
  - [ ] Build optimization
- [ ] Testing & Iteration
  - [ ] Integration tests
  - [ ] Real device testing
  - [ ] Performance profiling
  - [ ] Bug fixes
- [ ] Launch Preparation
  - [ ] App Store submission
  - [ ] Google Play submission
  - [ ] Marketing materials

**Current Phase**: Production - Code Refactoring (Weeks 1-2 of roadmap)

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
- **Current Version**: 0.0.0 (prototype stage)
- **Critical Technical Debt**: GameplayScene.ts at 4,539 lines needs component-based refactoring
- **Asset Issues**: Individual PNGs in `/public/assets/ui/` should be atlases
- **Testing Gap**: Vitest configured but minimal coverage; needs integration tests before refactoring
- **Dev Flags**: GAME_CONFIG.dev.enabled must be false before production (currently true)

### Session History

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
**Phase**: Production - Code Refactoring (Component Extraction)

**Immediate Task**: Break down GameplayScene.ts (4,539 lines) into modular components

**Workflow Prompt**:
When working on component extraction:
1. Read GameplayScene.ts to understand current structure
2. Identify component boundaries (WordBox, ComboBar, RuutCharacter, PowerUpInventory, HintSystem)
3. Create new component files in `src/ui/` or `src/gameplay/`
4. Extract logic and DOM manipulation into component classes
5. Implement proper cleanup methods (`shutdown()`) to prevent memory leaks
6. Update GameplayScene.ts to instantiate components
7. Test functionality after each component extraction
8. Monitor memory usage with Chrome DevTools

**Constraints**:
- Preserve existing gameplay behavior (no feature changes during refactoring)
- Maintain TypeScript strict mode compliance
- Add tests for extracted components before integration
- Document component APIs in code comments

**Success Criteria**:
- GameplayScene.ts reduced from 4,539 lines to <500 lines
- Each component is <300 lines
- Memory leaks eliminated (test with Chrome DevTools Memory Profiler)
- All existing tests still pass
