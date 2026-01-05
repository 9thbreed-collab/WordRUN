# WordRun

A mobile word-association puzzle game built with Phaser 3, combining word-chain mechanics with Candy Crush-style progression.

## Overview

WordRun challenges players to complete chains of 11 associated words (e.g., Car → Door → Stop → Sign → Up → Start → Button → Nose → Ring → Bell → Tower) across 3,000 levels organized into 120 themed "lands" of 25 levels each. The game features typing-based gameplay with typo forgiveness, a lives system with penalty boxes, and multiple game modes.

## Current Development Status

**Phase**: Pre-production (Code Architecture Review)
**Version**: 0.0.0 (Prototype)

### Implemented Features
- Core word-chain typing gameplay with Levenshtein distance typo forgiveness
- Scene-based architecture with 19 Phaser scenes
- DataManager with Supabase integration for player state persistence
- Lives system (5 lives per land) with penalty box escalation [15, 60, 240, 960] minutes
- Combo system with drainage tiers for sustained scoring multipliers
- Power-ups: Hints, Skips, Surge, Freeze
- Trap system with locked rungs
- Multiple game modes: Story Mode, Hidden Letter Mode, Scrabble Mode (Multiplayer in progress)
- 3,000 levels of puzzle content across 120 themed lands

### Current Focus
- **Documentation**: Comprehensive architecture guide (CLAUDE.md) and mobile optimization playbook (DevTec.md) completed
- **Next Steps**: Code refactoring (GameplayScene.ts component extraction), asset optimization (texture atlases), mobile testing setup

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
├── wordrun-vite/           # Main game project
│   ├── src/
│   │   ├── scenes/         # Phaser scenes (19 files)
│   │   ├── services/       # Runtime services (TrapRuntime, Router, etc.)
│   │   ├── gameplay/       # Gameplay systems (Rules, WheelGesture, etc.)
│   │   ├── ui/             # UI components and layouts
│   │   ├── dev/            # Development tools (DebugHUD, LogBus)
│   │   ├── test/           # Vitest tests
│   │   ├── main.ts         # Phaser bootstrap entry point
│   │   ├── config.ts       # Global game configuration
│   │   ├── gameConfig.json # Data-driven configuration
│   │   ├── content.ts      # Puzzle/level content
│   │   └── DataManager.ts  # Supabase data layer
│   ├── public/
│   │   └── assets/         # Game assets (sprites, fonts, UI)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── CLAUDE.md               # Architecture documentation
├── DevTec.md              # Mobile optimization guide
├── GEMINI.md              # Project assessment
└── WordRunContext.txt     # Game design document
```

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

## Key Gameplay Mechanics

- **Typing Engine**: Word input with Levenshtein distance forgiveness (1 character within 2 seconds for words ≥4 chars)
- **Scoring**: Base points (100/word) × speed multiplier (1.0-2.0) × accuracy × combo
- **Lives System**: 5 lives per land; lose a life on level failure
- **Penalty Box**: Escalating wait times [15, 60, 240, 960] minutes when out of lives
- **Combo System**: Build combos by quickly completing words; combo drains over time in tiers
- **Power-ups**:
  - Hints (-25 points): Reveal next word
  - Skips (-100 points): Advance without solving
  - Surge: Temporary combo boost
  - Freeze: Pause combo drainage
- **Traps**: Locked rungs that force strategic skip decisions

## Next Milestones

### Phase 1: Code Refactoring (Weeks 1-2)
- [ ] Extract components from GameplayScene.ts (4,539 lines → component-based)
- [ ] Implement proper DOM cleanup to prevent memory leaks
- [ ] Add object pooling for word boxes and particles

### Phase 2: Asset Optimization (Weeks 3-4)
- [ ] Create texture atlases from individual PNGs
- [ ] Implement lazy loading for 120 lands (12 groups of 10)
- [ ] Set up texture compression (PVRTC/ASTC for iOS, ETC2 for Android)

### Phase 3: Mobile Testing (Weeks 5-6)
- [ ] Test on real iOS and Android devices
- [ ] Optimize virtual keyboard handling for typing gameplay
- [ ] Implement haptic feedback
- [ ] Add touch gesture shortcuts (swipe-to-skip, tap-to-hint)

### Phase 4: Visual Polish (Weeks 7-8)
- [ ] Integrate GSAP or Anime.js for UI animations
- [ ] Implement screen transitions between scenes
- [ ] Add particle effects for combos and power-ups
- [ ] Implement "juice" techniques (screen shake, scale pop, trails)

### Phase 5: Build Optimization (Weeks 9-10)
- [ ] Configure code splitting in Vite
- [ ] Optimize bundle size (target: <2MB initial load)
- [ ] Performance profiling and optimization (target: 60 FPS)
- [ ] Final device testing and bug fixes

## Documentation

- **[CLAUDE.md](CLAUDE.md)**: Comprehensive architecture guide for developers
- **[DevTec.md](DevTec.md)**: Mobile game optimization best practices
- **[GEMINI.md](GEMINI.md)**: Multi-agent development approach and project assessment
- **[WordRunContext.txt](WordRunContext.txt)**: Original game design document
- **[Session Summaries](v0.0.0-session-summary.md)**: Development session history

## Contributing

This is currently a solo project in active development. For questions or collaboration inquiries, refer to the documentation files above.

## License

Proprietary - All rights reserved

---

**Latest Session**: 2026-01-05 (Documentation & Research)
**Next Focus**: Component-based refactoring of GameplayScene.ts
