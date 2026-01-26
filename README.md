# WordRun

**WordRun** is an innovative mobile word-association puzzle game that seamlessly blends engaging word-chain mechanics with Candy Crush-style progression and power-up systems. Built with a "Story-First Integration" philosophy, the game aims to provide a deeply immersive narrative experience where gameplay directly contributes to understanding the game's lore. Players navigate through 3,000 meticulously designed levels, spread across 120 unique "lands," each presenting a challenge to complete word chains of 11 associated words.

## Current Development Status

The project is currently in a **Visual Game Development (VGD) + Component-Driven Development (CDD) Phase** following a strategic reboot. The focus combines visual-first asset creation with architectural discipline, guided by **The Four Pillars of Redevelopment**: Market Research & Positioning, Monetization Strategy, Story & Lore Integration, and Design Excellence.

**Latest Accomplishment (2026-01-26):**
VGD implementation sprint (v0.0.16):
- **Session Type:** Multi-agent visual development workflow
- **Assets Created:** 42 game components extracted and cataloged (32 MAP + 10 UI)
- **Architecture:** Isometric grid system implemented (GridSystem.ts)
- **Tools:** Component catalog HTML, Python extraction scripts, Gemini agent prompts
- **Status:** VGD Phase 1 complete, ready for CDD Phase 1 (Component Interface Contracts)
- **Recent Sessions:** v0.0.15 (admin checkpoint), v0.0.14 (dev principles), v0.0.13 (CDD pivot), v0.0.12 (doc cleanup)

**Four Pillars Progress:**
- **Pillar 1 (Market Research):** Complete - 73K-word competitive landscape analysis
- **Pillar 2 (Story & Lore):** In Progress - 9 nations defined, 8 story beats documented, travel routes established, language system complete
- **Pillar 3 (Monetization):** Pending - Ethical framework established (never gates story/progression)
- **Pillar 4 (Design Excellence):** In Progress - UI analysis complete, emotional design research complete, three testable options ready

## Key Features Implemented

### Prototype (wordrun-vite/)
*   **Functional Prototype:** A robust prototype with 3,000 levels and core gameplay mechanics fully implemented (archived in wordrun-vite/src_archive_2026-01-06).
*   **Word-Chain Gameplay:** Intuitive typing-based word association and chain completion.
*   **Progression System:** Candy Crush-style level progression across 120 "lands."
*   **Dynamic Scoring:** Comprehensive scoring system with speed multipliers, accuracy bonuses, and combo mechanics.
*   **Data Management Layer:** Robust Supabase integration (`DataManager`) with in-memory and local storage caching for offline support.
*   **Phaser 3 Scene-Based Architecture:** Clear separation of concerns for gameplay, UI, and transitions (19 scenes).
*   **Configurable Gameplay:** Extensive data-driven configuration (`gameConfig.json`) for gameplay parameters, scoring, and penalty systems.
*   **Developer Tools:** Integrated debugging and diagnostic tools for efficient development.

### VGD Rebuild (wordrun-rebuild/)
*   **Component Catalog:** 42 extracted game components (32 MAP terrain/buildings/props + 10 UI elements) with visual thumbnails and metadata
*   **Isometric Grid System:** Complete TypeScript grid system with coordinate conversion, snap-to-grid, and height nudging
*   **Visual Development Workflow:** Multi-agent extraction pipeline with Python automation and Gemini AI integration
*   **Component Index:** Interactive HTML catalog at `index/ComponentCatalog.html` for asset discovery
*   **Documentation:** Comprehensive GameplayScene logic reference, extraction prompts, and workflow guides

### Story Integration Framework
*   **9 Nations:** Each with dual spiritual attributes (Fruit of Spirit + Works of Flesh)
*   **8-Beat Story Structure:** Detective-Thriller-Myth narrative arc
*   **National Language Design System:** Mode-specific vocabulary pools and word transformation rules
*   **Travel Routes:** Political relationships and protagonist journey mapping

## Technology Stack

*   **Game Engine:** Phaser 3.90.0
*   **Build Tool:** Vite 6.2.6
*   **Language:** TypeScript 5.8.3
*   **Backend:** Supabase (supabase-js 2.79.0)
*   **Styling:** Tailwind CSS 3.4.18
*   **Testing:** Vitest 3.2.4
*   **UI Extensions:** phaser3-rex-plugins 1.80.16

## How to Run/Test

### Prototype (wordrun-vite/)
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

### VGD Rebuild (wordrun-rebuild/)
```bash
cd wordrun-rebuild

# Development
npm run dev              # Start dev server on port 5176

# View Component Catalog
# Open browser to: http://localhost:5176/index/ComponentCatalog.html

# Build & Preview
npm run build            # Production build
npm run preview          # Preview production build
```

## Next Milestones

**Immediate Priorities:**
*   **Component Interface Contracts (CDD Phase 1):** Define TypeScript interfaces for all 42 extracted components
    - Use `index/components.json` as component inventory source
    - Group components by type (terrain, vegetation, buildings, water, props, UI)
    - Define inputs, outputs, events for each component type
    - Document communication patterns and verify component independence
*   **Scene Assembly (VGD Phase 2):** Implement first map using GridSystem + extracted components
    - Create MapScene.ts with GridSystem integration
    - Render terrain tiles using isometric grid
    - Position buildings/props with height nudging
    - Test in browser at localhost:5176
*   **Git Hygiene:** Review and commit 60+ untracked files (scripts, docs, components, catalog)
*   **Interpolation Decision:** Choose approach for 11 MAP components with minor occlusion artifacts (defer, wait for AI capacity, or manual touch-up)

**Strategic Roadmap:**
*   Continue competitive analysis to inform feature prioritization and visual design direction
*   Finalize monetization strategy (ethical framework: convenience + self-expression, never gates story)
*   Complete Design Excellence deliverables (design system, style guide, component library)
*   Resume technical development with strategic clarity (asset optimization, texture atlases, lazy loading)

## Performance Targets

*   **Frame Rate:** 60 FPS on mid-range devices (iPhone 11, Samsung Galaxy A52)
*   **Bundle Size:** <2MB initial for optimal user acquisition
*   **Memory Usage:** <150MB through object pooling and asset optimization
*   **Assets:** Texture atlases with lazy loading (12 groups of 10 lands)
*   **Responsiveness:** <100ms interaction start, 300-500ms feedback completion

## Documentation

**Strategy & Research:**
- `Market-Research-Brief-2026.md` - Competitive landscape analysis (73K words)
- `emotional-design-research-report.md` - Player psychology synthesis (58K words)
- `WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md` - Prioritized implementation guide
- `EMOTIONAL_DESIGN_CHECKLIST.md` - Design audit tool

**Story & World:**
- `Lore&StoryDraft1.md` - Core narrative (9 nations, universal language)
- `AlignedStorySynopsisBeats_v2.md` - Detective-Thriller-Myth structure (8 beats)
- `WorldState_And_TravelRoutes.md` - Political dynamics, protagonist routes
- `NationalLanguageDesignSystem.md` - Language specifications per nation
- `NationalWordPools.md` - Vocabulary pools by nation/mode

**Development:**
- `WORDRUN-AI-DEVELOPMENT-PLAN.md` - Multi-agent MVP strategy (65 pages)
- `DevTec.md` - Mobile optimization roadmap (8 weeks)
- `WordRunContext.txt` - Original game design document
- `WordRun_PRD_MVP.md` - MVP Product Requirements Document

**UI Analysis & Design:**
- `WR_UI_A_B_inventory.md` - UI stack & screenshot inventory (22 components, 12 screenshots analyzed)
- `WR_UI_C_D1-D4_options.md` - 3 testable UI configuration options with emotional design principles
- `WR_UI_FINAL_D5_E.md` - ChatGPT mockup prompts & implementation reference

**Reference:**
- `CLAUDE.md` - Project overview and AI agent guidance with development principles
- `GEMINI.md` - Multi-agent development approach
- `CDD_IMPLEMENTATION_GUIDE.md` - Component-driven development implementation checklist
- `COMPONENT_DRIVEN_ARCHITECTURE_GUIDE.md` - CDD philosophy and principles
- `CLAUDE_SESSION_HISTORY.md` - Detailed session logs (v0.0.0 through v0.0.09)
- `v0.0.10-session-summary.md` through `v0.0.15-session-summary.md` - Recent sessions
- `README.md` - This file

---

*Last updated: 2026-01-26*
*Version: 0.0.16*
