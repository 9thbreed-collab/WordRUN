# VGD + CDD Agent Workflow Plan

**Created:** 2026-01-20
**Version:** 1.2
**Status:** Phase 1 In Progress

---

## Overview

A multi-agent workflow combining Visual Game Development (VGD) methodology with Component-Driven Development (CDD) to build WordRun's vertical slice.

**Vertical Slice Target:**
- **Phase 1**: First map + 5 levels + character transitions + ferry
- **Phase 2**: Second map + 5 levels (proves templatization)

---

## Dev Server Configuration

| Server | Port | Purpose | Directory |
|--------|------|---------|-----------|
| OLD | 5175 | Legacy/existing | wordrun-vite/ |
| NEW | 5176 | Fresh rebuild | wordrun-rebuild/ |

**To start fresh server:**
```bash
cd /Users/nathanielgiddens/WordRunProject/wordrun-rebuild
npm run dev -- --port 5176
```

---

## Multi-Terminal Architecture

```
                    ┌─────────────────────────────────────┐
                    │      IMAGINATION LAYER              │
                    │   (Window 1 - This Terminal)        │
                    │   Claude + User                     │
                    │   Strategic Planning & Direction    │
                    └──────────────┬──────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ W2: Visual       │  │ W3: Grid &       │  │ W4: Scenes &     │
│ Assets Lead      │  │ Layout Lead      │  │ Logic Lead       │
│                  │  │                  │  │                  │
│ Agents: A,A2,A3  │  │ Agent: B         │  │ Agents: C,D,D2,  │
│                  │  │                  │  │ E,F              │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                   │
                                   ▼
                      ┌──────────────────┐
                      │ W5: Editor &     │
                      │ QA Lead          │
                      │ SOLE BROWSER     │
                      │ Agent: G         │
                      └──────────────────┘
```

**RATE LIMIT OPTIMIZATION:** Run windows sequentially, not in parallel:
1. W5 first (start server, then idle)
2. W3 (grid mockups - DONE, awaiting decision)
3. W2 (extraction pipeline)
4. W4 (scene assembly - needs W2+W3 output)

---

## Extraction Pipeline: A → A2 + A3

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

**Key Principle:** Agent A writes explicit interpolation instructions. A2/A3 follow them EXACTLY - no guessing.

---

## Agent Registry

| Agent | AI | Window | Purpose | Status |
|-------|-----|--------|---------|--------|
| A | Gemini | W2 | Extract components + write instructions | Pending |
| A2 | Gemini | W2 | Interpolate MAP components | Pending |
| A3 | Gemini | W2 | Interpolate UI components | Pending |
| B | Codex | W3 | Grid system (snap + nudge height) | **Mockups Done** |
| C | Codex | W4 | Component code attachment | Blocked by A2/A3 |
| D | Codex | W4 | Map scene assembly | Blocked by C |
| D2 | Codex | W4 | Transition scene builder | Blocked by D |
| E | Codex | W4 | Level builder | Blocked by D |
| F | Codex | W4 | Template generator | Blocked by E |
| G | Codex | W5 | Visual editor builder | Phase 2.5 |

---

## Source Files

### Map Reference Images
Location: `GameMapInspo/`
- Image.jpg
- Map1.png
- Map2.png
- Map3.png

### Character Animations
Location: `wordrun-rebuild/assets/animations/`
- walk-se.mov (South/East - face visible)
- walk-nw.mov (North/West - back visible)
- IdleForward.mov
- IdleBack.mov
- LevelCompleteHappyDance.mov
- Wrong.mov
- Wave.mov

---

## Directory Structure

```
wordrun-rebuild/
├── src/
│   ├── components/        # Component library (CDD)
│   ├── scenes/
│   │   ├── maps/          # Map scenes
│   │   └── templates/     # Reusable templates
│   ├── grid/              # Grid system
│   ├── editor/            # Visual editor
│   └── templates/         # Scene templates
├── assets/
│   ├── components/
│   │   ├── raw/           # Agent A output
│   │   ├── instructions/  # Agent A JSON instructions
│   │   ├── full/          # Agent A2/A3 output (interpolated)
│   │   └── thumbnails/    # 64x64 previews
│   └── animations/        # MOV files
├── index/
│   ├── extraction_manifest.json
│   ├── interpolation_log_map.json
│   ├── interpolation_log_ui.json
│   ├── components.json
│   └── ComponentCatalog.html
├── config/
│   ├── maps/
│   └── levels/
└── docs/
    ├── AgentPrompts.md
    ├── GridComparison.md
    ├── grid-mockup-isometric.html
    └── grid-mockup-orthogonal.html
```

---

## Grid System Specification

### Decision Required
User must choose between:
1. **Isometric Grid** - Diamond coordinates, (1,0) moves 30° right
2. **Orthogonal Grid** - Square grid with camera rotation

Mockups available at:
- `wordrun-rebuild/docs/grid-mockup-isometric.html`
- `wordrun-rebuild/docs/grid-mockup-orthogonal.html`
- `wordrun-rebuild/docs/GridComparison.md`

### Snap + Nudge System

**Snap:** Components lock to grid positions (X, Y)

**Nudge:** Fine adjustments
- X nudge: Horizontal within cell
- Y nudge: Vertical within cell
- **Z nudge (HEIGHT):** Raise/lower surface (-2.0 to +2.0 units)

**Height Use Cases:**
- Elevated platforms
- Sunken areas (water, pits)
- Stacking illusion
- Parallax layers

**Critical:** Interpolation MUST complete before height nudging.

---

## Interpolation Instructions Schema

Agent A outputs JSON instruction files for each component:

```json
{
  "componentId": "MAP-001",
  "name": "Grass Land Cube",
  "category": "map",
  "needsInterpolation": true,
  "status": "needs-work",
  "dimensions": {"width": 64, "height": 48},
  "regions": [
    {
      "location": "left face, lower half",
      "boundingBox": {"x": 0, "y": 24, "width": 20, "height": 24},
      "issue": "tree trunk from adjacent tile occludes this area",
      "surroundingContext": "grass texture visible above, cube edge at 30°",
      "suggestedFill": "continue grass texture with left-face shading",
      "priority": "high"
    }
  ],
  "geometryNotes": "isometric cube, top face brightest, 30° angles",
  "referenceImages": [
    {"source": "Map1.png", "coords": {"x": 120, "y": 340}}
  ],
  "notes": "Tree trunk masks ~40% of left face"
}
```

---

## Phase Checklist

### Phase 0: Setup ✅
- [x] Create wordrun-rebuild/ directory structure
- [x] Initialize Phaser 3 + Vite
- [x] Copy MOV files to assets/animations/
- [x] Create Scratchpad.md
- [x] Write agent prompts

### Phase 1: Visual Extraction & Grid Design (IN PROGRESS)
- [ ] **BLOCKER:** User grid decision (isometric vs orthogonal)
- [ ] Agent A: Extract all components with instruction files
- [ ] Agent A2: Interpolate MAP components
- [ ] Agent A3: Interpolate UI components
- [ ] Generate ComponentCatalog.html
- [ ] Generate components.json
- [ ] Agent B Phase 2: Implement chosen grid system

### Phase 2: Component Library & Scenes
- [ ] Agent C: Component code attachment
- [ ] Agent D: Map 1 scene assembly
- [ ] Agent D2: Transition scenes
- [ ] Agent E: Levels 1-5 implementation

### Phase 2.5: Visual Editor
- [ ] Agent G: Build drag-and-drop editor

### Phase 3: Templatization
- [ ] Agent F: Extract templates from Map 1

### Phase 4: Validation
- [ ] Create Map 2 using ONLY config (no code changes)
- [ ] Create levels 6-10 using ONLY config
- [ ] Verify CDD principle: removing any component doesn't break game

---

## Headless Agent Execution

To conserve Claude Code rate limits, delegate heavy processing:

**Gemini (visual/image tasks):**
```bash
gemini -p "YOUR_PROMPT_HERE"
```

**Codex (code generation):**
```bash
codex -p "YOUR_PROMPT_HERE"
```

**Rules:**
1. Read full prompt from: `wordrun-rebuild/docs/AgentPrompts.md`
2. Execute via headless mode
3. Prompt MUST include: "Use Playwright MCP tools to complete this task"
4. Monitor output, update Scratchpad.md with results

---

## Coordination File

**Location:** `/Users/nathanielgiddens/WordRunProject/Scratchpad.md`

All windows read this before starting any task. Update after completing tasks.

---

## Key Documents

| Document | Purpose |
|----------|---------|
| Scratchpad.md | Real-time coordination |
| VGD_CDD_PLAN.md | This file - master plan |
| AgentPrompts.md | Copy-paste prompts for headless agents |
| GridComparison.md | Grid decision documentation |
| CLAUDE.md | Project-wide Claude guidance |

---

*Last Updated: 2026-01-20*
