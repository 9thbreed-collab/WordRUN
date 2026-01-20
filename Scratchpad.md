# WordRun Development Scratchpad

## Last Updated: 2026-01-20 01:00
## Updated By: W1 (Imagination Layer)

---

## CURRENT PHASE: Phase 1 - Visual Extraction & Grid Design

## ACTIVE TASKS
| Window | Task | Status | Blocked By |
|--------|------|--------|------------|
| W1 | Monitor progress, resolve escalations | active | none |
| W2 | Extract (A) → Interpolate Map (A2) + UI (A3) in parallel | ready | none |
| W3 | Generate grid mockups with snap+nudge (Agent B) | in_progress | none |
| W4 | Review GameplayScene.ts reference | in-progress | W2, W3 (for assembly) |
| W5 | Start dev server, maintain browser | ready | none |

## COMPLETED TASKS
- 2026-01-20 00:10 W1: Created wordrun-rebuild/ directory structure
- 2026-01-20 00:12 W1: Verified Phaser 3 + Vite already initialized
- 2026-01-20 00:15 W1: Created Scratchpad.md with interpolation workflow
- 2026-01-20 00:20 W1: Copied MOV files to assets/animations/ (7 files)
- 2026-01-20 00:25 W1: Wrote Agent A2 (Interpolation) and updated Agent B prompts
- 2026-01-20 00:28 W1: Verified GameMapInspo/ has source images (Image.jpg, Map1.png, Map2.png, Map3.png)
- 2026-01-20 00:30 W1: Phase 0 COMPLETE - Ready for Phase 1
- 2026-01-20 01:00 W1: Split interpolation into A2 (Map) + A3 (UI) for parallel processing

## PENDING HANDOFFS
(none yet)

## BLOCKERS / ISSUES
(none yet)

## DECISIONS NEEDED (for Imagination Layer)
(none yet)

## NEXT ACTIONS (per window)
- W1: Coordinate Phase 1 kickoff
- W2: Run Agent A (extraction), then A2 + A3 in parallel
- W3: Run Agent B (grid mockups)
- W4: Wait for W2, W3 outputs
- W5: Start dev server, maintain browser

---

## WORKFLOW UPDATE: Three-Agent Extraction Pipeline

### Problem Statement
- Extraction and interpolation are different skills
- Single agent doing both = bottleneck + potential loss of detail
- Interpolation instructions must be explicit, not guessed

### Solution: Split into A → A2 + A3

```
                    ┌─────────────────┐
                    │    Agent A      │
                    │  (Extraction)   │
                    │                 │
                    │ Outputs:        │
                    │ - raw images    │
                    │ - instructions  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │    Agent A2     │           │    Agent A3     │
    │  (Map Interp)   │           │  (UI Interp)    │
    │                 │           │                 │
    │ - Land cubes    │           │ - Buttons       │
    │ - Trees         │           │ - Panels        │
    │ - Buildings     │           │ - Displays      │
    │ - Paths         │           │ - Icons         │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Index Gen      │
                  │  (Catalog)      │
                  └─────────────────┘
```

### Agent A: Extraction Specialist (ONLY extracts, writes instructions)

**Responsibilities:**
1. Extract each component from screenshots
2. Save raw image to `assets/components/raw/`
3. **CRITICAL:** Write interpolation instruction file for EACH component

**Output per component:**
```
assets/components/raw/AL-001.png          # Raw extracted image
assets/components/instructions/AL-001.json # Interpolation instructions
```

**Instruction File Schema:**
```json
{
  "componentId": "AL-001",
  "category": "map|ui",
  "needsInterpolation": true|false,
  "status": "clean|needs-work",
  "regions": [
    {
      "location": "bottom-left quadrant",
      "boundingBox": {"x": 10, "y": 45, "width": 30, "height": 25},
      "issue": "occluded by tree trunk from adjacent cube",
      "surroundingContext": "grass texture, cube edge visible on right side",
      "suggestedFill": "continue grass texture, maintain cube edge angle",
      "priority": "high"
    }
  ],
  "referenceImages": ["S4.jpg at coords (120,340)"],
  "notes": "Tree trunk masks approximately 40% of left cube face"
}
```

### Agent A2: Map Component Interpolation

**Receives:** Instructions for category="map"
**Components:** Land cubes, trees, buildings, paths, terrain, decorations
**Why separate:** These have complex 3D occlusion, isometric geometry, texture continuation

### Agent A3: UI Component Interpolation

**Receives:** Instructions for category="ui"
**Components:** Buttons, panels, displays, icons, text containers
**Why separate:** Simpler shapes, gradient fills, edge completion - faster processing

### Benefits of Split
1. **No guessing:** A2/A3 get explicit instructions from A
2. **Parallel processing:** A2 and A3 run simultaneously
3. **Specialized focus:** Each agent optimized for its component type
4. **Audit trail:** Instructions document exactly what was found

---

## PHASE 1 DIRECTIVES (Updated)

### DIRECTIVE 1: Extraction
```
TO: W2 (Agent A)
PRIORITY: high
TASK: Extract ALL components from GameMapInspo/S1-S19.jpg
DEPENDS_ON: none
EXPECTED_OUTPUT:
  - wordrun-rebuild/assets/components/raw/*.png
  - wordrun-rebuild/assets/components/instructions/*.json (one per component)
  - wordrun-rebuild/index/extraction_manifest.json (summary)
NOTE: Focus ONLY on extraction. Write detailed interpolation instructions.
      Do NOT attempt interpolation.
```

### DIRECTIVE 2: Map Interpolation
```
TO: W2 (Agent A2)
PRIORITY: high
TASK: Interpolate all components where category="map"
DEPENDS_ON: Agent A complete
EXPECTED_OUTPUT:
  - wordrun-rebuild/assets/components/full/[map-components].png
  - wordrun-rebuild/assets/components/thumbnails/[map-components].png
  - wordrun-rebuild/index/interpolation_log_map.json
NOTE: Follow instructions in assets/components/instructions/*.json EXACTLY
```

### DIRECTIVE 3: UI Interpolation
```
TO: W2 (Agent A3)
PRIORITY: high
TASK: Interpolate all components where category="ui"
DEPENDS_ON: Agent A complete
EXPECTED_OUTPUT:
  - wordrun-rebuild/assets/components/full/[ui-components].png
  - wordrun-rebuild/assets/components/thumbnails/[ui-components].png
  - wordrun-rebuild/index/interpolation_log_ui.json
NOTE: Follow instructions in assets/components/instructions/*.json EXACTLY
```

### DIRECTIVE 4: Grid Mockups
```
TO: W3 (Agent B)
PRIORITY: high
TASK: Generate grid mockups (isometric vs orthogonal) with snap + nudge demo
DEPENDS_ON: none
EXPECTED_OUTPUT:
  - wordrun-rebuild/docs/grid-mockup-isometric.png
  - wordrun-rebuild/docs/grid-mockup-orthogonal.png
  - wordrun-rebuild/docs/GridComparison.md
NOTE: MUST demonstrate height nudge (raised/lowered cubes) in both mockups
```

### DIRECTIVE 5: Dev Server
```
TO: W5
PRIORITY: medium
TASK: Start dev server, prepare browser for real-time preview
DEPENDS_ON: none
EXPECTED_OUTPUT: Browser open at localhost:5175
```

### DIRECTIVE 6: Reference Review
```
TO: W4
PRIORITY: low
TASK: Review existing GameplayScene.ts (read-only) to understand logic
DEPENDS_ON: W2 (components), W3 (grid)
EXPECTED_OUTPUT: Notes on key logic to preserve in rebuild
```

---

## AGENT REGISTRY (Updated v1.2)

| Agent | AI | Window | Purpose | Parallel? |
|-------|-----|--------|---------|-----------|
| A | Gemini | W2 | Extract components + write instructions | First |
| A2 | Gemini | W2 | Interpolate MAP components | Yes (with A3) |
| A3 | Gemini | W2 | Interpolate UI components | Yes (with A2) |
| B | Codex | W3 | Grid system (snap + nudge height) | Yes (with A) |
| C | Codex | W4 | Component code attachment | After A2/A3 |
| D | Codex | W4 | Map scene assembly | After C |
| D2 | Codex | W4 | Transition scene builder | After D |
| E | Codex | W4 | Level builder | After D |
| F | Codex | W4 | Template generator | After E |
| G | Codex | W5 | Visual editor builder | Phase 2.5 |

---

## FILE LOCATIONS (Updated)

### Assets Structure
```
wordrun-rebuild/assets/components/
├── raw/              # Agent A output (extracted, may have artifacts)
├── instructions/     # Agent A output (JSON interpolation instructions)
├── full/             # Agent A2+A3 output (interpolated, full size)
└── thumbnails/       # Generated from interpolated images (64x64)
```

### Index Files
```
wordrun-rebuild/index/
├── extraction_manifest.json    # Agent A summary
├── interpolation_log_map.json  # Agent A2 results
├── interpolation_log_ui.json   # Agent A3 results
├── components.json             # Final component registry
└── ComponentCatalog.html       # Visual browser
```

---

## INSTRUCTION FILE EXAMPLES

### Example: Land Cube (Map Component)
```json
{
  "componentId": "MAP-001",
  "name": "Grass Land Cube",
  "category": "map",
  "needsInterpolation": true,
  "status": "needs-work",
  "regions": [
    {
      "location": "left face",
      "boundingBox": {"x": 0, "y": 20, "width": 25, "height": 40},
      "issue": "tree trunk from MAP-015 occludes this face",
      "surroundingContext": "grass texture visible at edges, darker shade on left face vs top",
      "suggestedFill": "continue grass texture with left-face shading, maintain isometric edge at 30°",
      "priority": "high"
    }
  ],
  "geometryNotes": "isometric cube, top face is brightest, left face mid-tone, right face not visible",
  "referenceImages": ["S4.jpg coords (120,340)", "S7.jpg coords (200,280)"],
  "notes": "Tree trunk masks ~40% of left face. Edge angle must be exactly 30° to match isometric grid."
}
```

### Example: Button (UI Component)
```json
{
  "componentId": "UI-005",
  "name": "Hint Button",
  "category": "ui",
  "needsInterpolation": false,
  "status": "clean",
  "regions": [],
  "notes": "Clean extraction, no occlusion. Ready for direct use."
}
```

### Example: Panel (UI Component, needs work)
```json
{
  "componentId": "UI-012",
  "name": "Score Panel",
  "category": "ui",
  "needsInterpolation": true,
  "status": "needs-work",
  "regions": [
    {
      "location": "bottom-right corner",
      "boundingBox": {"x": 85, "y": 42, "width": 15, "height": 8},
      "issue": "overlapping button partially covers corner",
      "surroundingContext": "rounded rectangle with 8px radius, gradient fill light-to-dark top-to-bottom",
      "suggestedFill": "continue rounded corner with same radius, match gradient",
      "priority": "medium"
    }
  ],
  "referenceImages": ["S1.jpg coords (50,80)"],
  "notes": "Simple corner completion needed"
}
```

---

## GRID NUDGE SPECIFICATION (for Agent B)

### Nudge Axes
- **X nudge**: Fine horizontal adjustment within grid cell
- **Y nudge**: Fine vertical adjustment within grid cell
- **Z nudge (HEIGHT)**: Raise/lower surface level (most important)

### Height Nudge Use Cases
1. **Elevated platforms**: Cube surface raised above neighbors
2. **Sunken areas**: Cube surface lowered (water, pits)
3. **Stacking illusion**: Create depth without true 3D
4. **Parallax layers**: Foreground/background separation

### Height Nudge Values
- Unit: pixels or grid fractions (TBD by Agent B)
- Range: -2 to +2 grid units recommended
- Snap: Optional snap to 0.25 increments

### Visual Indicator
- Editor shows height value on hover
- Color coding: red (lowered) → white (neutral) → blue (raised)

---

## CHECKPOINT CRITERIA

### Phase 1 Complete When:
- [ ] All components extracted with instruction files (Agent A)
- [ ] All MAP components interpolated (Agent A2)
- [ ] All UI components interpolated (Agent A3)
- [ ] No `failed` entries in interpolation logs
- [ ] Grid mockups generated with height nudge demo (Agent B)
- [ ] User chooses isometric vs orthogonal
- [ ] Index documents (HTML + JSON) generated

---

*Scratchpad Version: 1.2*
*Created: 2026-01-20*
*Key Update: Split interpolation into A2 (Map) + A3 (UI) with explicit instruction handoff*
