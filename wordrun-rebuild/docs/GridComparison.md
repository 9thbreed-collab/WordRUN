# Grid System Comparison: Isometric vs Orthogonal

## Overview

This document compares two grid system approaches for WordRun's map scene placement. Both systems support **SNAP** (lock components to grid positions) and **NUDGE** (fine adjustments, especially HEIGHT for Z-axis depth).

**Screen Dimensions:** 390 x 844 pixels (mobile portrait)
**Target Orientation:** Isometric visual style ('North' toward upper-right)

---

## Option A: True Isometric Grid (Diamond Coordinates)

### Concept

Uses native diamond-shaped grid cells aligned with isometric projection angles.

```
         (0,0)
           /\
          /  \
    (-1,1)    (1,-1)
        \    /
         \  /
         (0,0)
          /\
         /  \
   (0,1)     (1,0)
```

### Coordinate System

- **X-axis:** Points toward upper-right at 30 degrees
- **Y-axis:** Points toward upper-left at 30 degrees
- **Grid unit:** Diamond with 64px width, 32px height (2:1 ratio)

### Conversion Formulas

```typescript
// Grid to Screen
screenX = centerX + (gridX - gridY) * (tileWidth / 2);
screenY = centerY + (gridX + gridY) * (tileHeight / 2);

// Screen to Grid
gridX = Math.round((screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2);
gridY = Math.round((screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2);
```

### Pros

1. **Native isometric alignment** - Components naturally align with visual perspective
2. **Intuitive for artists** - Matches how isometric art is typically created
3. **Simple depth sorting** - Y-coordinate directly maps to render order
4. **No camera rotation needed** - What you place is what you see

### Cons

1. **Math complexity** - Coordinate conversions required everywhere
2. **Hit testing** - Diamond click regions need custom logic
3. **Rectangular overlap** - Screen-aligned UI doesn't match grid
4. **Debugging difficulty** - Grid coordinates don't map to screen directly

---

## Option B: Orthogonal Grid + Camera Rotation

### Concept

Uses standard X/Y square grid with visual rotation applied at render time.

```
    Y
    |
    |
    +----X

    Rendered at 45 degrees with vertical compression
```

### Coordinate System

- **X-axis:** Standard horizontal
- **Y-axis:** Standard vertical
- **Grid unit:** 32x32 pixel squares, rendered as 64x32 diamonds
- **Camera rotation:** 45 degrees with Y-scale 0.5

### Conversion Formulas

```typescript
// Grid to Screen (with rotation)
const rotatedX = gridX - gridY;
const rotatedY = (gridX + gridY) * 0.5;
screenX = centerX + rotatedX * (tileSize / 2);
screenY = centerY + rotatedY * (tileSize / 2);

// Screen to Grid (inverse rotation)
const invX = screenX / (tileSize / 2);
const invY = screenY / (tileSize / 4);
gridX = Math.round((invX + invY) / 2);
gridY = Math.round((invY - invX) / 2);
```

### Pros

1. **Standard math** - Square grid is simpler to reason about
2. **Easy hit testing** - Click regions are squares (pre-rotation)
3. **Phaser integration** - Works well with Phaser's tilemap system
4. **Familiar coordinates** - X/Y are intuitive for developers

### Cons

1. **Mental translation** - Must think in rotated space
2. **Asset alignment** - Art must be created knowing rotation applies
3. **UI mixing** - Screen-aligned UI needs separate coordinate system
4. **Render complexity** - Camera/container rotation adds overhead

---

## HEIGHT NUDGE System (Both Options)

The HEIGHT nudge is critical for creating visual depth without true 3D rendering.

### Height Range

```
-2.0 ────── -1.0 ────── 0.0 ────── +1.0 ────── +2.0
SUNKEN      LOW       NEUTRAL      HIGH      ELEVATED
```

### Visual Effect

Each HEIGHT unit translates to vertical screen offset:

```typescript
const HEIGHT_PIXELS = 12; // Pixels per height unit

function heightToScreenOffset(height: number): number {
  return -height * HEIGHT_PIXELS; // Negative because Y increases downward
}
```

### Height Examples

| Height | Effect | Use Case |
|--------|--------|----------|
| +2.0 | 24px up | Castle tower platform |
| +1.0 | 12px up | Raised walkway |
| +0.5 | 6px up | Single step up |
| 0.0 | Baseline | Normal ground |
| -0.5 | 6px down | Shallow water |
| -1.0 | 12px down | Sunken path |
| -2.0 | 24px down | Deep pit |

### Height in Render Order

Height affects depth sorting:

```typescript
// Render order calculation
function getRenderDepth(gridX: number, gridY: number, height: number): number {
  // Base depth from grid position (higher gridX+gridY = further back)
  const baseDepth = gridX + gridY;

  // Height adds to depth (raised = rendered on top of same-row items)
  return baseDepth * 100 + (height + 2) * 10;
}
```

### Height Visual Indicators (Editor Mode)

Color-coded height display:

```
Height <= -1.0  → Red tint      #FF4444
Height == 0.0   → No tint       #FFFFFF
Height >= +1.0  → Blue tint     #4444FF
Gradient between for intermediate values
```

---

## SNAP System (Both Options)

### Snap Points

Components lock to integer grid coordinates by default.

```typescript
interface SnapConfig {
  enabled: boolean;
  gridSnap: boolean;        // Lock to integer grid positions
  subGridSnap: 0.25 | 0.5;  // Optional sub-grid snapping
  heightSnap: 0.25;         // Height snaps to quarter units
}
```

### Snap Behavior

```typescript
function snapToGrid(pos: GridPosition, config: SnapConfig): GridPosition {
  if (!config.enabled) return pos;

  return {
    gridX: config.gridSnap ? Math.round(pos.gridX) : pos.gridX,
    gridY: config.gridSnap ? Math.round(pos.gridY) : pos.gridY,
    nudgeX: snapToIncrement(pos.nudgeX, config.subGridSnap),
    nudgeY: snapToIncrement(pos.nudgeY, config.subGridSnap),
    height: snapToIncrement(pos.height, config.heightSnap),
  };
}
```

---

## NUDGE System (Both Options)

### Nudge Axes

| Axis | Range | Purpose |
|------|-------|---------|
| nudgeX | -1.0 to +1.0 | Fine horizontal within cell |
| nudgeY | -1.0 to +1.0 | Fine vertical within cell |
| height | -2.0 to +2.0 | Vertical depth (Z-axis) |

### Nudge Increments

Default increment: 0.25 grid units (adjustable)

```typescript
function nudge(
  pos: GridPosition,
  axis: 'x' | 'y' | 'height',
  delta: number
): GridPosition {
  const newPos = { ...pos };

  switch (axis) {
    case 'x':
      newPos.nudgeX = clamp(pos.nudgeX + delta, -1.0, 1.0);
      break;
    case 'y':
      newPos.nudgeY = clamp(pos.nudgeY + delta, -1.0, 1.0);
      break;
    case 'height':
      newPos.height = clamp(pos.height + delta, -2.0, 2.0);
      break;
  }

  return newPos;
}
```

---

## Zone Definitions (Both Options)

### Screen Zones

```
┌──────────────────────────┐
│     SAFE AREA (44px)     │  ← Notch/status bar
├──────────────────────────┤
│      HEADER ZONE         │  60-80px
│    (Score, Lives, etc)   │
├──────────────────────────┤
│                          │
│                          │
│     GAMEPLAY ZONE        │  ~550px
│    (Map, Characters)     │
│                          │
│                          │
├──────────────────────────┤
│      INPUT ZONE          │  ~120px
│   (Keyboard, Actions)    │
├──────────────────────────┤
│      FOOTER ZONE         │  40-60px
│    (Nav, Settings)       │
├──────────────────────────┤
│     SAFE AREA (20px)     │  ← Home indicator
└──────────────────────────┘
```

### Zone Height Constraints

| Zone | Height Nudge Allowed |
|------|---------------------|
| Header | 0.0 only (fixed UI) |
| Gameplay | -2.0 to +2.0 (full range) |
| Input | 0.0 only (fixed UI) |
| Footer | 0.0 only (fixed UI) |

---

## Recommendation

### For WordRun: **Option A (True Isometric)**

**Rationale:**

1. **Art-first workflow** - Reference screenshots are already isometric; matching grid simplifies extraction
2. **Natural depth sorting** - Simpler render order calculation
3. **Visual editor alignment** - What designers see is what players get
4. **Proven pattern** - Used by most isometric mobile games

**Implementation notes:**

- Use dedicated GridSystem.ts with coordinate helpers
- UI components use separate screen-coordinate system
- Height nudge is primary differentiation feature

---

## Mockup Rendering Instructions

Both mockups should display:

1. **5x5 grid of land cubes** at base level (height = 0)
2. **One cube raised** to height = +1.5 (clearly visible elevation)
3. **One cube lowered** to height = -1.0 (visible depression)
4. **Grid lines** showing coordinate system
5. **Height indicators** with color coding
6. **Zone boundaries** (header/gameplay/input/footer)

**Mockup files:**
- `grid-mockup-isometric.html` - Renders Option A
- `grid-mockup-orthogonal.html` - Renders Option B

---

## Decision Required

**USER MUST CHOOSE:** Isometric (Option A) or Orthogonal (Option B)

This decision gates Phase 2 implementation. Once chosen, Agent B will generate:
- `src/grid/GridSystem.ts`
- `src/grid/GridConfig.ts`
- `src/grid/types.ts`

---

*Document Version: 1.0*
*Created by: W3 (Grid & Layout Lead) - Agent B*
*Date: 2026-01-20*
