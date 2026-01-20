# WordRun Universal UI Visual Reference
## Neutral Pattern Vocabulary (Derived from GameplayInspo S1–S19)

**Purpose**  
This document is a **neutral, reusable vocabulary** for referencing gameplay UI patterns found across the `GameplayInspo` screenshots (S1–S19). Use these IDs/names when directing AI (or humans) to reproduce specific UI/interaction/feedback behaviors **without re-explaining them each time**.

**Scope**  
- These are **patterns**, not implementations.
- Screenshot references are **examples**, not requirements.
- When a pattern is uncertain, it is marked **Ambiguous** and should be resolved by design choice.

---

## Naming System

- **UIP-###** = Interaction patterns (how the player inputs/acts)
- **UDP-###** = Display patterns (how the game presents state/progress)
- **UFP-###** = Feedback patterns (visual/audio/animation “juice” and response)
- **UAP-###** = Action/Utility patterns (secondary controls, economy, navigation)
- **UCP-###** = Companion/Context patterns (mascots, backgrounds, theming)
- **ULP-###** = Layout patterns (screen zoning and layering)

---

## ULP — Layout Patterns

### ULP-001: Layered Scene Stack
Background → Gameplay → Controls → HUD → Feedback → Tutorial overlays.

### ULP-002: Standard Mobile Zoning
Top HUD, center gameplay, lower input, corners for utilities.

### ULP-003: Compact Gameplay Viewport
Limited visible rows/slots with implied vertical continuation.

---

## UIP — Interaction Patterns

### UIP-001: Radial Letter Input
Swipe-connected letters arranged in a circular wheel.

### UIP-002: Keyboard Letter Input
QWERTY-style on-screen keyboard input.

### UIP-003: Drag-to-Select Grid
Direct dragging across grid cells to form words.

### UIP-004: Tap-to-Activate Power-Up
Single-tap power-ups with immediate or modal effects.

### UIP-005: Targeted Hint Mode
Activate hint, then select a specific tile.

### UIP-006: Tutorial Gesture Demonstration
Animated hand/cursor showing intended gestures.

---

## UDP — Display Patterns

### UDP-001: Word Slot Grid Container
Panel holding word slots (non-intersecting or crossword-style).

### UDP-002: Word-in-Progress Display
Live input buffer showing the current word.

### UDP-003: Tile-Based Letter Cells
Rounded letter tiles with depth and state styling.

### UDP-004: Multi-State Tile System
Tiles change color/style based on correctness.

### UDP-005: Bonus Word Tracker
Progress indicator for extra/optional words.

### UDP-006: Currency Displays
Primary and premium resource counters.

### UDP-007: Progress Indicators
Linear bars or circular arcs showing completion/timers.

### UDP-008: Tooltip / Popover Hint
Small contextual overlays near gameplay elements.

---

## UFP — Feedback Patterns

### UFP-001: Selection Path Line
Glowing line connecting selected letters during input.

### UFP-002: Glow / Halo Emphasis
Outer glow highlighting active or important elements.

### UFP-003: Particle Burst Celebration
Confetti, sparkles, or bursts on success.

### UFP-004: Letter Flight Animation
Letters animate from input area to grid.

### UFP-005: Button Press Depth
Bevel/shadow shift indicating press interaction.

### UFP-006: Combo / Multiplier Banner
Dynamic banner showing streaks or multipliers.

### UFP-007: Tile State Transition
Animated transitions between tile states.

---

## UAP — Action / Utility Patterns

### UAP-001: Settings / Gear Control
Access to pause or settings.

### UAP-002: Pause / Menu Control
Pause or menu overlay trigger.

### UAP-003: Shuffle Control
Rearranges available letters.

### UAP-004: Hint Control
Generic hint activation.

### UAP-005: Store / IAP Entry
Shop or purchase access point.

### UAP-006: Back / Home Navigation
Navigation to previous or main screen.

### UAP-007: Cost / Badge Overlays
Badges showing cost, quantity, or lock state.

### UAP-008: Rewarded Ad Entry
Triggers rewarded advertisement.

---

## UCP — Companion / Context Patterns

### UCP-001: Passive Mascot Companion
Non-interfering character at screen edge.

### UCP-002: Themed Background Gradient
Simple gradient backdrop for clarity.

### UCP-003: Scenic Illustrated Background
Decorative illustrated scenery.

### UCP-004: Blur / Bokeh Photo Background
Heavily blurred photographic backdrop.

---

## Ambiguity Register (Condensed)

- Dictionary / “Aa” icon meaning
- Star tile purpose (obstacle vs reward)
- Word-length indicator semantics
- Rewind power-up scope
- Marketing banners vs in-game UI

---

## Usage Examples

- “Use **UIP-001** with **UDP-002** and **UFP-001**.”
- “Avoid crossword-style **UDP-001** variants.”
- “Include **UCP-001** but keep it non-interactive.”
