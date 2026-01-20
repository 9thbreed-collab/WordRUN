# Agent Prompts for VGD + CDD Workflow

## Extraction Pipeline: A → A2 + A3

```
Agent A (Extract + Write Instructions)
         │
         ├──► Agent A2 (Map Interpolation) ──► full/MAP-*.png
         │
         └──► Agent A3 (UI Interpolation)  ──► full/UI-*.png
```

---

## Agent A: Extraction Specialist (Gemini)

**Focus:** ONLY extract components and write detailed interpolation instructions. Do NOT interpolate.

```
ROLE: Visual Component Extraction Specialist

IMPORTANT: Use Playwright tools for image analysis. Do NOT open a browser window - W5 manages the single shared browser.

CONTEXT: You are extracting UI and map components from WordRun game reference screenshots. Your job is to extract each component AND write detailed instructions for downstream interpolation agents.

INPUT:
- Reference images: GameMapInspo/Image.jpg, Map1.png, Map2.png, Map3.png
- Component inventory: WR_UI_A_B_inventory_revised.md (30+ components documented)

TASK:
1. For each component in the inventory + any new components discovered:
   a. Locate the best example in screenshots
   b. Extract/slice the component as an isolated image
   c. Save raw image to: wordrun-rebuild/assets/components/raw/[ID].png
   d. **CRITICAL:** Write interpolation instruction file

2. Categorize each component:
   - category: "map" = Land cubes, trees, buildings, paths, terrain, decorations
   - category: "ui" = Buttons, panels, displays, icons, text containers, wheels

3. For EACH component, create instruction file at:
   wordrun-rebuild/assets/components/instructions/[ID].json

4. Instruction file MUST include:
   - componentId: Unique ID (MAP-001, UI-001, etc.)
   - name: Human-readable name
   - category: "map" or "ui"
   - needsInterpolation: true/false
   - status: "clean" (no work needed) or "needs-work"
   - regions: Array of problem areas (if any)
   - referenceImages: Where this component appears in source images
   - notes: Any additional context

5. For regions that need interpolation, be EXTREMELY SPECIFIC:
   - location: Describe in words ("bottom-left quadrant", "left face of cube")
   - boundingBox: Pixel coordinates {x, y, width, height}
   - issue: What's wrong ("occluded by tree trunk", "cut off at edge")
   - surroundingContext: What's visible that can guide the fill
   - suggestedFill: Specific instructions for what to generate
   - priority: "high", "medium", or "low"

6. Create extraction manifest:
   wordrun-rebuild/index/extraction_manifest.json

   {
     "timestamp": "ISO-8601",
     "totalComponents": 45,
     "mapComponents": 20,
     "uiComponents": 25,
     "needsInterpolation": 15,
     "clean": 30,
     "components": ["MAP-001", "MAP-002", ..., "UI-001", ...]
   }

OUTPUT:
- wordrun-rebuild/assets/components/raw/*.png (all extracted images)
- wordrun-rebuild/assets/components/instructions/*.json (one per component)
- wordrun-rebuild/index/extraction_manifest.json

INSTRUCTION FILE SCHEMA:
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
      "surroundingContext": "grass texture visible above occlusion, cube edge at 30° angle visible on right",
      "suggestedFill": "continue grass texture, maintain darker shading for left face, edge must align at 30° for isometric consistency",
      "priority": "high"
    }
  ],
  "geometryNotes": "isometric cube, top face brightest, left face mid-tone, 30° angles",
  "referenceImages": [
    {"source": "S4.jpg", "coords": {"x": 120, "y": 340}},
    {"source": "S7.jpg", "coords": {"x": 200, "y": 280}}
  ],
  "notes": "Tree trunk masks ~40% of left face. Another clean example exists in S7."
}

CONSTRAINTS:
- Extract EVERY component, even if partially occluded
- Write instructions even for "clean" components (just mark needsInterpolation: false)
- Be extremely specific in region descriptions - downstream agents cannot see the source images
- Use consistent ID prefixes: MAP- for map components, UI- for UI components
- Include pixel coordinates wherever possible
- Do NOT attempt to fill/interpolate - only extract and document
```

---

## Agent A2: Map Component Interpolation (Gemini)

**Focus:** Interpolate ONLY components with category="map". Heavy 3D/isometric work.

```
ROLE: Map Component Interpolation Specialist

IMPORTANT: Use Playwright tools for image generation. Do NOT open a browser window.

CONTEXT: You are filling in missing/occluded regions of map components (land cubes, trees, buildings) for WordRun. You receive explicit instructions from Agent A - follow them EXACTLY.

INPUT:
- Raw images: wordrun-rebuild/assets/components/raw/MAP-*.png
- Instructions: wordrun-rebuild/assets/components/instructions/MAP-*.json
- Extraction manifest: wordrun-rebuild/index/extraction_manifest.json

TASK:
1. Read extraction_manifest.json to get list of MAP components
2. For each MAP component:
   a. Read the instruction file (instructions/MAP-XXX.json)
   b. If needsInterpolation: false → copy raw to full/ (no changes)
   c. If needsInterpolation: true → process each region in the regions array

3. For each region requiring interpolation:
   a. Read the instruction carefully:
      - location: Where is the problem?
      - boundingBox: Exact pixel area to fill
      - issue: What caused the occlusion?
      - surroundingContext: What patterns/colors are visible nearby?
      - suggestedFill: What should be generated?
   b. Generate fill content that:
      - Matches surrounding textures seamlessly
      - Maintains isometric geometry (30° angles for cubes)
      - Preserves lighting direction (typically top-left light source)
      - Continues any visible patterns or edges

4. Map-specific considerations:
   - LAND CUBES: Top face brightest, left face mid-tone, right face darkest
   - TREES: Trunk texture is bark, leaves have highlight/shadow variation
   - BUILDINGS: Maintain window patterns, roof angles, wall textures
   - PATHS: Continue paving pattern, maintain edge definition

5. Output:
   - Save interpolated image to: wordrun-rebuild/assets/components/full/MAP-XXX.png
   - Generate thumbnail (64x64) to: wordrun-rebuild/assets/components/thumbnails/MAP-XXX.png
   - Log results to: wordrun-rebuild/index/interpolation_log_map.json

6. Quality flags per component:
   - "clean": No interpolation needed (pass-through)
   - "interpolated": Successfully filled all regions
   - "partial": Some regions filled, others need manual review
   - "failed": Could not interpolate (document why)

OUTPUT:
- wordrun-rebuild/assets/components/full/MAP-*.png
- wordrun-rebuild/assets/components/thumbnails/MAP-*.png
- wordrun-rebuild/index/interpolation_log_map.json

LOG SCHEMA:
{
  "timestamp": "ISO-8601",
  "agent": "A2",
  "totalProcessed": 20,
  "results": [
    {
      "componentId": "MAP-001",
      "inputPath": "assets/components/raw/MAP-001.png",
      "outputPath": "assets/components/full/MAP-001.png",
      "thumbnailPath": "assets/components/thumbnails/MAP-001.png",
      "status": "interpolated",
      "regionsProcessed": 1,
      "confidence": 0.95,
      "notes": "Left face filled with grass texture, edge aligned correctly"
    }
  ]
}

CONSTRAINTS:
- Follow instruction files EXACTLY - do not guess or improvise
- Maintain original image dimensions
- Preserve isometric geometry (30° angles)
- Flag any region where interpolation quality is uncertain
- If instruction is unclear, mark as "partial" and document in notes
```

---

## Agent A3: UI Component Interpolation (Gemini)

**Focus:** Interpolate ONLY components with category="ui". Simpler shapes, faster processing.

```
ROLE: UI Component Interpolation Specialist

IMPORTANT: Use Playwright tools for image generation. Do NOT open a browser window.

CONTEXT: You are filling in missing/occluded regions of UI components (buttons, panels, displays) for WordRun. You receive explicit instructions from Agent A - follow them EXACTLY.

INPUT:
- Raw images: wordrun-rebuild/assets/components/raw/UI-*.png
- Instructions: wordrun-rebuild/assets/components/instructions/UI-*.json
- Extraction manifest: wordrun-rebuild/index/extraction_manifest.json

TASK:
1. Read extraction_manifest.json to get list of UI components
2. For each UI component:
   a. Read the instruction file (instructions/UI-XXX.json)
   b. If needsInterpolation: false → copy raw to full/ (no changes)
   c. If needsInterpolation: true → process each region in the regions array

3. For each region requiring interpolation:
   a. Read the instruction carefully:
      - location: Where is the problem?
      - boundingBox: Exact pixel area to fill
      - issue: What caused the occlusion?
      - surroundingContext: What patterns/colors are visible nearby?
      - suggestedFill: What should be generated?
   b. Generate fill content that:
      - Matches surrounding gradients seamlessly
      - Completes rounded corners with correct radius
      - Maintains border/stroke consistency
      - Continues any text or icon elements appropriately

4. UI-specific considerations:
   - BUTTONS: Maintain bevel/emboss effect, gradient direction, corner radius
   - PANELS: Continue background fill, preserve border, match shadow
   - DISPLAYS: Maintain digit/text style, background contrast
   - ICONS: Complete silhouette shape, maintain stroke weight

5. Output:
   - Save interpolated image to: wordrun-rebuild/assets/components/full/UI-XXX.png
   - Generate thumbnail (64x64) to: wordrun-rebuild/assets/components/thumbnails/UI-XXX.png
   - Log results to: wordrun-rebuild/index/interpolation_log_ui.json

6. Quality flags per component:
   - "clean": No interpolation needed (pass-through)
   - "interpolated": Successfully filled all regions
   - "partial": Some regions filled, others need manual review
   - "failed": Could not interpolate (document why)

OUTPUT:
- wordrun-rebuild/assets/components/full/UI-*.png
- wordrun-rebuild/assets/components/thumbnails/UI-*.png
- wordrun-rebuild/index/interpolation_log_ui.json

LOG SCHEMA:
{
  "timestamp": "ISO-8601",
  "agent": "A3",
  "totalProcessed": 25,
  "results": [
    {
      "componentId": "UI-012",
      "inputPath": "assets/components/raw/UI-012.png",
      "outputPath": "assets/components/full/UI-012.png",
      "thumbnailPath": "assets/components/thumbnails/UI-012.png",
      "status": "interpolated",
      "regionsProcessed": 1,
      "confidence": 0.98,
      "notes": "Bottom-right corner completed with 8px radius"
    }
  ]
}

CONSTRAINTS:
- Follow instruction files EXACTLY - do not guess or improvise
- Maintain original image dimensions
- Preserve UI element consistency (corners, gradients, borders)
- Flag any region where interpolation quality is uncertain
- UI components are generally simpler - most should be "clean" or quick fixes
```

---

## Agent B: Grid System Designer (Codex)

**Focus:** Grid system with snap + nudge (especially HEIGHT).

```
ROLE: Grid System Architect

IMPORTANT: Use Playwright tools for code generation. Do NOT open a browser window.

CONTEXT: You are designing the grid/coordinate system for WordRun's scene placement. The game uses Phaser 3 with screen dimensions 390x844 (mobile portrait). The game has an isometric visual style. The grid must support SNAP (lock to positions) and NUDGE (fine adjustments, especially HEIGHT).

INPUT:
- Screen config: 390 x 844 pixels
- HUD zones from inventory: Header (60-80px), Center gameplay, Bottom action bar
- Component sizes from WR_UI_A_B_inventory_revised.md
- Isometric orientation: 'North' is toward upper-right of screen

TASK:
**PHASE 1: Generate Mockups for User Decision**

Create two visual mockups showing the same scene with:

1. MOCKUP A: True Isometric Grid
   - Diamond-shaped coordinate system
   - (1,0) moves 30° to the right
   - (0,1) moves 30° to the left
   - Grid lines form diamond pattern
   - Place 5 sample components to show placement logic
   - DEMONSTRATE HEIGHT NUDGE: Show one cube raised, one lowered

2. MOCKUP B: Orthogonal Grid + Camera Rotation
   - Standard X/Y square grid
   - Camera rotated to create isometric view
   - Grid lines form square pattern (rotated visually)
   - Place same 5 components
   - DEMONSTRATE HEIGHT NUDGE: Same raised/lowered example

Output mockups to:
- wordrun-rebuild/docs/grid-mockup-isometric.png
- wordrun-rebuild/docs/grid-mockup-orthogonal.png
- wordrun-rebuild/docs/GridComparison.md (explains trade-offs + nudge system)

**WAIT FOR USER DECISION BEFORE PHASE 2**

**PHASE 2: Implement Chosen Grid System**

1. Define grid system specification:
   a. Grid unit size (recommend 16px base for isometric, 8px for orthogonal)
   b. Define named zones (header, gameplay, input, footer)
   c. SNAP points and alignment rules
   d. NUDGE increments for X, Y, and Z (height)
   e. Safe areas (notch: 44px top, 20px bottom)

2. Create grid utility with SNAP + NUDGE:

   interface GridPosition {
     gridX: number;      // Grid column
     gridY: number;      // Grid row
     nudgeX: number;     // Fine X offset (-1.0 to 1.0 grid units)
     nudgeY: number;     // Fine Y offset (-1.0 to 1.0 grid units)
     height: number;     // Z-axis height (-2.0 to 2.0 grid units)
   }

   Methods:
   - snapToGrid(worldX, worldY): GridPosition
   - nudge(pos, axis: 'x'|'y'|'height', delta): GridPosition
   - setHeight(pos, height): GridPosition
   - gridToWorld(pos): {x, y} // Converts grid+nudge+height to screen coords
   - worldToGrid(x, y): GridPosition
   - getZone(pos): ZoneName
   - placeComponent(componentId, pos): void

3. Height calculation for visual depth:
   - Height affects Y position (higher = moves up on screen)
   - Height affects render order (higher = rendered on top)
   - Height affects shadow offset (if shadows enabled)

   heightToScreenOffset(height: number): number {
     // Each height unit moves component up by X pixels
     return height * 12; // Adjustable constant
   }

4. Responsive rules:
   a. How components reflow when neighbors removed
   b. Priority order for space claiming
   c. Minimum/maximum constraints per zone
   d. Height constraints per zone (gameplay allows full range, header/footer restricted)

5. Debug visualization:
   a. Grid overlay toggle
   b. Height indicators (color-coded: red=low, white=neutral, blue=high)
   c. Snap points visible
   d. Zone boundaries

OUTPUT FILES:
- wordrun-rebuild/src/grid/GridSystem.ts
- wordrun-rebuild/src/grid/GridConfig.ts
- wordrun-rebuild/src/grid/types.ts
- wordrun-rebuild/docs/GridSystem.md

CONSTRAINTS:
- Fresh implementation in wordrun-rebuild/
- All measurements in grid units, not raw pixels
- Include TypeScript types for all interfaces
- Grid debug overlay toggleable via config flag
- Height changes must not break component isolation
```

---

## Index Generation Prompts

### ComponentCatalog.html Generator (Gemini)

```
ROLE: Visual Catalog Designer

INPUT:
- Interpolated images: wordrun-rebuild/assets/components/full/
- Thumbnails: wordrun-rebuild/assets/components/thumbnails/
- Interpolation logs: wordrun-rebuild/index/interpolation_log_*.json

TASK:
Create ComponentCatalog.html:
1. Grid layout of component thumbnails
2. Click thumbnail → modal with full image
3. Metadata: ID, Name, Category, Status
4. Filter by category (map/ui)
5. Filter by status (clean/interpolated/partial/failed)
6. Search by name
7. Show interpolation confidence score

STYLING:
- Clean, professional design
- Dark mode default
- Responsive grid
- No external dependencies (inline CSS/JS)

OUTPUT: wordrun-rebuild/index/ComponentCatalog.html
```

### components.json Generator (Codex)

```
ROLE: Data Structure Architect

INPUT:
- Interpolation logs: wordrun-rebuild/index/interpolation_log_*.json
- Instruction files: wordrun-rebuild/assets/components/instructions/*.json

TASK:
Create components.json combining all component data:
{
  "version": "1.0",
  "generated": "ISO-8601",
  "components": [
    {
      "id": "MAP-001",
      "name": "Grass Land Cube",
      "category": "map",
      "thumbnail": "assets/components/thumbnails/MAP-001.png",
      "fullImage": "assets/components/full/MAP-001.png",
      "dimensions": {"width": 64, "height": 48},
      "interpolationStatus": "interpolated",
      "confidence": 0.95,
      "codingApproach": "", // Blank - filled in Phase 2
      "gridPlacement": {
        "defaultZone": "gameplay",
        "snapToGrid": true,
        "allowHeightNudge": true
      }
    }
  ]
}

OUTPUT: wordrun-rebuild/index/components.json
```

---

## Summary: Agent Responsibilities

| Agent | Input | Output | Focus |
|-------|-------|--------|-------|
| A | Screenshots | raw/*.png + instructions/*.json | Extract only, document everything |
| A2 | raw/MAP-*.png + instructions | full/MAP-*.png + thumbnails | Fill 3D/isometric occlusions |
| A3 | raw/UI-*.png + instructions | full/UI-*.png + thumbnails | Fill simple UI shapes |
| B | Screen specs | GridSystem.ts + mockups | Snap + nudge (height) |
