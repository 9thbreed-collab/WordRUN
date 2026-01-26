# Gemini Visual Extraction Prompt

## Instructions for Running

```bash
gemini -p "$(cat /Users/nathanielgiddens/WordRunProject/wordrun-rebuild/docs/GEMINI_EXTRACTION_PROMPT.md)"
```

---

## PROMPT BEGIN

You are a Visual Component Extraction Specialist for an isometric game called WordRun.

### YOUR TASK

Analyze the map images in `/Users/nathanielgiddens/WordRunProject/GameMapInspo/` and extract visual components for use in a game engine.

**Source Images:**
- `Image.jpg`
- `Map1.png`
- `Map2.png`
- `Map3.png`

### CRITICAL CONCEPT: THE LANDMASS

The central visual in each map image is a **solid 3D cube-like landmass** floating in space. Think of it as a chunk of terrain - grass, ice, or volcanic rock - with depth, not just a flat surface.

Your job is to **slice this landmass into individual isometric cubes** that, when reassembled, perfectly reconstruct the entire landmass with NO GAPS.

```
THE LANDMASS (solid 3D mass)
         ┌─────────────────┐
        /                 /│
       /     TERRAIN     / │
      /                 /  │
     ┌─────────────────┐   │
     │ Slice into      │   │
     │ individual      │   /
     │ cubes           │  /
     │                 │ /
     └─────────────────┘

Each cube = one extracted component
All cubes together = complete landmass
```

### EXTRACTION RULES FOR TERRAIN CUBES

**1. Determine Base Unit Size**
- Look at the **stone path segments** on the map
- These define the reference unit size
- All terrain cubes should be within this size range

**2. Cube Shape Flexibility**
- Cubes can be **square-ish** (typical isometric diamond)
- Cubes can be **rectangular** (elongated) where needed
- Use rectangles to ensure full coverage of irregular areas
- Goal: Complete tessellation with NO GAPS

**3. Size Constraints**
- MINIMUM: No cube smaller than the smallest stone path segment
- MAXIMUM: No cube far exceeding the stone path segment range
- Keep sizes relatively consistent

**4. Full Coverage Required**
- Every visible part of the landmass must be covered by a cube
- No gaps, no overlaps (except where elevation changes)
- Think of it like a 3D puzzle - all pieces must fit perfectly

**5. Isometric Grid Awareness**
- X axis: Runs diagonally (lower-left to upper-right typically)
- Y axis: Runs diagonally (lower-right to upper-left typically)
- Z axis: Vertical height/elevation
- Cubes at different Z levels may partially overlap visually

### EXTRACTION RULES FOR UNIQUE ELEMENTS

**Trees, Buildings, Decorations, Characters, UI Elements:**

1. Extract as **complete sprites** with transparency around them
2. Do NOT crop - capture the ENTIRE object
3. These sit ON TOP of terrain cubes, they are separate assets
4. Include all visual states if visible (e.g., locked/unlocked markers)

### OCCLUSION AND INTERPOLATION

When you slice the landmass, some cube faces will be **hidden/occluded** by:
- Trees standing in front
- Buildings overlapping
- Higher-elevation cubes blocking lower ones

**For each cube, document:**
- Which faces are fully visible
- Which faces are partially occluded
- What is occluding them
- What the hidden area likely looks like (texture continuation)

This information goes in the instruction file for interpolation agents (A2/A3) to fill in the hidden parts.

### OUTPUT STRUCTURE

**For each terrain cube:**
```
/wordrun-rebuild/assets/components/raw/TERRAIN-[MAP]-[ROW]-[COL].png
/wordrun-rebuild/assets/components/instructions/TERRAIN-[MAP]-[ROW]-[COL].json
```

**For each unique element:**
```
/wordrun-rebuild/assets/components/raw/[TYPE]-[ID].png
/wordrun-rebuild/assets/components/instructions/[TYPE]-[ID].json
```

Types: TREE, BUILDING, DECORATION, PATH, MARKER, UI

### INSTRUCTION FILE SCHEMA

```json
{
  "componentId": "TERRAIN-MAP1-R3-C5",
  "type": "terrain|tree|building|decoration|path|marker|ui",
  "sourceImage": "Map1.png",
  "gridPosition": {
    "row": 3,
    "col": 5,
    "zLevel": 0
  },
  "extractionBounds": {
    "x": 120,
    "y": 340,
    "width": 64,
    "height": 48
  },
  "isometricShape": "square|rectangle",
  "needsInterpolation": true,
  "occludedRegions": [
    {
      "face": "left|right|top|front|back",
      "occludedBy": "TREE-005",
      "percentageHidden": 40,
      "surroundingContext": "grass texture, continues from visible edge",
      "suggestedFill": "continue grass pattern with left-face shading"
    }
  ],
  "adjacentCubes": {
    "north": "TERRAIN-MAP1-R2-C5",
    "south": "TERRAIN-MAP1-R4-C5",
    "east": "TERRAIN-MAP1-R3-C6",
    "west": "TERRAIN-MAP1-R3-C4",
    "above": null,
    "below": null
  },
  "notes": "Base terrain cube, grass texture, standard elevation"
}
```

### PROCESS

1. **Analyze each map image** to understand the landmass structure
2. **Identify the grid** based on stone path segments
3. **Map out all terrain cubes** needed for full coverage
4. **Extract each terrain cube** as an isometric slice
5. **Extract each unique element** as a complete sprite
6. **Document occlusions** in instruction files for interpolation
7. **Verify full coverage** - no gaps in the landmass

### TOOLS

Use Playwright MCP tools for:
- `browser_navigate` - Open images
- `browser_snapshot` - Analyze visual content
- `browser_take_screenshot` - Extract components
- `browser_evaluate` - Manipulate canvas for precise extraction

Write files directly to the output directories.

### BEGIN

Start with `Map1.png`. Analyze the landmass structure, determine the grid, and begin systematic extraction.
