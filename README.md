# WordRun

A mobile word-association puzzle game combining typing-based word-chain mechanics with competitive leaderboards and Candy Crush-style progression.

## Overview

WordRun challenges players to complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into 120 themed "lands" of 25 levels each. Players compete on global leaderboards while typing through word associations at speed, with story elements infused directly into gameplay progression.

## Current Development Status

**Phase**: Pre-Production - Research & Strategy (Phase 2)
**Version**: 0.0.04 (Emotional Design Research)
**Status**: Market research complete; Emotional design framework established; story/lore integration next priority

### Strategic Pivot (v0.0.02 - 2026-01-07)

The project has undergone a strategic reboot, shifting from technical-first development to a research-informed design approach. Development philosophy changed from "make it work" to "make it great" through four strategic pillars:

**The Four Pillars of Redevelopment**:
1. **Market Research & Positioning** ✓ (Complete) - Validated "Competitive Word-Chain Puzzle" positioning in $10bn+ puzzle market
2. **Story & Lore Integration** (Next Priority) - Deep narrative framework infused into gameplay
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

**Emotional Design Foundation** (v0.0.04):
- 58,000-word research report synthesizing Don Norman and Tim Gabe principles
- Top 10 prioritized actions for emotional engagement
- Norman's three levels (visceral, behavioral, reflective) applied to WordRun
- Success metrics: D1 >40%, D7 >20%, D30 >10%, 60fps >95%

**Next Session Priorities**:
1. Character development (Ruut personality: determined, expressive, encouraging; 3-4 celebration animations)
2. World-building (120 lands with emotional color palettes; 12 seasonal groups)
3. Narrative arc (light → medium → rich story density tiers)
4. Delivery methods (3-5 sec NPC dialogues skippable; 30-60 sec cutscenes replayable)

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
├── v0.0.0-session-summary.md  # Documentation session (2026-01-05)
├── v0.0.01-session-summary.md # Component extraction session (2026-01-05)
├── v0.0.02-session-summary.md # Strategic reboot session (2026-01-07)
├── v0.0.03-session-summary.md # AI tooling optimization session (2026-01-08)
└── v0.0.04-session-summary.md # Emotional design research session (2026-01-09)
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

**Latest Session**: 2026-01-09 (Emotional Design Research - Psychology of Player Engagement)
**Current Focus**: Story & Lore Integration (Pillar 2) - Character development informed by reflective design principles
**Philosophy**: Research market → Design for excellence → Build with quality → Launch strategically
**Emotional Core**: Accomplishment + Curiosity + Calm Confidence + Delight
**Framework**: Norman's Three Levels (Visceral, Behavioral, Reflective) + Top 10 Prioritized Actions
