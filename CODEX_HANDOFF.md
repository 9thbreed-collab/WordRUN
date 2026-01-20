# Codex CLI Handoff - WordRun Rebuild

## Project Goal
Rebuild the vanilla prototype (`wordrun-prototype-v1.html`) using the proper tech stack, keeping it **visually and functionally identical**.

## Required Tech Stack
- Phaser 3.90.0
- Vite 6.2.6
- TypeScript 5.8.3
- Tailwind CSS 3.4.18
- Supabase (supabase-js 2.79.0)
- Vitest 3.2.4
- phaser3-rex-plugins 1.80.16

## Current State

### Working Reference
`/Users/nathanielgiddens/WordRunProject/wordrun-prototype-v1.html` - Vanilla HTML/CSS/JS prototype that works correctly. Open in browser to see target.

### Rebuild Location
`/Users/nathanielgiddens/WordRunProject/wordrun-rebuild/` - Phaser/TypeScript rebuild (BROKEN)

### What's Wrong
1. **CSS rendering as text** - The CSS from `src/index.css` is appearing as visible text on the page instead of being applied as styles
2. **Layout broken** - Game container not positioned correctly
3. **Dev server runs** at `http://localhost:5175/` (run `npm run dev` in wordrun-rebuild/)

### Key Files
- `wordrun-rebuild/src/main.ts` - Phaser game init (looks correct)
- `wordrun-rebuild/src/scenes/GameplayScene.ts` - Main scene using DOM plugin (23,906 bytes)
- `wordrun-rebuild/src/index.css` - 489 lines of CSS with @tailwind directives + custom styles
- `wordrun-rebuild/index.html` - Basic HTML shell

## Root Cause (Suspected)
The `index.css` has all custom styles with 12-space indentation (copy-paste artifact). When Vite processes this with Tailwind, something is rendering the CSS as visible DOM text content instead of applying it.

## Fix Strategy

### Option 1: Clean CSS File
1. Remove extra indentation from `index.css`
2. Ensure Tailwind config is correct
3. Test if CSS applies properly

### Option 2: Inline Styles in HTML Template
1. Move CSS into a `<style>` tag in the `index.html` head
2. Remove from `index.css` (keep only @tailwind directives)

### Option 3: Rebuild GameplayScene
1. Use the working vanilla prototype as direct reference
2. Create clean Phaser scene that uses DOM plugin correctly
3. Embed styles properly

## Commands
```bash
cd /Users/nathanielgiddens/WordRunProject/wordrun-rebuild
npm run dev  # Start dev server on port 5175
```

## DO NOT TOUCH
- `wordrun-vite/` - Separate project, leave alone

## Success Criteria
When `http://localhost:5175/` looks **identical** to opening `wordrun-prototype-v1.html` directly in browser:
- Same layout (word grid center, Ruut bottom-left, input below combo)
- Same colors (#1a1a2e dark bg, #FFB6C1 pink tiles, #4CAF50 green)
- Same 11 words: CAR, DOOR, STOP, SIGN, UP, START, BUTTON, NOSE, RING, BELL, TOWER
- Same combo/streak system
- Same Ruut reactions (wave, happy, sad)
- Same animations (<100ms feedback)

## Reference Screenshot
`.playwright-mcp/wordrun-rebuild-full.png` - Shows current broken state
