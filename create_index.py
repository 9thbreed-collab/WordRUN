#!/usr/bin/env python3
"""
Create thumbnails and index files for extracted components.
"""

import os
import json
from PIL import Image

# Paths
PROJECT_ROOT = "/Users/nathanielgiddens/WordRunProject"
RAW_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/assets/components/raw"
THUMB_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/assets/components/thumbnails"
INSTRUCTIONS_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/assets/components/instructions"
INDEX_DIR = f"{PROJECT_ROOT}/wordrun-rebuild/index"

os.makedirs(THUMB_DIR, exist_ok=True)

# 1. Create thumbnails
print("Creating thumbnails...")
for filename in os.listdir(RAW_DIR):
    if not filename.endswith('.png'):
        continue

    img = Image.open(f"{RAW_DIR}/{filename}")
    img.thumbnail((64, 64), Image.Resampling.LANCZOS)

    # Create 64x64 canvas and paste thumbnail centered
    thumb = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    offset = ((64 - img.width) // 2, (64 - img.height) // 2)
    thumb.paste(img, offset)

    thumb.save(f"{THUMB_DIR}/{filename}", 'PNG')
    print(f"  Thumbnail: {filename}")

# 2. Build components.json
print("\nBuilding components.json...")
components = []

for filename in sorted(os.listdir(INSTRUCTIONS_DIR)):
    if not filename.endswith('.json'):
        continue

    with open(f"{INSTRUCTIONS_DIR}/{filename}", 'r') as f:
        instr = json.load(f)

    component_id = instr['componentId']

    # Check if raw image exists
    raw_exists = os.path.exists(f"{RAW_DIR}/{component_id}.png")
    thumb_exists = os.path.exists(f"{THUMB_DIR}/{component_id}.png")

    components.append({
        "id": component_id,
        "name": instr.get('name', component_id),
        "category": instr.get('category', 'unknown'),
        "thumbnail": f"assets/components/thumbnails/{component_id}.png" if thumb_exists else None,
        "fullImage": f"assets/components/raw/{component_id}.png" if raw_exists else None,
        "dimensions": instr.get('dimensions', {}),
        "needsInterpolation": instr.get('needsInterpolation', False),
        "status": instr.get('status', 'unknown'),
        "notes": instr.get('notes', ''),
        "codingApproach": ""
    })

components_json = {
    "version": "1.0",
    "generated": "2026-01-22",
    "totalComponents": len(components),
    "components": components
}

with open(f"{INDEX_DIR}/components.json", 'w') as f:
    json.dump(components_json, f, indent=2)
print(f"  Saved: components.json ({len(components)} components)")

# 3. Create ComponentCatalog.html
print("\nBuilding ComponentCatalog.html...")

html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordRun Component Catalog</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            margin: 0;
            padding: 20px;
        }
        h1 { text-align: center; color: #fff; }
        .stats {
            text-align: center;
            margin-bottom: 20px;
            color: #888;
        }
        .filters {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .filters button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #333;
            color: #fff;
            cursor: pointer;
        }
        .filters button:hover, .filters button.active {
            background: #4a4a8a;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 15px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: #2a2a4e;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .card img {
            width: 64px;
            height: 64px;
            object-fit: contain;
            background: #1a1a2e;
            border-radius: 4px;
        }
        .card .id {
            font-size: 11px;
            color: #888;
            margin-top: 5px;
        }
        .card .name {
            font-size: 12px;
            color: #ccc;
            margin-top: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .card.needs-interp {
            border: 2px solid #f0a030;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal.active { display: flex; }
        .modal-content {
            background: #2a2a4e;
            padding: 20px;
            border-radius: 12px;
            max-width: 500px;
            text-align: center;
        }
        .modal-content img {
            max-width: 100%;
            background: #1a1a2e;
            border-radius: 8px;
        }
        .modal-content h3 { margin: 10px 0 5px; }
        .modal-content p { color: #888; font-size: 14px; margin: 5px 0; }
        .modal-content .close {
            margin-top: 15px;
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            background: #4a4a8a;
            color: #fff;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>WordRun Component Catalog</h1>
    <div class="stats">
        Total: <span id="total">0</span> |
        MAP: <span id="mapCount">0</span> |
        UI: <span id="uiCount">0</span> |
        Needs Interpolation: <span id="interpCount">0</span>
    </div>
    <div class="filters">
        <button onclick="filter('all')" class="active">All</button>
        <button onclick="filter('map')">MAP</button>
        <button onclick="filter('ui')">UI</button>
        <button onclick="filter('interp')">Needs Interpolation</button>
    </div>
    <div class="grid" id="grid"></div>

    <div class="modal" id="modal" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
            <img id="modalImg" src="">
            <h3 id="modalName"></h3>
            <p id="modalId"></p>
            <p id="modalDims"></p>
            <p id="modalNotes"></p>
            <button class="close" onclick="closeModal()">Close</button>
        </div>
    </div>

    <script>
        let components = [];

        fetch('components.json')
            .then(r => r.json())
            .then(data => {
                components = data.components;
                document.getElementById('total').textContent = components.length;
                document.getElementById('mapCount').textContent = components.filter(c => c.category === 'map').length;
                document.getElementById('uiCount').textContent = components.filter(c => c.category === 'ui').length;
                document.getElementById('interpCount').textContent = components.filter(c => c.needsInterpolation).length;
                render(components);
            });

        function render(items) {
            const grid = document.getElementById('grid');
            grid.innerHTML = items.map(c => `
                <div class="card ${c.needsInterpolation ? 'needs-interp' : ''}" onclick="showModal('${c.id}')">
                    <img src="../${c.thumbnail}" alt="${c.name}">
                    <div class="id">${c.id}</div>
                    <div class="name">${c.name}</div>
                </div>
            `).join('');
        }

        function filter(type) {
            document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');

            if (type === 'all') render(components);
            else if (type === 'map') render(components.filter(c => c.category === 'map'));
            else if (type === 'ui') render(components.filter(c => c.category === 'ui'));
            else if (type === 'interp') render(components.filter(c => c.needsInterpolation));
        }

        function showModal(id) {
            const c = components.find(x => x.id === id);
            if (!c) return;
            document.getElementById('modalImg').src = '../' + c.fullImage;
            document.getElementById('modalName').textContent = c.name;
            document.getElementById('modalId').textContent = c.id + ' | ' + c.category;
            document.getElementById('modalDims').textContent = c.dimensions ? `${c.dimensions.width}x${c.dimensions.height}` : '';
            document.getElementById('modalNotes').textContent = c.notes || '';
            document.getElementById('modal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }
    </script>
</body>
</html>'''

with open(f"{INDEX_DIR}/ComponentCatalog.html", 'w') as f:
    f.write(html)
print("  Saved: ComponentCatalog.html")

print("\n" + "="*50)
print("INDEX CREATION COMPLETE")
print(f"  Thumbnails: {THUMB_DIR}")
print(f"  components.json: {INDEX_DIR}/components.json")
print(f"  ComponentCatalog.html: {INDEX_DIR}/ComponentCatalog.html")
print("="*50)
print("\nView catalog at: http://localhost:5176/index/ComponentCatalog.html")
