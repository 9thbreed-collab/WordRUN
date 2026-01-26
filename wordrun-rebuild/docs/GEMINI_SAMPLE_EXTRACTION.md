# Gemini Sample Extraction Prompt

## Instructions for Running

```bash
gemini -p "$(cat /Users/nathanielgiddens/WordRunProject/wordrun-rebuild/docs/GEMINI_SAMPLE_EXTRACTION.md)"
```

---

## PROMPT BEGIN

You are a Visual Component Extraction Specialist. This is a SAMPLE extraction to validate the methodology before full-scale extraction.

### TASK

Extract exactly **4 ground/terrain cube slices** from `Map1.png` and save them to a sample folder with full documentation.

**Source Image:** `/Users/nathanielgiddens/WordRunProject/GameMapInspo/Map1.png`

**Output Folder:** `/Users/nathanielgiddens/WordRunProject/wordrun-rebuild/assets/components/sample1/`

### THE CONCEPT

The map shows an isometric landmass - a 3D chunk of terrain. Your job is to slice this landmass into individual isometric cubes.

Each cube has a **top face** (the upward-facing surface, oriented on the Z-axis). This top face is a diamond/rhombus shape with 4 corners:

```
         North (top)
            ◆
           /│\
          / │ \
    West ◆──┼──◆ East
          \ │ /
           \│/
            ◆
         South (bottom)
```

### WHAT TO EXTRACT

Select 4 adjacent terrain cubes from the grassy area of Map1.png:
- 2 cubes in one row
- 2 cubes in the row below
- This forms a 2x2 grid sample

```
┌────┬────┐
│ S1 │ S2 │  ← Row 1
├────┼────┤
│ S3 │ S4 │  ← Row 2
└────┴────┘
```

### SIZE REFERENCE

Look at the **stone path segments** in the map. Use these as your reference for cube size. Each terrain cube should be approximately this size (can be slightly larger to ensure full coverage, but not smaller).

### OUTPUT FOR EACH CUBE

**1. Image File:**
`sample1/SAMPLE-[1-4].png`

Extract the cube as an image. Include the full isometric cube shape (top face + visible side faces).

**2. Metadata File:**
`sample1/SAMPLE-[1-4].json`

```json
{
  "sampleId": "SAMPLE-1",
  "sourceImage": "Map1.png",

  "topFaceCorners": {
    "north": { "x": ???, "y": ??? },
    "east": { "x": ???, "y": ??? },
    "south": { "x": ???, "y": ??? },
    "west": { "x": ???, "y": ??? }
  },

  "extractionBounds": {
    "x": ???,
    "y": ???,
    "width": ???,
    "height": ???
  },

  "cubeShape": "square|rectangle",
  "terrainType": "grass|path|water|etc",

  "needsInterpolation": true|false,
  "occlusionDetails": {
    "isOccluded": true|false,
    "occludedBy": "description of what covers part of this cube",
    "occludedFaces": ["left", "right", "front", "back"],
    "interpolationNeeded": "description of what needs to be filled in"
  },

  "adjacentSamples": {
    "north": "SAMPLE-X or null",
    "south": "SAMPLE-X or null",
    "east": "SAMPLE-X or null",
    "west": "SAMPLE-X or null"
  }
}
```

**3. Method Documentation:**
`sample1/METHOD.md`

Document your extraction process:

1. **Grid Identification**: How did you identify the isometric grid structure?
2. **Unit Size Determination**: How did you determine the cube size from the stone path?
3. **Corner Coordinate Calculation**: How did you calculate the 4 corners of each top face?
4. **Extraction Technique**: What technique did you use to extract the cube image?
5. **Occlusion Assessment**: How did you identify what parts are occluded?
6. **Interpolation Plan**: For occluded cubes, what would need to be filled in?

### INTERPOLATION

If any of the 4 sample cubes have parts hidden by trees, buildings, or other elements:
- Still extract what is visible
- Document exactly what is hidden
- Describe what the hidden area should look like based on surrounding context
- If you can interpolate (fill in) the hidden area, do so and note it

### VALIDATION CRITERIA

After extraction, these 4 cubes should:
1. Fit together with NO GAPS when placed adjacent
2. Have consistent corner angles (isometric perspective)
3. Be within the size range of the stone path segments
4. Have clear documentation of any occlusions

### TOOLS TO USE

Use Playwright browser tools:
1. Navigate to the image (use file:// URL or create a simple HTML viewer)
2. Take a snapshot to analyze the structure
3. Use browser_evaluate to measure coordinates
4. Use browser_take_screenshot with element clipping for extraction

Alternatively, describe what you would extract and I can use Python PIL to do the actual image extraction based on your coordinates.

### BEGIN

1. First, analyze Map1.png and describe the landmass structure you see
2. Identify the stone path segments and their approximate pixel dimensions
3. Select a 2x2 area of grass terrain cubes to extract
4. Document the corner coordinates for each cube's top face
5. Extract or describe extraction bounds for each cube
6. Note any occlusions and interpolation needs
7. Create the METHOD.md explaining your process

Start now with step 1 - analyze the image.
