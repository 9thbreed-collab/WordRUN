#!/usr/bin/env python3
"""
Component Extraction Script for WordRun
Reads instruction files and extracts components from source images.
"""

import os
import json
from PIL import Image

# Paths
PROJECT_ROOT = "/Users/nathanielgiddens/WordRunProject"
SOURCE_DIR = f"{PROJECT_ROOT}/GameMapInspo"
INSTRUCTIONS_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/assets/components/instructions"
OUTPUT_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/assets/components/raw"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Track results
extracted = []
failed = []

# Get all instruction files
instruction_files = [f for f in os.listdir(INSTRUCTIONS_DIR) if f.endswith('.json')]
print(f"Found {len(instruction_files)} instruction files")

# Cache for opened images
image_cache = {}

def get_image(filename):
    """Load and cache source images."""
    if filename not in image_cache:
        # Try different extensions
        for ext in ['', '.png', '.jpg', '.jpeg']:
            path = f"{SOURCE_DIR}/{filename}{ext}" if not filename.endswith(('.png', '.jpg', '.jpeg')) else f"{SOURCE_DIR}/{filename}"
            if os.path.exists(path):
                image_cache[filename] = Image.open(path)
                print(f"  Loaded: {path}")
                break
        else:
            # Try without extension variations
            for f in os.listdir(SOURCE_DIR):
                if f.lower().startswith(filename.lower().replace('.png','').replace('.jpg','')):
                    path = f"{SOURCE_DIR}/{f}"
                    image_cache[filename] = Image.open(path)
                    print(f"  Loaded: {path}")
                    break
    return image_cache.get(filename)

# Process each instruction file
for filename in sorted(instruction_files):
    filepath = f"{INSTRUCTIONS_DIR}/{filename}"

    try:
        with open(filepath, 'r') as f:
            instruction = json.load(f)

        component_id = instruction['componentId']
        dims = instruction.get('dimensions', {'width': 64, 'height': 64})

        # Get source from referenceImages array
        ref_images = instruction.get('referenceImages', [])
        if not ref_images:
            print(f"SKIP {component_id}: No reference images")
            failed.append(component_id)
            continue

        # Use first reference image
        ref = ref_images[0]
        source_file = ref.get('source', 'Map1.png')
        coords = ref.get('coords', {'x': 0, 'y': 0})

        # Load source image
        img = get_image(source_file)
        if img is None:
            print(f"FAIL {component_id}: Could not load {source_file}")
            failed.append(component_id)
            continue

        # Calculate crop box
        left = coords['x']
        top = coords['y']
        right = left + dims['width']
        bottom = top + dims['height']

        # Ensure bounds are within image
        img_width, img_height = img.size
        if right > img_width or bottom > img_height:
            print(f"WARN {component_id}: Crop extends beyond image, adjusting...")
            right = min(right, img_width)
            bottom = min(bottom, img_height)

        # Crop
        cropped = img.crop((left, top, right, bottom))

        # Save
        output_path = f"{OUTPUT_DIR}/{component_id}.png"
        cropped.save(output_path, 'PNG')
        print(f"OK   {component_id}: {dims['width']}x{dims['height']} from {source_file}")
        extracted.append(component_id)

    except Exception as e:
        print(f"ERR  {component_id if 'component_id' in dir() else filename}: {e}")
        failed.append(filename)

# Summary
print(f"\n{'='*50}")
print(f"EXTRACTION COMPLETE")
print(f"  Extracted: {len(extracted)}")
print(f"  Failed: {len(failed)}")
if failed:
    print(f"  Failed IDs: {failed}")
print(f"{'='*50}")
