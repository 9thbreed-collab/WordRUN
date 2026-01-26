# GameplayScene Logic Reference

**Source:** `wordrun-vite/src_archive_2026-01-06/scenes/GameplayScene.ts` (~4,500 lines)
**Created by:** W4 (Scenes & Logic Lead)
**Date:** 2026-01-20

---

## Overview

The original GameplayScene is a complex, production-ready implementation. This document catalogs the key logic patterns that should inform the rebuild.

---

## 1. Core State Types

### SlotState (Row/Word State)
```typescript
type SlotState = {
  word: string;        // The answer word (lowercase)
  len: number;         // Word length
  cur: number;         // Current cursor position (0 = first letter)
  cells: HTMLSpanElement[];  // DOM cell elements
  rowEl: HTMLDivElement;     // The row container
  boxEl: HTMLDivElement;     // The word box container
};
```

### Input Mode
```typescript
type InputMode = 'keyboard' | 'wheel';
```

### Round Parameters
```typescript
type RoundParams = { land: number; level: number };
```

---

## 2. Combo System

### Thresholds
```typescript
const COMBO_MIN = 0.01;
const COMBO_MAX = 1.0;
const T1 = 0.40;  // 40% - Tier 1 threshold
const T2 = 0.65;  // 65% - Tier 2 threshold
const T3 = 0.80;  // 80% - Tier 3 threshold
```

### Drain Rates (per missed word)
```typescript
const DRAIN_T1 = 3;   // Drain when in tier 1
const DRAIN_T2 = 5;   // Drain when in tier 2
const DRAIN_T3 = 7;   // Drain when in tier 3
```

### Boost Values (points per word)
```typescript
const BASE_POINTS_PER_WORD = 15;
const BOOST_T1 = 5;   // +5 in tier 1
const BOOST_T2 = 10;  // +10 in tier 2
const BOOST_T3 = 20;  // +20 in tier 3
```

### UI Component
- `ComboBar` class (imported from `src/ui/ComboBar`)
- Visual: Gradient bar with threshold markers at 40%, 65%, 80%

---

## 3. Hearts/Lives System

### Concept: Half-Lives
- Each heart = 2 half-lives
- Taking damage = losing 1 half-life
- Visual: full heart, half heart, empty heart SVGs

### State Variables
```typescript
private heartSlots = 4;      // Max hearts (visual slots)
private lockedSlots = 0;     // Hearts that are locked out
private halfLives = 8;       // Current half-lives (4 hearts * 2)
```

### Key Methods
- `loseHalfLife()` - Decrements halfLives, triggers modal at 0
- `syncHeartsFromHalfLives()` - Persists to DataManager
- `renderHearts()` - Rebuilds heart SVG display
- `openLivesModal()` / `closeLivesModal()` - Out-of-hearts overlay

### Persistence
- Hearts synced to `DataManager.updatePlayerState({ hearts, max_hearts })`
- Loaded in `init()` from `DataManager.getCachedPlayerState()`

---

## 4. Star Rating System

### Time-Based Thresholds
```typescript
private starThreeMs = 90_000;   // <= 1:30 = 3 stars
private starTwoMs   = 180_000;  // <= 3:00 = 2 stars
private starOneMs   = 290_000;  // <= 4:50 = 1 star
```

### Per-Level Overrides
Levels can specify custom thresholds:
```typescript
const starTimes = (this.spec as any).starTimes;
if (starTimes) {
  this.starThreeMs = starTimes.threeMs;
  this.starTwoMs   = starTimes.twoMs;
  this.starOneMs   = starTimes.oneMs;
}
```

### UI Components
- `starMeterEl` - Container div
- `starMeterFillEl` - Progress bar that shrinks over time
- `starSlotsEls[]` - 3 star icons (dim when lost)
- `updateStarMeter(elapsedMs)` - Updates visual state

---

## 5. Trap System

### Purpose
Lock certain word rows until player uses a Lock Key powerup.

### State
```typescript
private lockKeyCount = 0;
private releasedLocks = new Set<number>();
```

### Key Methods
```typescript
isSlotLocked(index: number): boolean
findNextUnlockedSlot(startIndex: number): number
refreshLockedFromTraps(): void
flashUnlockIcon(rowIndex: number): void
```

### Integration
- `initTrapRuntime(answers, level)` from `services/TrapRuntime`
- `getTrapStateSafe()` returns `{ lockedIndices: Set<number> }`
- Locked rows get CSS class `trap-locked`

---

## 6. Hint System

### Configuration
```typescript
static readonly HINT_COOLDOWN_MS  = 15 * 60 * 1000;  // 15 minutes
static readonly LIVES_COOLDOWN_MS = 60 * 60 * 1000;  // 1 hour
```

### HintSystem Class (imported)
- `hintButton`, `hintBadge`, `hintText` - UI elements
- `modalOverlay`, `modalCloseButton`, `modalNoThanksButton`, `modalPlayButton`
- `cooldownText`, `cooldownMs`, `initialHintCount`
- Callbacks: `onRequestHint`, `onAfterUse`, `onWatchAd`

### Hint Dictionary (hardcoded)
```typescript
const HINTS: Record<string, string> = {
  door:'entry', stop:'halt', sign:'marker', up:'direction', ...
};
```

---

## 7. PowerUp Inventory

### PowerUpInventory Class (imported)
- `powerBarEl`, `overlayEl`, `useButton`, `skipButton`
- Callbacks: `onSlotClick`, `onConfirmUse`, `onSkipUse`
- Method: `setLockKeyCount(count)`

### Level Configuration
```typescript
const trapsEnabled = this.spec.trapsEnabled ?? false;
const isTutorialLevel = this.spec.isTutorialLevel ?? false;
const startingLockKeys = this.spec.startingLockKeys ?? 0;
const usesInventoryKeys = this.spec.usesInventoryKeys ?? !isTutorialLevel;
```

---

## 8. Layout System

### Layout Constants
```typescript
const WORDBOX_MAX_W_PX = 520;
const WORDBOX_MIN_W_PX = 320;
const GAMEPLAY_LIFT_PX = 1000;

const WORDBOX_PAD_L = -30;
const WORDBOX_PAD_R = 16;
const WORDBOX_PAD_T = 0;
const WORDBOX_PAD_B = -30;

const RUUT_SCALE = 0.57;
const RUUT_OFFSET_X = 4;
const RUUT_OFFSET_Y = 530;
const RUUT_RESERVED_W = 54;
const BANNER_SAFE_PX = 35;
```

### Safe Area Helper
```typescript
function getSafeRect(screenW: number, screenH: number, padPct = 0.05) {
  // Returns { x, y, w, h, cx, cy, top, right, bottom, left }
}
```

### Key Methods
- `applyLayoutTuning()` - Applies CSS variables
- `layoutDomIntoSafe(safe)` - Positions DOM elements
- `applyLayoutPhaser(safe)` - Positions Phaser objects

---

## 9. Input Handling

### Keyboard Input
- Virtual keyboard: 3 rows (KEY_ROWS array)
- Native keyboard via `window.addEventListener('keydown', ...)`
- `handleVirtualKey(label, loseHalfLife)` - Processes key press
- `handleNativeKey(event, loseHalfLife)` - Processes native key

### Wheel Input
- Circular letter selector
- `wheelNodes[]`, `wheelPath[]`, `wheelSvg`, `wheelPolyline`
- Pointer tracking: `ptrX`, `ptrY`, `ptrEdgeX`, `ptrEdgeY`
- Gesture detection for letter selection

### Focus Management
- Hidden input `#trap` for keyboard capture
- `focusTrap.focus({ preventScroll: true })`
- `focusTrap.setAttribute('inputmode', 'none')`

---

## 10. Level Flow

### Initialization
1. `init(data: RoundParams)` - Sync setup, load spec, reset state
2. `initializeAsync(data)` - Async feature flags, wheel mode
3. `create()` - Build DOM, wire events, render initial state

### Pre-Level Panel
- `showPreLevelPanel()` - Display goal, stars available
- `preLevelOverlayEl`, `preLevelTextEl`, `preLevelStartBtnEl`

### During Play
- `levelStartMs` - Timestamp when clock starts
- `clockTick` - Interval for updating display
- `pausedAccumMs`, `pauseStartedAt` - Pause handling

### Level Complete
- `levelCompleted` flag prevents double-trigger
- `showLevelRecap()` - Display results overlay
- `recapOverlayEl`, `recapSummaryEl`, `recapStarsEl`
- `returnToMapAfterRecap()` - Scene transition

### Failure States
- `noMovesHandled` flag prevents double-trigger
- `triggerNoMovesFail()` - When no valid moves remain
- `loseLifeAndReturnToMap()` - Decrements global lives

---

## 11. Scene Communication

### Data Persistence (window globals)
```typescript
(window as any).__comboValue__     // Combo carries across levels
(window as any).__isNight__        // Theme preference
(window as any).__inputMode__      // keyboard | wheel
```

### DataManager Integration
- `DataManager.getInstance()` - Singleton
- `getCachedPlayerState()` - Sync read from cache
- `getPlayerState()` - Async read
- `updatePlayerState({...})` - Write back

### Scene Transitions
```typescript
this.scene.start('WorldMapScene', { land, level });
this.scene.start('TitleScreen');
this.scene.launch('AdminConsole');  // Parallel scene
```

### Camera Effects
```typescript
this.cameras.main.fadeIn(150, 0, 0, 0);
this.cameras.main.fadeOut(200, 0, 0, 0);
this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, callback);
```

---

## 12. Modular Components

| Component | Import Path | Purpose |
|-----------|-------------|---------|
| ComboBar | `ui/ComboBar` | Visual combo meter |
| HintSystem | `gameplay/HintSystem` | Hint button + modal |
| PowerUpInventory | `gameplay/PowerUpInventory` | Lock key inventory |
| RuutCharacter | `ui/RuutCharacter` | Companion character |

---

## 13. Key Rebuild Considerations

### MUST Preserve
1. Slot/row state model (SlotState type)
2. Half-lives heart system
3. Star rating time thresholds
4. Combo tier mechanics
5. Focus trap for keyboard input
6. Level completion flags (prevent double-trigger)

### CAN Simplify
1. Layout constants (use modern CSS)
2. Wheel input (start with keyboard only)
3. Theme toggle (defer to later)
4. Admin console integration

### BUILD FRESH (don't import)
- All DOM construction
- Event wiring
- Visual rendering
- Per the CDD pivot: define component contracts first

---

## 14. Critical Flags

```typescript
private levelCompleted = false;   // Prevent double completion
private noMovesHandled = false;   // Prevent double fail trigger
private livesModalOpen = false;   // Block input during modal
private isHardPaused = false;     // Pause state
```

---

*End of Reference Document*
