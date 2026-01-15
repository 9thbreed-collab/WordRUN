# WordRun

**WordRun** is an innovative mobile word-association puzzle game that seamlessly blends engaging word-chain mechanics with Candy Crush-style progression and power-up systems. Built with a "Story-First Integration" philosophy, the game aims to provide a deeply immersive narrative experience where gameplay directly contributes to understanding the game's lore. Players navigate through 3,000 meticulously designed levels, spread across 120 unique "lands," each presenting a challenge to complete word chains of 11 associated words.

## Current Development Status

The project is currently in a **Pre-Production - Design Excellence Phase** following a strategic reboot. The focus has shifted from technical prototyping to a comprehensive design and market-driven approach, guided by **The Four Pillars of Redevelopment**: Market Research & Positioning, Monetization Strategy, Story & Lore Integration, and Design Excellence.

**Latest Accomplishment (2026-01-15):**
Completed comprehensive multi-agent UI analysis pipeline producing three testable UI configuration options:
- **UI Stack Inventory:** Catalogued 22 existing components (AL-001 through AL-022) and analyzed 12 gameplay screenshots
- **Emotional Design Principles:** Extracted 10 core principles from 58K-word research report
- **Three Configuration Options:** Conservative Balance (baseline, 2-3 weeks), Progressive Delight (enhanced, 3-4 weeks), Experimental Flow (cinematic, 6-8 weeks)
- **Implementation Materials:** ChatGPT mockup prompts, AL registry, testing checklist, change point analysis, A/B testing framework

**Four Pillars Progress:**
- **Pillar 1 (Market Research):** Complete - 73K-word competitive landscape analysis
- **Pillar 2 (Story & Lore):** In Progress - 9 nations defined, 8 story beats documented, travel routes established, language system complete
- **Pillar 3 (Monetization):** Pending - Ethical framework established (never gates story/progression)
- **Pillar 4 (Design Excellence):** In Progress - UI analysis complete, emotional design research complete, three testable options ready

## Key Features Implemented

*   **Functional Prototype:** A robust prototype with 3,000 levels and core gameplay mechanics fully implemented (archived in wordrun-vite/src_archive_2026-01-06).
*   **Word-Chain Gameplay:** Intuitive typing-based word association and chain completion.
*   **Progression System:** Candy Crush-style level progression across 120 "lands."
*   **Dynamic Scoring:** Comprehensive scoring system with speed multipliers, accuracy bonuses, and combo mechanics.
*   **Data Management Layer:** Robust Supabase integration (`DataManager`) with in-memory and local storage caching for offline support.
*   **Phaser 3 Scene-Based Architecture:** Clear separation of concerns for gameplay, UI, and transitions (19 scenes).
*   **Configurable Gameplay:** Extensive data-driven configuration (`gameConfig.json`) for gameplay parameters, scoring, and penalty systems.
*   **Responsive UI:** UI components designed for optimal experience on mobile portrait screens (390×844px).
*   **Developer Tools:** Integrated debugging and diagnostic tools for efficient development.
*   **Story Integration Framework:** 9 nations with dual spiritual attributes (Fruit of Spirit + Works of Flesh), Detective-Thriller-Myth structure with 8 beats, comprehensive national language design system.

## Technology Stack

*   **Game Engine:** Phaser 3.90.0
*   **Build Tool:** Vite 6.2.6
*   **Language:** TypeScript 5.8.3
*   **Backend:** Supabase (supabase-js 2.79.0)
*   **Styling:** Tailwind CSS 3.4.18
*   **Testing:** Vitest 3.2.4
*   **UI Extensions:** phaser3-rex-plugins 1.80.16

## How to Run/Test

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

## Next Milestones

**Immediate Priorities:**
*   **Review UI Configuration Options:** Select one of three options (Conservative Balance, Progressive Delight, Experimental Flow) for baseline implementation
*   **Create Land Distribution Matrix:** Comprehensive mapping of all 120 lands to the 9 nations, including story beat assignments, act distribution, border relationships, language modes, and difficulty progression
*   **Implement Baseline UI (Option A):** 2-3 week implementation establishing stable foundation for A/B testing
*   **Develop NPC Roster:** Leverage national-language-designer agent for linguistic flavor across 9 nations
*   **Expand Story Beats:** Elaborate 8 core story beats into 120 land-specific sub-beats

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
- `CLAUDE.md` - Project overview and AI agent guidance
- `GEMINI.md` - Multi-agent development approach
- `CLAUDE_SESSION_HISTORY.md` - Detailed session logs (v0.0.0 through v0.0.11)
- `README.md` - This file

---

*Last updated: 2026-01-15*
*Version: 0.0.11*
