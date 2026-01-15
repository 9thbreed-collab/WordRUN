# WordRun UI Final Deliverables: Image Prompts & Implementation Guide
**Analysis Date:** 2026-01-14
**Agent:** Main Claude Orchestrator
**Inputs:** WR_UI_A_B_inventory.md (Agent 1), WR_UI_C_D1-D4_options.md (Agent 2)

---

## TASK D5 — ChatGPT Images Mockup Prompts

The following three prompts are designed to generate consistent visual mockups for each UI configuration option. Each prompt describes the same gameplay moment (mid-level, correct word typed, combo active) to make visual differences between options immediately apparent.

### Common Elements Across All Prompts
- **Device:** iPhone-style smartphone, portrait orientation (390×844 logical pixels)
- **Scene:** Mid-level gameplay, word chain visible with 6 of 11 words completed
- **Moment:** Player just typed a correct word; feedback animation in progress
- **Character:** "Ruut" - a small, friendly creature (hedgehog/fox hybrid) with expressive eyes
- **Color Palette:** Dark background (#0e0e12), gold accents for combo, green for correct
- **Typography:** Clean, rounded sans-serif (similar to Nunito or Poppins)

---

### Option A: Conservative Balance — ChatGPT Images Prompt

```
Create a mobile game UI mockup for a word puzzle game on an iPhone-style screen (portrait, 390x844 pixels). The scene shows mid-level gameplay with these exact specifications:

LAYOUT (stacked, clean hierarchy):
- TOP BAR (0-44px from top): A horizontal combo meter bar spanning full width. The bar is 70% filled with a solid gold (#FFD700) color. A "2x" multiplier text sits at the right end in white.
- CENTER (100-600px): A vertical list of 11 word "rungs" displayed as rounded rectangles. The first 6 rungs show completed words with green checkmarks. The 7th rung (currently active) shows the word "WINDOW" scaling up slightly (1.1x) with a subtle green glow. Rungs 8-11 are locked/grayed out.
- LEFT OF CENTER: A small character named "Ruut" (80x80px) - a cute hedgehog-fox creature - stands on the ladder beside rung 6, looking up at the active rung. Simple idle pose.
- BOTTOM (710-810px): A text input field with a thin border, white background, placeholder text "Type next word..."

FEEDBACK MOMENT:
- The active word "WINDOW" is mid-animation: scaled to 1.1x normal size with a soft green glow
- No particles or complex effects - just clean scale animation
- The input field below shows "window" just typed

STYLE:
- Minimalist, flat design
- Dark background (#0e0e12)
- High contrast text (white on dark)
- Clear visual hierarchy
- No overlapping elements
- Professional, calm aesthetic

Perspective: Flat, straight-on 2D view. No 3D effects or depth.
```

---

### Option B: Progressive Delight — ChatGPT Images Prompt

```
Create a mobile game UI mockup for a word puzzle game on an iPhone-style screen (portrait, 390x844 pixels). The scene shows mid-level gameplay with these exact specifications:

LAYOUT (asymmetric, character-focused):
- TOP BAR (0-50px from top): A horizontal combo meter bar spanning full width. The bar is 70% filled with a ANIMATED LIQUID/PLASMA effect - swirling gold (#FFD700) and orange (#FFA500) gradients. A large "2x" multiplier text (24px font) bounces above the bar with a "+100" score popup fading out.
- CENTER-RIGHT (100-600px): A vertical list of 11 word rungs offset to the right side (320px wide). The first 6 show completed words with green checkmarks. The 7th rung shows "WINDOW" with a PARTICLE BURST - 8 small golden circles exploding outward from the word.
- CENTER-LEFT: A larger Ruut character (100x100px) partially overlaps the word list. Ruut is in an excited "fist pump" pose - one arm raised triumphantly, eyes squeezed shut in joy, small sweat drops suggesting effort.
- BOTTOM (710-810px): Text input field with "window" typed.

FEEDBACK MOMENT:
- Word "WINDOW" is scaled to 1.4x with a "bounce back" easing effect visible
- 8 particle circles radiate outward from the word, gold/orange colored, varying sizes
- Ruut mid-celebration pose
- "+100" text floating up from the combo bar, rotating slightly, semi-transparent (fading)
- Everything feels energetic and "juicy"

STYLE:
- Polished, playful design
- Dark background (#0e0e12) with subtle vignette
- Vibrant accent colors (gold, orange, green)
- Overlapping elements create depth
- Rounded corners, soft shadows
- Delightful, responsive aesthetic

Perspective: Flat 2D but with layered depth from overlapping elements.
```

---

### Option C: Experimental Flow — ChatGPT Images Prompt

```
Create a mobile game UI mockup for a word puzzle game on an iPhone-style screen (portrait, 390x844 pixels). The scene shows mid-level gameplay with these exact specifications:

LAYOUT (central perspective, immersive):
- NO TOP BAR - combo is shown as a GLOWING AURA around the character
- CENTER (entire screen focus): A word chain displayed as a 3D LADDER receding into the screen. Words closer to the bottom are larger; words toward the top are smaller (perspective scaling). The ladder ascends into a soft, atmospheric glow at the top.
  - Rung positions: Bottom rungs at 100% scale, each subsequent rung 10% smaller and 40px higher
  - First 6 rungs show completed words, increasingly small as they go up
  - 7th rung (active): "WINDOW" materializing with a SCANLINE EFFECT (horizontal lines revealing the word from bottom to top)
  - Rungs 8-11 are ghostly/faded outlines higher up the perspective ladder
- CENTER: Ruut (dynamically sized based on position) climbs the ladder. Currently shown mid-leap between rung 6 and 7, with arc trajectory, scale transitioning from 90px to 80px as it moves "into" the screen.
- RUUT'S AURA: A golden glow (60px radius) surrounds Ruut, representing combo level - brighter = higher combo
- BACKGROUND: Forest theme - subtle parallax trees on left/right edges, firefly particles (5-10 glowing dots) floating in the background. Colors suggest early twilight.
- BOTTOM (810-844px): A minimal glowing input line (4px height, cyan glow). The typed word "window" floats above it.
- CORNERS: Tiny hint icon (top-right, 30x30px), power-up icon (top-left, 30x30px) - nearly invisible, auto-hidden aesthetic.

FEEDBACK MOMENT:
- A PULSE OF LIGHT travels up the ladder from the input line to the active word (white circle, expanding and fading)
- "WINDOW" is mid-materialization with scanline reveal effect
- Ruut mid-jump between rungs with motion blur
- Background fireflies drift gently
- Overall feeling: cinematic, immersive, like watching a movie scene

STYLE:
- Cinematic, atmospheric design
- Dark background with environmental depth (forest theme)
- Minimal HUD - UI integrated into world
- Perspective/depth gives 3D feel without being 3D
- Ethereal, flowing aesthetic
- Environmental storytelling through visual effects

Perspective: Pseudo-3D with perspective scaling. Camera feels like it's looking slightly upward at the ladder ascending into the distance.
```

---

## TASK E — Implementation Reference Materials

### E.1: Complete Already-Listed Registry

This is the authoritative inventory from Agent 1's analysis, representing all identified frameworks, systems, and components in WordRunProject.

| ID | Component/System | Category | Location |
|----|-----------------|----------|----------|
| AL-001 | Phaser 3 Rendering Engine | Core Engine | package.json (v3.90.0) |
| AL-002 | Phaser 3 DOM & rex-plugins | UI Framework | package.json (phaser3-rex-plugins v1.80.16) |
| AL-003 | Phaser 3 Animations | Animation System | Core to Phaser |
| AL-004 | Phaser 3 Input | Input System | Core to Phaser |
| AL-005 | DataManager Singleton | State Management | src_archive_2026-01-06/DataManager.ts |
| AL-006 | Phaser 3 Audio | Audio System | Core to Phaser |
| AL-007 | Phaser 3 Loader | Asset Management | Core to Phaser |
| AL-008 | Phaser 3 Scene Manager | Scene Routing | Core to Phaser |
| AL-009 | Tailwind CSS | Styling | package.json (v3.4.18) |
| AL-010 | ComboBar | UI Component | src_archive_2026-01-06/ui/ComboBar.ts |
| AL-011 | RuutCharacter | UI Component | src_archive_2026-01-06/ui/RuutCharacter.ts |
| AL-012 | PowerUpInventory | Gameplay System | src_archive_2026-01-06/gameplay/PowerUpInventory.ts |
| AL-013 | HintSystem | Gameplay System | src_archive_2026-01-06/gameplay/HintSystem.ts |
| AL-014 | TypingEngine | Gameplay System | src_archive_2026-01-06/TypingEngine.ts |
| AL-015 | ScoreManager | Gameplay System | src_archive_2026-01-06/ScoreManager.ts |
| AL-016 | TrapSystem | Gameplay System | src_archive_2026-01-06/TrapSystem.ts |
| AL-017 | LevelManager | Gameplay System | src_archive_2026-01-06/LevelManager.ts |
| AL-018 | GameModeManager | Gameplay System | src_archive_2026-01-06/GameModes.ts |
| AL-019 | GameDataManager | Data Layer | src_archive_2026-01-06/GameDataManager.ts |
| AL-020 | AdManager | Monetization | src_archive_2026-01-06/AdManager.ts |
| AL-021 | ProfileStore | State Management | src_archive_2026-01-06/ProfileStore.ts |
| AL-022 | Router Service | Navigation | src_archive_2026-01-06/services/ |

**New Components Proposed (Not Yet Implemented):**

| ID | Component | Option | Purpose | Location |
|----|-----------|--------|---------|----------|
| AL-023 | JuiceManager | B | Particle effects, screen shake, animation sequences | src/ui/JuiceManager.ts |
| AL-024 | VisualEffectsManager | C | Environmental effects, combo aura, shader pipeline | src/ui/VisualEffectsManager.ts |
| AL-025 | PerspectiveCamera | C | Pseudo-3D scaling/positioning for word chain | src/ui/PerspectiveCamera.ts |

---

### E.2: What to Test First — Checklist

Before implementing any UI configuration option, validate these foundational elements:

- [ ] **1. Typing Responsiveness (<100ms):** Measure time from keystroke to visual acknowledgment in the input field. This is the core interaction; any lag is unacceptable.

- [ ] **2. ComboBar Drain Behavior (AL-010):** Verify the 3-tier drain system works correctly: drainT1 (3s), drainT2 (5s), drainT3 (7s). Confirm tier transitions and persistence between levels via `window.__comboValue__`.

- [ ] **3. RuutCharacter Animation States (AL-011):** Confirm all base states (idle, happy, sad, thinking) play correctly and transition smoothly. This is the foundation for Options B and C enhancements.

- [ ] **4. Flash Message System:** Test `flashConfirm()` method in GameplayScene.ts with various messages ("CORRECT", "WRONG", "STREAK RECOVERED"). Verify visibility, timing (300-500ms), and color changes.

- [ ] **5. Word Chain DOM Rendering:** Verify all 11 rungs render correctly, update on correct word submission, and support visual states (locked, active, complete).

- [ ] **6. Frame Rate Baseline:** Establish current FPS performance on target devices (iPhone 11, Samsung Galaxy A52) BEFORE adding any new effects. This becomes the control measurement.

- [ ] **7. Audio Pipeline (AL-006):** Confirm Phaser Audio loads and plays sounds. If audio assets are missing, create placeholder beeps to validate the pipeline before final assets arrive.

---

### E.3: Top 5 Most Likely Change Points

These are the files/systems most likely to require modification for any UI configuration option:

#### 1. GameplayScene.ts
**Path:** `wordrun-vite/src_archive_2026-01-06/scenes/GameplayScene.ts`
**Size:** 151,835 bytes (4,246 lines)
**Why:** This is the monolithic gameplay scene containing all UI orchestration, DOM rendering, animation triggers, and game loop logic. Every feedback effect ultimately routes through this file.
**Change Type:** Add animation orchestration, integrate with JuiceManager (Option B) or VisualEffectsManager (Option C), modify layout positioning.

#### 2. ComboBar.ts (AL-010)
**Path:** `wordrun-vite/src_archive_2026-01-06/ui/ComboBar.ts`
**Size:** 143 lines
**Why:** The combo system is central to all three options. Option A modifies animations, Option B adds shader effects, Option C replaces it with an aura system.
**Change Type:** Animation enhancements (A), shader/particle integration (B), deprecation and replacement (C).

#### 3. RuutCharacter.ts (AL-011)
**Path:** `wordrun-vite/src_archive_2026-01-06/ui/RuutCharacter.ts`
**Size:** ~50 lines
**Why:** Ruut's expressiveness increases dramatically from Option A to C. This file will grow significantly with new animation states and event-driven behaviors.
**Change Type:** Add animation states (fist_pump, celebrate_major, stumble), integrate dynamic scaling (Option C), add aura effect attachment point.

#### 4. config.ts
**Path:** `wordrun-vite/src_archive_2026-01-06/config.ts`
**Why:** All options require new configuration parameters for animations, particle systems, haptic patterns, and layout modes. This is the central configuration hub.
**Change Type:** Add `GAME_CONFIG.ui.option`, animation timing configs, particle budgets, perspective settings.

#### 5. gameConfig.json
**Path:** `wordrun-vite/src_archive_2026-01-06/gameConfig.json`
**Why:** Data-driven configuration for gameplay parameters. Options B and C require extensive JSON configuration for particles, shaders, and environmental effects.
**Change Type:** Add particle configs, animation curve definitions, environmental effect parameters per land theme.

---

### E.4: Implementation Decision Matrix

| Decision Point | Option A | Option B | Option C |
|----------------|----------|----------|----------|
| **New Files Required** | 0 | 1 (JuiceManager) | 3 (JuiceManager, VisualEffectsManager, PerspectiveCamera) |
| **Estimated Dev Time** | 2-3 weeks | 3-4 weeks | 6-8 weeks |
| **Performance Risk** | Low | Medium | High |
| **Art Asset Requirements** | Minimal | Moderate (Ruut animations) | High (per-land effects) |
| **WebGL Expertise Needed** | No | Minimal | Yes (custom shaders) |
| **Recommended Test Device** | Any | Mid-range+ | High-end only initially |
| **A/B Test Confidence** | High (stable baseline) | Medium | Low (confounding variables) |

---

### E.5: Quick Reference — File Paths

```
WordRunProject/
├── wordrun-vite/
│   ├── src_archive_2026-01-06/
│   │   ├── scenes/
│   │   │   ├── GameplayScene.ts      # 4,246 lines - main gameplay
│   │   │   ├── WorldMapScene.ts      # 1,200+ lines - world navigation
│   │   │   ├── TitleScreen.ts        # Main menu
│   │   │   ├── LevelCompleteUIScene.ts
│   │   │   └── [14 more scenes...]
│   │   ├── ui/
│   │   │   ├── ComboBar.ts           # AL-010 - combo meter
│   │   │   ├── RuutCharacter.ts      # AL-011 - character controller
│   │   │   ├── Layout.ts             # Responsive utilities
│   │   │   └── NameOverlay.ts        # Player name input
│   │   ├── gameplay/
│   │   │   ├── PowerUpInventory.ts   # AL-012
│   │   │   ├── HintSystem.ts         # AL-013
│   │   │   └── WheelGesture.ts       # Touch gestures
│   │   ├── DataManager.ts            # AL-005 - Supabase integration
│   │   ├── GameDataManager.ts        # AL-019 - gameplay APIs
│   │   ├── TypingEngine.ts           # AL-014 - input processing
│   │   ├── ScoreManager.ts           # AL-015 - scoring logic
│   │   ├── GameModes.ts              # AL-018 - mode management
│   │   ├── TrapSystem.ts             # AL-016 - penalty box
│   │   ├── LevelManager.ts           # AL-017 - progression
│   │   ├── config.ts                 # GAME_CONFIG object
│   │   ├── gameConfig.json           # Data-driven config
│   │   └── main.ts                   # Entry point
│   └── package.json                  # Dependencies
├── GameplayInspo/                    # 19 reference screenshots
├── WR_UI_A_B_inventory.md            # Agent 1 output
├── WR_UI_C_D1-D4_options.md          # Agent 2 output
└── WR_UI_FINAL_D5_E.md               # This file
```

---

**End of Final Deliverables**
**Pipeline Complete**
**Generated by:** Main Claude Orchestrator
**Timestamp:** 2026-01-14
