# WordRun

A mobile word-association puzzle game combining typing-based word-chain mechanics with competitive leaderboards and Candy Crush-style progression.

## Overview

WordRun challenges players to complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into 120 themed "lands" of 25 levels each. Players compete on global leaderboards while typing through word associations at speed, with story elements infused directly into gameplay progression.

## Current Development Status

**Phase**: Pre-Production - Research & Strategy (Phase 2)
**Version**: 0.0.07 (Story Route Refinement & Agent Creation)
**Status**: Story framework complete; National languages designed; 9-nation travel routes finalized; Land Distribution Matrix next session

### Strategic Pivot (v0.0.02 - 2026-01-07)

The project has undergone a strategic reboot, shifting from technical-first development to a research-informed design approach. Development philosophy changed from "make it work" to "make it great" through four strategic pillars:

**The Four Pillars of Redevelopment**:
1. **Market Research & Positioning** ✓ (Complete) - Validated "Competitive Word-Chain Puzzle" positioning in $10bn+ puzzle market
2. **Story & Lore Integration** (90% Complete) - 9-nation world with Detective-Thriller-Myth structure; National languages designed; Land Distribution Matrix next session
3. **Monetization Strategy** (75% Complete) - Hybrid IAP + ads model researched; ethical framing established; IAP catalog pending
4. **Design Excellence** (50% Complete) - Emotional design framework established (Norman's three levels); visual design pending

### Market Research Key Findings

- **Market Opportunity**: Typing-based word-chain games represent underserved blue ocean niche within $10bn+ puzzle market
- **Competitive Positioning**: "Competitive Word-Chain Puzzle" differentiates from passive word search (Wordscapes) and turn-based multiplayer (Words With Friends)
- **Monetization Model**: Hybrid IAP + rewarded video ads shows 37% revenue advantage over single-model games
- **Retention Drivers**: Leaderboards proven to lift D30 retention by 26%; critical success factor
- **CPI Benchmarks**: iOS $3-4.50, Android $1.10-2 (18% YoY increase emphasizes need for organic growth)
- **Live-Ops Required**: 84% of mobile IAP revenue from live-ops games; seasonal events drive 25% revenue spikes

### Core Features (Implemented)

- Core word-chain typing gameplay with Levenshtein distance typo forgiveness (1 character within 2 seconds)
- Scene-based architecture with Phaser 3 game engine
- Supabase backend integration for player state persistence
- Lives system (5 per land) with penalty box escalation [15, 60, 240, 960] minutes
- Combo system with drainage tiers for sustained scoring multipliers
- Power-ups: Hints, Skips, Surge, Freeze
- Trap system with locked rungs
- Multiple game modes: Story Mode, Hidden Letter Mode, Scrabble Mode
- 3,000 levels of puzzle content across 120 themed lands

### Current Focus: Story & Lore Integration (Pillar 2)

**Story Framework Complete** (v0.0.05 - v0.0.07):
- 9-nation world with dual spiritual attributes (Fruit of Spirit + Works of Flesh)
- Detective-Thriller-Myth genre integration (Se7en, True Detective inspired)
- Universal language discovery narrative with 8 story beats
- Two-act structure: Package delivery mystery → Fugitive spreading truth
- Political dynamics: Normal state (8 enemies, 5 allies, 23 neutral) → Aggressive state (17 enemies, 11 tense, 8 neutral)
- Protagonist's comprehensive journeys through all 9 nations:
  - First Half: "The Convoluted Delivery" - Mystery-driven 10-stop tour (Corinthia → ... → Tobin)
  - Second Half: "The Gauntlet of Restoration" - Purposeful 8-stop crusade (Tobin → ... → Corinthia)
- National language design system complete (9 languages, mode-based variations, word pools)
- Cultural language designer agent created for ongoing linguistic content work
- 65-page multi-agent MVP development plan (5-hour timeline with 5 specialized AI agents)

**Next Session Priority**:
1. **Create Land Distribution Matrix** - Map all 120 lands to nations, acts, border types, story beats, language modes
2. Design NPC roster with regional linguistic flavor using national-language-designer agent
3. Expand 8 core story beats into 120 land-specific sub-beats
4. Develop first 5 lands full content with linguistic flavor
5. Execute 5-hour multi-agent MVP sprint (5 fully polished levels from Land 1)

## Technology Stack

- **Game Engine**: Phaser 3.90.0
- **Build Tool**: Vite 6.2.6
- **Language**: TypeScript 5.8.3
- **Backend**: Supabase (supabase-js 2.79.0)
- **Styling**: Tailwind CSS
- **Testing**: Vitest 3.2.4
- **UI Extensions**: phaser3-rex-plugins

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
cd wordrun-vite
npm install
```

### Development Commands

```bash
# Start development server (port 5175)
npm run dev

# Build for production (ES2020 target)
npm run build

# Preview production build (port 4175)
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Development Server
Open http://localhost:5175 in your browser after running `npm run dev`.

### Testing on Mobile Devices

1. Find your local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Start dev server and access from mobile device:
   ```
   http://[YOUR_IP]:5175
   ```

## Project Structure

```
WordRunProject/
├── wordrun-vite/              # Main game project
│   ├── src/
│   │   ├── src_archive_2026-01-06/  # Archived components pending design system
│   │   ├── main.ts            # Phaser bootstrap entry point
│   │   ├── config.ts          # Global game configuration
│   │   └── JuiceScene.ts      # Experimental scene
│   ├── public/
│   │   └── assets/            # Game assets (sprites, fonts, UI)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── CLAUDE.md                  # Architecture & strategic guidance
├── AGENTS.md                  # Multi-agent coordination (synced with CLAUDE.md)
├── GEMINI.md                  # Multi-agent coordination (synced with CLAUDE.md)
├── DevTec.md                  # Mobile optimization technical roadmap
├── WordRunContext.txt         # Original game design document
├── Market-Research-Brief-2026.md  # Comprehensive market analysis (73,000 words)
├── emotional-design-research-report.md  # Emotional design principles (58,000 words)
├── WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md  # Prioritized implementation guide
├── EMOTIONAL_DESIGN_CHECKLIST.md  # High-schooler friendly audit tool
├── WORDRUN-AI-DEVELOPMENT-PLAN.md  # 65-page multi-agent MVP strategy (5-hour timeline)
├── Lore&StoryDraft1.md  # Core narrative with 9 nations and universal language
├── AlignedStorySynopsisBeats_v2.md  # Detective-Thriller-Myth story structure
├── WorldState_And_TravelRoutes.md  # Political dynamics and 9-nation journey routes (v0.0.07 - expanded)
├── NationalLanguageDesignSystem.md  # Fictional language specifications for all 9 nations (v0.0.06)
├── NationalWordPools.md  # Vocabulary pools organized by nation and mode (v0.0.06)
├── genre_analysis_detective_thriller_myth.md  # Genre construction guide
├── IdleAnimationPrompts.md  # Character animation specifications
├── .claude/agents/national-language-designer.md  # Cultural language designer agent (v0.0.07)
├── v0.0.0-session-summary.md  # Documentation session (2026-01-05)
├── v0.0.01-session-summary.md # Component extraction session (2026-01-05)
├── v0.0.02-session-summary.md # Strategic reboot session (2026-01-07)
├── v0.0.03-session-summary.md # AI tooling optimization session (2026-01-08)
├── v0.0.04-session-summary.md # Emotional design research session (2026-01-09)
├── v0.0.05-session-summary.md # Story & lore integration session (2026-01-12)
├── v0.0.06-session-summary.md # National language design session (2026-01-12)
└── v0.0.07-session-summary.md # Story route refinement & agent creation (2026-01-13)
```

## Key Gameplay Mechanics

- **Typing Engine**: Word input with Levenshtein distance forgiveness (1 character within 2 seconds for words ≥4 chars)
- **Scoring**: Base points (100/word) × speed multiplier (1.0-2.0) × accuracy × combo
- **Lives System**: 5 lives per land; lose a life on level failure
- **Penalty Box**: Escalating wait times [15, 60, 240, 960] minutes when out of lives
- **Combo System**: Build combos by quickly completing words; combo drains over time in tiers
- **Leaderboards**: Global and land-specific weekly leaderboards (26% retention lift proven by research)
- **Power-ups**:
  - Hints (-25 points): Reveal next word
  - Skips (-100 points): Advance without solving
  - Surge: Temporary combo boost
  - Freeze: Pause combo drainage
- **Traps**: Locked rungs that force strategic skip decisions

## Strategic Roadmap

### Phase 1: Research & Strategy (Phase 2 - IN PROGRESS)
- [x] Market research complete (competitive landscape, monetization benchmarks, retention drivers)
- [x] Competitive positioning validated ("Competitive Word-Chain Puzzle" blue ocean)
- [x] AI tooling optimization (Playwright MCP integration validated)
- [x] Emotional design research (Norman's three levels, Tim Gabe insights, Top 10 actions)
- [ ] Story & lore integration framework (character development, world-building, narrative arc)
- [ ] Monetization design finalized (IAP catalog, ad placement strategy, live-ops calendar)
- [ ] Design system created (visual benchmarking, component library, typing UX research)

### Phase 2: Design & Content (Phase 3 - UPCOMING)
- [ ] Visual design aligned with market research (Candy Crush/Wordscapes quality benchmarks)
- [ ] Story integration into gameplay (NPC dialogue, themed lands, narrative progression)
- [ ] Monetization implementation (IAP store, rewarded video ads, battle pass system)
- [ ] Content strategy refinement (12 seasonal land groups, 4-week event cycles)

### Phase 3: Production (Phase 4 - PAUSED)
- [ ] Component-based refactoring (resume after design system complete)
- [ ] Asset optimization (texture atlases, lazy loading for 120 lands)
- [ ] Mobile device testing (typing UX validation, performance profiling)
- [ ] Visual polish (animations, transitions, particle effects)

### Phase 4: Soft Launch (Tier-2 Markets)
- [ ] Soft launch in Canada & Australia (4-6 week validation window)
- [ ] Success criteria: D7 >18%, ARPDAU >$0.10, CPI <$4 iOS / <$2 Android
- [ ] A/B testing (penalty box monetization, IAP timing, ad frequency)

### Phase 5: Global Launch
- [ ] Design system finalized based on soft launch learnings
- [ ] Live-ops infrastructure scaled (seasonal events, weekly leaderboards, daily quests)
- [ ] Influencer marketing campaign (nano/micro creators, TikTok/YouTube seeding)
- [ ] ASO optimization (App Store featured placement targeting)

## Target Metrics (Research-Validated)

### Retention Targets
- **D1**: 35-40% (vs 26-28% benchmark) - Strong FTUE + typo forgiveness
- **D7**: 18-22% (vs 6.7% benchmark) - Leaderboard engagement (26% lift)
- **D30**: 8-10% (vs 6.6% benchmark) - Seasonal events + social competition
- **Session Length**: 15-18 min (3-5 chains per session)
- **Sessions/Day**: 3-4 (lives system drives return windows)

### Monetization Targets
- **ARPDAU**: $0.10-$0.15 (soft launch), $0.15-$0.20 (global launch)
- **IAP Conversion**: 3-5% by D14 (soft launch), 5-7% by D14 (global launch)
- **Battle Pass Attach**: 5-8% (66% of top-20% games use battle pass)
- **Whale LTV**: $50+ by D90 (22% of payers spend $100+ benchmark)

### Technical Targets
- **Performance**: 60 FPS on mid-range devices (iPhone 11, Galaxy A52)
- **Bundle Size**: <2MB initial load (optimal user acquisition)
- **RAM Usage**: <150MB through object pooling
- **CPI**: <$3.50 iOS, <$1.50 Android (organic ASO emphasis)

## Configuration

### Development Mode

The game includes development-only features controlled by flags in `src/config.ts`:

```typescript
GAME_CONFIG.dev.enabled = true  // SET TO FALSE BEFORE PRODUCTION
```

When enabled, dev mode provides:
- Test scenes (TestLevel, AdminConsole, DiagnosticsScene)
- Debug overlays and logging
- Test buttons on title screen
- Penalty box bypass option
- Sample data pre-filling

**CRITICAL**: Set `dev.enabled = false` before App Store/Google Play submission.

### Supabase Backend

Configure Supabase credentials in environment variables or `src/supabase.ts`:
- Supabase URL
- Supabase Anon Key

The DataManager handles all backend communication with caching and offline support.

## Documentation

- **[CLAUDE.md](CLAUDE.md)**: Comprehensive architecture guide and strategic framework
- **[Market-Research-Brief-2026.md](Market-Research-Brief-2026.md)**: Evidence-based market analysis (60+ sources, 73,000 words)
- **[DevTec.md](DevTec.md)**: Mobile game optimization best practices and technical roadmap
- **[GEMINI.md](GEMINI.md)**: Multi-agent development approach and project assessment
- **[WordRunContext.txt](WordRunContext.txt)**: Original game design document
- **[Session Summaries](v0.0.02-session-summary.md)**: Development session history (v0.0.0, v0.0.01, v0.0.02)

## Contributing

This is currently a solo project in active development. For questions or collaboration inquiries, refer to the documentation files above.

## License

Proprietary - All rights reserved

---

**Latest Session**: 2026-01-13 (Story Route Refinement & Agent Creation)
**Current Focus**: Land Distribution Matrix (Next Session) - Map 120 lands to 9 nations with story beat assignments
**Philosophy**: Story informs design → Design + Functionality parallel → Personalization + Game juice polish
**Narrative Structure**: Detective-Thriller-Myth with 9 nations, universal language, comprehensive 9-nation tours (both acts)
**Development Approach**: Multi-agent AI coordination (5 specialized agents, 5-hour MVP sprint)
**Story Progress**: 9 languages designed, travel routes finalized, national-language-designer agent created
**Next Milestone**: Land Distribution Matrix → First 5 lands full content → 5 fully polished levels establishing quality baseline
