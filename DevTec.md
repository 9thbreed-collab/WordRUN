# Mobile Game Development Best Practices for WordRun
**A Comprehensive Guide for Phaser 3 + Vite + TypeScript Word-Puzzle Games**

## Table of Contents
1. [Asset Optimization](#1-asset-optimization)
2. [Performance Optimization](#2-performance-optimization)
3. [Visual Polish Techniques](#3-visual-polish-techniques)
4. [Code Architecture](#4-code-architecture)
5. [Mobile-Specific Considerations](#5-mobile-specific-considerations)
6. [Build and Bundle Optimization](#6-build-and-bundle-optimization)
7. [Professional Aesthetics](#7-professional-aesthetics)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Asset Optimization

### 1.1 Texture Atlases vs Individual Images

**CRITICAL: Always Use Texture Atlases**

For WordRun's 3,000 levels and 120 themed lands, texture atlases are essential:

**Benefits:**
- **Memory Savings**: Texture atlases remove wasted white-space between sprites, reducing RAM usage by 40-60%
- **Performance**: WebGL only needs to bind textures once per atlas instead of per-sprite, dramatically improving frame rates
- **Network**: Reduces HTTP requests from hundreds to just a few files
- **GPU Efficiency**: Power-of-two texture dimensions prevent GPU memory waste

**Current Issue:**
Your project has individual PNGs in `/public/assets/ui/3d_style/` and `/pixel_style/`. These should be combined into atlases.

**Recommended Tools:**
- **TexturePacker** (industry standard, supports compression)
- **Free Texture Packer** (open source)
- **Shoebox** (free, simple)

**Implementation:**

```typescript
// src/scenes/Preloader.ts
export class Preloader extends Phaser.Scene {
  preload() {
    // Load UI atlas per theme
    this.load.atlas('ui_3d',
      'assets/atlases/ui_3d.png',
      'assets/atlases/ui_3d.json'
    );

    this.load.atlas('ui_pixel',
      'assets/atlases/ui_pixel.png',
      'assets/atlases/ui_pixel.json'
    );

    // Load ruut cosmetics atlas
    this.load.atlas('ruut_skins',
      'assets/atlases/ruut_skins.png',
      'assets/atlases/ruut_skins.json'
    );

    // Per-land atlases (lazy loaded)
    // Don't load these in Preloader - see 1.5
  }
}

// Usage in scenes
const container = this.add.image(x, y, 'ui_3d', 'container_3d.png');
```

**Texture Compression:**
For mobile, use compressed texture formats:
- **iOS**: PVRTC or ASTC
- **Android**: ETC2 or ASTC
- **Fallback**: PNG with high compression

Tools: PVRTexTool, ASTC Encoder, Basis Universal (supports multiple formats from single source)

### 1.2 Font Loading Strategies

**Current Setup Analysis:**
You have two fonts: `retro-pixel-arcade.otf.woff2` and `supercell-magic_0.ttf`

**Problems:**
1. Font files block initial render
2. DOM text and Canvas text have different loading patterns
3. Fonts in wrong directory (`/fronts/` should be `/fonts/`)

**Recommended Strategy:**

```css
/* src/style.css */
@font-face {
  font-family: 'RetroPixel';
  src: url('/assets/fonts/retro-pixel-arcade.woff2') format('woff2');
  font-display: swap; /* Prevents FOIT (Flash of Invisible Text) */
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'SupercellMagic';
  src: url('/assets/fonts/supercell-magic.woff2') format('woff2');
  font-display: swap;
  font-weight: normal;
  font-style: normal;
}

/* Preload critical fonts */
body::after {
  content: '';
  font-family: 'RetroPixel', 'SupercellMagic';
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
```

**For Phaser Canvas Text:**

```typescript
// Preload fonts before using them in Phaser
export class Preloader extends Phaser.Scene {
  preload() {
    // Use WebFont Loader or simple promise
    this.load.script('webfont',
      'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js'
    );
  }

  create() {
    if (typeof WebFont !== 'undefined') {
      WebFont.load({
        custom: {
          families: ['RetroPixel', 'SupercellMagic']
        },
        active: () => {
          this.scene.start('TitleScreen');
        }
      });
    }
  }
}
```

**Alternative: Bitmap Fonts**
For retro pixel fonts, convert to bitmap fonts for better performance:

```typescript
// Generate once, use everywhere
this.load.bitmapFont('pixel',
  'assets/fonts/pixel.png',
  'assets/fonts/pixel.xml'
);

// Usage (much faster than DOM text)
this.add.bitmapText(x, y, 'pixel', 'SCORE: 1000', 24);
```

### 1.3 Audio Compression and Lazy Loading

**Format Strategy:**
- **Primary**: WebM (Opus codec) - best compression, supported by modern browsers
- **Fallback**: MP3 (AAC) - for older iOS devices
- **Never**: WAV or uncompressed formats

**Compression Settings:**
```bash
# Convert audio files
ffmpeg -i input.wav -c:a libopus -b:a 48k output.webm  # Music
ffmpeg -i sfx.wav -c:a libopus -b:a 32k sfx.webm       # Sound effects
```

**Lazy Loading Pattern:**

```typescript
// src/services/AudioManager.ts
export class AudioManager {
  private scene: Phaser.Scene;
  private loadedGroups = new Set<string>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  async loadLandAudio(landId: number): Promise<void> {
    const key = `land_${landId}`;
    if (this.loadedGroups.has(key)) return;

    return new Promise((resolve) => {
      this.scene.load.once('complete', () => {
        this.loadedGroups.add(key);
        resolve();
      });

      // Load land-specific audio
      this.scene.load.audio(`music_${landId}`, [
        `assets/audio/lands/${landId}/music.webm`,
        `assets/audio/lands/${landId}/music.mp3`
      ]);

      this.scene.load.audio(`sfx_correct_${landId}`, [
        `assets/audio/lands/${landId}/correct.webm`,
        `assets/audio/lands/${landId}/correct.mp3`
      ]);

      this.scene.load.start();
    });
  }

  unloadLandAudio(landId: number): void {
    const key = `land_${landId}`;
    this.scene.cache.audio.remove(`music_${landId}`);
    this.scene.cache.audio.remove(`sfx_correct_${landId}`);
    this.loadedGroups.delete(key);
  }
}
```

**Audio Sprites:**
For sound effects, use audio sprites to reduce HTTP requests:

```typescript
this.load.audioSprite('sfx',
  'assets/audio/sfx-sprite.json',
  ['assets/audio/sfx-sprite.webm', 'assets/audio/sfx-sprite.mp3']
);

// Usage
this.sound.playAudioSprite('sfx', 'correct');
this.sound.playAudioSprite('sfx', 'wrong');
this.sound.playAudioSprite('sfx', 'combo');
```

### 1.4 Asset Preloading vs On-Demand Loading

**Strategy for 3,000 Levels:**

**Preload (in Preloader scene):**
- Core UI elements (used in all scenes)
- Title screen graphics
- Loading screen graphics
- Critical fonts
- Core sound effects (click, error)
- First land assets (Land 1)

**On-Demand (per land):**
- Land-specific backgrounds
- Land-specific music
- Land-specific particle effects
- Character skins for that land

**On-Demand (per level):**
- Level-specific backgrounds (if any)
- Boss fight graphics (if applicable)

**Implementation:**

```typescript
// src/services/AssetManager.ts
export class AssetManager {
  private static instance: AssetManager;
  private loadedLands = new Set<number>();
  private currentLand: number | null = null;

  static getInstance(): AssetManager {
    if (!this.instance) this.instance = new AssetManager();
    return this.instance;
  }

  async loadLand(scene: Phaser.Scene, landId: number): Promise<void> {
    if (this.loadedLands.has(landId)) return;

    // Unload previous land if memory constrained
    if (this.currentLand !== null && this.currentLand !== landId) {
      await this.unloadLand(scene, this.currentLand);
    }

    return new Promise((resolve) => {
      scene.load.once('complete', () => {
        this.loadedLands.add(landId);
        this.currentLand = landId;
        resolve();
      });

      const landMeta = getLandMeta(landId);

      // Load land-specific assets
      scene.load.image(`bg_${landId}`, `assets/lands/${landId}/background.png`);
      scene.load.atlas(`particles_${landId}`,
        `assets/lands/${landId}/particles.png`,
        `assets/lands/${landId}/particles.json`
      );

      // Load audio (see 1.3)
      scene.load.audio(`music_${landId}`, [
        `assets/audio/lands/${landId}/music.webm`,
        `assets/audio/lands/${landId}/music.mp3`
      ]);

      scene.load.start();
    });
  }

  async unloadLand(scene: Phaser.Scene, landId: number): Promise<void> {
    scene.textures.remove(`bg_${landId}`);
    scene.textures.remove(`particles_${landId}`);
    scene.cache.audio.remove(`music_${landId}`);
    this.loadedLands.delete(landId);
  }
}
```

**Progressive Loading Pattern:**

```typescript
// Load next land in background while playing current
export class GameplayScene extends Phaser.Scene {
  private preloadNextLand(): void {
    const currentLand = this.getCurrentLand();
    const nextLand = currentLand + 1;

    if (nextLand <= 120) {
      // Load in background (low priority)
      setTimeout(() => {
        AssetManager.getInstance().loadLand(this, nextLand);
      }, 5000); // Wait 5 seconds after level starts
    }
  }
}
```

### 1.5 Memory Budget for 3,000 Levels

**Target Memory Budget:**
- **Low-end devices** (iPhone SE, budget Android): 150-200 MB
- **Mid-range devices**: 300-400 MB
- **High-end devices**: 500+ MB

**Current Concerns:**
Your 4,539-line GameplayScene likely holds references to all DOM elements and game objects, causing memory leaks.

**Asset Memory Estimates:**
- Texture atlas (2048x2048 PNG): ~16 MB uncompressed in GPU
- Compressed texture: ~2-4 MB
- Audio (1 minute, compressed): ~1 MB
- Font (bitmap): ~512 KB

**Recommended Structure:**
- **Core assets**: 30 MB (UI, fonts, core animations)
- **Per-land assets**: 5-10 MB (background, particles, music)
- **Runtime memory**: 50-100 MB (game state, DOM, Phaser objects)
- **Buffer**: 50 MB for OS and browser

**Total**: ~150 MB for low-end devices

**Implementation - Land Groups:**

Instead of 120 individual lands, group them:

```typescript
// 120 lands → 12 groups of 10 lands each
const LANDS_PER_GROUP = 10;

export class AssetManager {
  async loadLandGroup(scene: Phaser.Scene, groupId: number): Promise<void> {
    const startLand = groupId * LANDS_PER_GROUP;
    const endLand = startLand + LANDS_PER_GROUP;

    // Load shared atlas for this group
    scene.load.atlas(`lands_group_${groupId}`,
      `assets/atlases/lands_${groupId}.png`,
      `assets/atlases/lands_${groupId}.json`
    );

    // Load shared music for group
    scene.load.audio(`music_group_${groupId}`, [
      `assets/audio/groups/${groupId}.webm`,
      `assets/audio/groups/${groupId}.mp3`
    ]);
  }
}
```

---

## 2. Performance Optimization

### 2.1 Phaser 3 Mobile Optimizations

**Critical Settings for Mobile:**

```typescript
// src/main.ts - Enhanced configuration
const game = new Phaser.Game({
  type: Phaser.WEBGL, // Force WebGL for better performance
  parent: 'game-container',
  backgroundColor: '#0e0e12',
  width: 390,
  height: 844,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    expandParent: true,
  },

  dom: { createContainer: true },

  // MOBILE PERFORMANCE SETTINGS
  render: {
    antialias: false, // Disable for mobile (huge perf boost)
    pixelArt: true,   // Enable if using pixel art
    roundPixels: true, // Prevents texture bleeding
    transparent: false,
    clearBeforeRender: true,
    powerPreference: 'high-performance', // Request high-performance GPU
    batchSize: 4096, // Increase batch size for more sprites
  },

  physics: {
    default: 'arcade', // Only if you need physics
    arcade: {
      debug: false,
      fps: 60, // Match display refresh rate
    }
  },

  fps: {
    target: 60,
    forceSetTimeOut: false, // Use requestAnimationFrame
    min: 30, // Minimum acceptable FPS
    smoothStep: true, // Smooth frame delta
  },

  // Disable features you don't need
  disableContextMenu: true,

  scene: SCENES,
});
```

**Phaser 3.60+ Mobile Pipeline:**

According to recent benchmarks, Phaser 3.60+ achieved a **187% performance increase** on iPhone SE using the new Mobile Pipeline. Ensure you're using Phaser 3.90.0 optimizations:

```typescript
// The new Mobile Pipeline automatically optimizes texture binding
// No additional code needed - just ensure you're on 3.90.0
```

**Object Pooling:**

Your current implementation likely creates/destroys objects frequently, causing garbage collection pauses.

```typescript
// src/gameplay/ObjectPool.ts
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    // Pre-allocate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Usage for particle effects
export class GameplayScene extends Phaser.Scene {
  private particlePool: ObjectPool<Phaser.GameObjects.Sprite>;

  create() {
    this.particlePool = new ObjectPool(
      () => this.add.sprite(0, 0, 'particles', 'star'),
      (sprite) => {
        sprite.setVisible(false);
        sprite.setActive(false);
        sprite.setPosition(0, 0);
      },
      50 // Pool 50 particles
    );
  }

  showCorrectEffect(x: number, y: number): void {
    const particle = this.particlePool.acquire();
    particle.setPosition(x, y);
    particle.setVisible(true);
    particle.setActive(true);

    // Animate and return to pool
    this.tweens.add({
      targets: particle,
      alpha: 0,
      y: y - 50,
      duration: 500,
      onComplete: () => {
        this.particlePool.release(particle);
      }
    });
  }
}
```

### 2.2 DOM vs Canvas Rendering Trade-offs

**Current Setup:**
WordRun heavily uses DOM elements (`mountDom`, `basicColumn`), which has trade-offs.

**Performance Comparison:**

| Feature | DOM | Canvas (Phaser) | Winner |
|---------|-----|-----------------|--------|
| Text rendering | Fast | Slower | DOM |
| Animations (few elements) | Good | Excellent | Canvas |
| Animations (many elements) | Poor | Excellent | Canvas |
| Input (buttons, text fields) | Native | Manual | DOM |
| Accessibility | Excellent | Poor | DOM |
| Memory | Higher | Lower | Canvas |
| Battery (static) | Better | Worse | DOM |
| Battery (animated) | Worse | Better | Canvas |

**Recommended Strategy for WordRun:**

**Use DOM for:**
- Word input boxes (accessibility, native keyboard)
- Static UI (settings, menus)
- Text-heavy content (rules, tutorials)
- Form elements

**Use Canvas for:**
- Animated elements (combo bar, score animations)
- Particle effects
- Ruut character
- Background and decorative elements
- Transitions

**Hybrid Optimization:**

```typescript
// src/scenes/GameplayScene.ts
export class GameplayScene extends Phaser.Scene {
  private wordBoxContainer: HTMLElement;
  private comboBarGraphics: Phaser.GameObjects.Graphics;

  create() {
    // DOM for word input (accessibility, native feel)
    this.wordBoxContainer = this.createWordBoxDOM();

    // Canvas for combo bar (smooth animations)
    this.comboBarGraphics = this.add.graphics();

    // Ruut character in Canvas (animated sprite)
    this.ruut = this.add.sprite(x, y, 'ruut_skins', 'default_idle');
    this.ruut.setScale(0.57);
  }

  // Minimize DOM updates - batch them
  private updateWordBoxBatch(updates: Array<{index: number, char: string}>): void {
    // Use DocumentFragment for batched updates
    const fragment = document.createDocumentFragment();

    updates.forEach(({index, char}) => {
      const cell = this.cells[index].cloneNode(true) as HTMLElement;
      cell.textContent = char;
      fragment.appendChild(cell);
    });

    // Single DOM update
    requestAnimationFrame(() => {
      this.wordBoxContainer.innerHTML = '';
      this.wordBoxContainer.appendChild(fragment);
    });
  }
}
```

**Battery Life Optimization:**

```typescript
// Pause animations when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.scene.pause();
    this.sound.pauseAll();
  } else {
    this.scene.resume();
    this.sound.resumeAll();
  }
});

// Reduce update frequency on low battery
if ('getBattery' in navigator) {
  // @ts-ignore
  navigator.getBattery().then((battery) => {
    if (battery.level < 0.2) {
      // Reduce particle effects
      // Lower FPS target
      // Disable shadows
    }
  });
}
```

### 2.3 Memory Management for Long Play Sessions

**Critical Issue:**
Your 4,539-line GameplayScene likely has memory leaks from unreleased DOM elements and event listeners.

**Common Memory Leak Patterns:**

```typescript
// ❌ BAD - Memory leak
export class GameplayScene extends Phaser.Scene {
  private cells: HTMLSpanElement[] = [];

  create() {
    for (let i = 0; i < 11; i++) {
      const cell = document.createElement('span');
      cell.addEventListener('click', () => this.onCellClick(i));
      this.cells.push(cell);
      document.body.appendChild(cell);
    }
  }

  shutdown() {
    // Cells still in DOM and have event listeners!
    // Memory leak!
  }
}

// ✅ GOOD - Proper cleanup
export class GameplayScene extends Phaser.Scene {
  private cells: HTMLSpanElement[] = [];
  private cellContainer: HTMLElement | null = null;
  private cellClickHandlers: Map<HTMLElement, () => void> = new Map();

  create() {
    this.cellContainer = document.createElement('div');
    document.body.appendChild(this.cellContainer);

    for (let i = 0; i < 11; i++) {
      const cell = document.createElement('span');
      const handler = () => this.onCellClick(i);
      cell.addEventListener('click', handler);
      this.cellClickHandlers.set(cell, handler);
      this.cells.push(cell);
      this.cellContainer.appendChild(cell);
    }
  }

  shutdown() {
    // Remove event listeners
    this.cells.forEach(cell => {
      const handler = this.cellClickHandlers.get(cell);
      if (handler) {
        cell.removeEventListener('click', handler);
      }
    });
    this.cellClickHandlers.clear();

    // Remove DOM elements
    if (this.cellContainer && this.cellContainer.parentNode) {
      this.cellContainer.parentNode.removeChild(this.cellContainer);
    }

    // Clear references
    this.cells = [];
    this.cellContainer = null;
  }
}
```

**Automatic Cleanup Helper:**

```typescript
// src/utils/DOMManager.ts
export class DOMManager {
  private elements: Set<HTMLElement> = new Set();
  private listeners: Map<HTMLElement, Array<{event: string, handler: EventListener}>> = new Map();

  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    parent?: HTMLElement
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);
    this.elements.add(el);
    if (parent) parent.appendChild(el);
    return el;
  }

  addEventListener(
    element: HTMLElement,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);

    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    this.listeners.get(element)!.push({event, handler});
  }

  cleanup(): void {
    // Remove all event listeners
    this.listeners.forEach((handlers, element) => {
      handlers.forEach(({event, handler}) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();

    // Remove all elements from DOM
    this.elements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.elements.clear();
  }
}

// Usage
export class GameplayScene extends Phaser.Scene {
  private domManager: DOMManager;

  create() {
    this.domManager = new DOMManager();

    const button = this.domManager.createElement('button', document.body);
    this.domManager.addEventListener(button, 'click', () => this.onButtonClick());
  }

  shutdown() {
    this.domManager.cleanup();
  }
}
```

**Memory Profiling:**

```typescript
// src/dev/MemoryMonitor.ts
export class MemoryMonitor {
  private static logMemory(): void {
    if ('memory' in performance) {
      // @ts-ignore
      const memory = (performance as any).memory;
      console.log({
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      });
    }
  }

  static startMonitoring(interval = 10000): void {
    setInterval(() => this.logMemory(), interval);
  }
}

// In main.ts
if (GAME_CONFIG.dev.enabled) {
  MemoryMonitor.startMonitoring();
}
```

### 2.4 Scene Lifecycle Best Practices

**Scene States:**
- `init()` - Initialize data passed from previous scene
- `preload()` - Load assets
- `create()` - Set up game objects
- `update()` - Game loop (60 FPS)
- `shutdown()` - Clean up before leaving scene
- `destroy()` - Final cleanup

**Proper Lifecycle Implementation:**

```typescript
export class GameplayScene extends Phaser.Scene {
  private domManager?: DOMManager;
  private audioManager?: AudioManager;
  private ruut?: Phaser.GameObjects.Sprite;
  private landId?: number;

  init(data: {land: number, level: number}): void {
    // Store data, don't create objects yet
    this.landId = data.land;
    this.levelId = data.level;
  }

  preload(): void {
    // Load level-specific assets only
    // Don't load assets already in cache
    if (!this.textures.exists(`bg_${this.landId}`)) {
      AssetManager.getInstance().loadLand(this, this.landId!);
    }
  }

  create(): void {
    // Create objects
    this.domManager = new DOMManager();
    this.audioManager = new AudioManager(this);
    this.ruut = this.add.sprite(x, y, 'ruut_skins', 'default_idle');

    // Set up event listeners
    this.events.on('shutdown', this.onShutdown, this);
  }

  update(time: number, delta: number): void {
    // Minimize work in update loop
    // Use events instead of polling
  }

  private onShutdown(): void {
    // Clean up
    this.domManager?.cleanup();
    this.audioManager?.cleanup();

    // Remove event listeners
    this.events.off('shutdown', this.onShutdown, this);
  }

  destroy(): void {
    // Final cleanup
    super.destroy();
  }
}
```

**Parallel Scene Management:**

```typescript
// For UI overlays, use parallel scenes
export class GameplayScene extends Phaser.Scene {
  create() {
    // Launch UI scene in parallel
    this.scene.launch('GameplayUI', {
      onPause: () => this.handlePause(),
      onSettings: () => this.handleSettings(),
    });
  }

  shutdown() {
    // Stop parallel scenes
    this.scene.stop('GameplayUI');
  }
}

export class GameplayUIScene extends Phaser.Scene {
  private gameplayScene: GameplayScene;

  init(data: any) {
    this.gameplayScene = this.scene.get('GameplayScene') as GameplayScene;
  }

  create() {
    // Create UI in DOM (lightweight)
    // This scene handles all UI, keeping GameplayScene clean
  }
}
```

### 2.5 Preventing Memory Leaks with DOM Elements

**Checklist for Every Scene:**

```typescript
// src/scenes/BaseScene.ts - Extend this for all scenes
export abstract class BaseScene extends Phaser.Scene {
  protected domManager: DOMManager;
  protected timers: Phaser.Time.TimerEvent[] = [];
  protected tweens: Phaser.Tweens.Tween[] = [];

  constructor(key: string) {
    super(key);
    this.domManager = new DOMManager();
  }

  // Helper to create managed timers
  protected addTimer(config: Phaser.Types.Time.TimerEventConfig): Phaser.Time.TimerEvent {
    const timer = this.time.addEvent(config);
    this.timers.push(timer);
    return timer;
  }

  // Helper to create managed tweens
  protected addTween(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    const tween = this.tweens.add(config);
    this.tweens.push(tween);
    return tween;
  }

  shutdown(): void {
    // Clean up DOM
    this.domManager.cleanup();

    // Remove timers
    this.timers.forEach(timer => timer.remove());
    this.timers = [];

    // Stop tweens
    this.tweens.forEach(tween => tween.remove());
    this.tweens = [];

    super.shutdown();
  }
}

// All scenes extend BaseScene
export class GameplayScene extends BaseScene {
  constructor() {
    super('GameplayScene');
  }

  create() {
    // Use managed helpers
    const button = this.domManager.createElement('button', document.body);

    this.addTimer({
      delay: 1000,
      callback: () => this.updateCombo(),
      loop: true
    });

    this.addTween({
      targets: this.ruut,
      y: '+=10',
      yoyo: true,
      repeat: -1
    });
  }
}
```

---

## 3. Visual Polish Techniques

### 3.1 Modern Mobile Game UI/UX Patterns

**2025 Trends for Word Puzzle Games:**

1. **Gesture-Based Interactions**
   - Swipe to skip/undo
   - Pinch to zoom map
   - Long-press for hints

2. **Diegetic UI**
   - UI elements that feel part of the game world
   - No floating rectangles - integrate into theme

3. **Micro-Interactions**
   - Button press animations
   - Haptic feedback on correct/wrong words
   - Satisfying pop/bounce effects

4. **Dynamic Icons**
   - Animated UI elements
   - Icons that respond to state

**Implementation Examples:**

```typescript
// Gesture-based skip
export class GameplayScene extends Phaser.Scene {
  create() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - this.swipeStartX;

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          this.skipWord(); // Swipe right
        } else {
          this.undoWord(); // Swipe left
        }
      }
    });
  }
}

// Haptic feedback
export class HapticManager {
  static vibrate(pattern: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([30, 10, 30]);
          break;
      }
    }
  }

  static success(): void {
    navigator.vibrate([10, 30, 10]);
  }

  static error(): void {
    navigator.vibrate([50, 30, 50, 30, 50]);
  }
}

// Usage
onCorrectWord() {
  HapticManager.success();
  this.playCorrectAnimation();
}

onWrongWord() {
  HapticManager.error();
  this.playWrongAnimation();
}
```

**Diegetic UI Example:**

```typescript
// Instead of rectangular combo bar, use themed design
export class ComboBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  create(x: number, y: number, theme: string) {
    this.container = this.scene.add.container(x, y);

    // Use theme-appropriate visuals
    if (theme === 'ocean') {
      // Wave-shaped combo bar
      const wave = this.scene.add.graphics();
      wave.fillStyle(0x0066ff, 0.8);
      wave.fillPath();
      this.container.add(wave);
    } else if (theme === 'desert') {
      // Sand dune shaped bar
      // ...
    }
  }

  update(comboValue: number) {
    // Smooth animated fill
    this.scene.tweens.add({
      targets: this.fill,
      scaleX: comboValue,
      duration: 200,
      ease: 'Cubic.easeOut'
    });
  }
}
```

### 3.2 Particle Effects for Mobile

**Performance-Friendly Particle System:**

```typescript
// src/fx/ParticleManager.ts
export class ParticleManager {
  private scene: Phaser.Scene;
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createCorrectWordEffect(): void {
    const emitter = this.scene.add.particles(0, 0, 'particles', {
      frame: ['star', 'sparkle'],
      lifespan: 600,
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      quantity: 5, // Keep low for mobile
      maxParticles: 50, // Limit total particles
    });

    emitter.stop(); // Don't emit until needed
    this.emitters.set('correct', emitter);
  }

  playCorrectEffect(x: number, y: number): void {
    const emitter = this.emitters.get('correct');
    if (emitter) {
      emitter.setPosition(x, y);
      emitter.explode(10); // Burst effect
    }
  }

  cleanup(): void {
    this.emitters.forEach(emitter => emitter.destroy());
    this.emitters.clear();
  }
}
```

**Lightweight Effects Alternative:**

For even better performance, use tweens instead of particles:

```typescript
export class EffectsManager {
  private scene: Phaser.Scene;
  private pool: ObjectPool<Phaser.GameObjects.Sprite>;

  createStarBurst(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const star = this.pool.acquire();
      star.setPosition(x, y);
      star.setAlpha(1);
      star.setScale(0.3);

      const angle = (360 / count) * i;
      const radians = Phaser.Math.DegToRad(angle);
      const distance = 50;

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(radians) * distance,
        y: y + Math.sin(radians) * distance,
        alpha: 0,
        scale: 0.1,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.pool.release(star);
        }
      });
    }
  }
}
```

### 3.3 Transitions and Micro-Interactions

**Screen Transitions:**

```typescript
// src/fx/ScreenTransition.ts
export class ScreenTransition {
  static fadeOut(scene: Phaser.Scene, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      scene.cameras.main.fadeOut(duration, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', resolve);
    });
  }

  static fadeIn(scene: Phaser.Scene, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      scene.cameras.main.fadeIn(duration, 0, 0, 0);
      scene.cameras.main.once('camerafadeincomplete', resolve);
    });
  }

  static wipe(scene: Phaser.Scene, direction: 'left' | 'right' | 'up' | 'down'): Promise<void> {
    return new Promise((resolve) => {
      const {width, height} = scene.cameras.main;
      const rect = scene.add.rectangle(0, 0, width, height, 0x000000);
      rect.setOrigin(0, 0);
      rect.setDepth(1000);

      let startX = 0, startY = 0, endX = 0, endY = 0;

      switch (direction) {
        case 'right':
          startX = -width;
          endX = 0;
          break;
        case 'left':
          startX = width;
          endX = 0;
          break;
        case 'down':
          startY = -height;
          endY = 0;
          break;
        case 'up':
          startY = height;
          endY = 0;
          break;
      }

      rect.setPosition(startX, startY);

      scene.tweens.add({
        targets: rect,
        x: endX,
        y: endY,
        duration: 500,
        ease: 'Cubic.easeInOut',
        onComplete: () => {
          rect.destroy();
          resolve();
        }
      });
    });
  }
}

// Usage
async transitionToNextLevel() {
  await ScreenTransition.fadeOut(this);
  this.scene.start('GameplayScene', {land: 2, level: 1});
}
```

**Button Micro-Interactions:**

```typescript
// src/ui/Button.ts
export class Button {
  private sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, texture);
    this.sprite.setInteractive({cursor: 'pointer'});

    // Hover effect
    this.sprite.on('pointerover', () => {
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      });
    });

    this.sprite.on('pointerout', () => {
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 1.0,
        duration: 100,
        ease: 'Back.easeIn'
      });
    });

    // Press effect
    this.sprite.on('pointerdown', () => {
      HapticManager.vibrate('light');
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 0.95,
        duration: 50
      });
    });

    this.sprite.on('pointerup', () => {
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 1.05,
        duration: 50
      });
    });
  }

  onClick(callback: () => void): void {
    this.sprite.on('pointerup', callback);
  }
}
```

**Juice Effects:**

```typescript
// src/fx/Juice.ts
export class Juice {
  // Screen shake
  static shake(scene: Phaser.Scene, intensity = 5, duration = 100): void {
    scene.cameras.main.shake(duration, intensity / 1000);
  }

  // Flash effect
  static flash(scene: Phaser.Scene, color = 0xffffff, duration = 100): void {
    scene.cameras.main.flash(duration,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff
    );
  }

  // Zoom effect
  static zoom(scene: Phaser.Scene, target = 1.1, duration = 200): void {
    const camera = scene.cameras.main;
    scene.tweens.add({
      targets: camera,
      zoom: target,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  // Squash and stretch
  static squash(
    sprite: Phaser.GameObjects.Sprite,
    amount = 0.2,
    duration = 100
  ): void {
    const scene = sprite.scene;
    scene.tweens.add({
      targets: sprite,
      scaleY: 1 - amount,
      scaleX: 1 + amount,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
}

// Usage
onCorrectWord() {
  Juice.shake(this, 3, 100);
  Juice.flash(this, 0x00ff00, 100);
  HapticManager.success();
  this.particleManager.playCorrectEffect(x, y);
}

onWrongWord() {
  Juice.shake(this, 8, 200);
  Juice.flash(this, 0xff0000, 100);
  HapticManager.error();
}
```

### 3.4 Color Palettes for 120 Lands

**Dynamic Theming System:**

```typescript
// src/config/themes.ts
export interface ThemeColors {
  primary: number;
  secondary: number;
  accent: number;
  background: number;
  text: number;
  textSecondary: number;
  success: number;
  error: number;
}

export const LAND_THEMES: Record<number, ThemeColors> = {
  // Ocean theme (Lands 1-10)
  1: {
    primary: 0x0066ff,
    secondary: 0x00ccff,
    accent: 0xffaa00,
    background: 0x001f3f,
    text: 0xffffff,
    textSecondary: 0xcccccc,
    success: 0x00ff88,
    error: 0xff4444,
  },

  // Desert theme (Lands 11-20)
  11: {
    primary: 0xffaa00,
    secondary: 0xff6600,
    accent: 0x00ffff,
    background: 0x442200,
    text: 0xffffff,
    textSecondary: 0xccaa88,
    success: 0x88ff00,
    error: 0xff0000,
  },

  // ... (define themes for each group)
};

// Generate themes procedurally for variety
export function getThemeForLand(landId: number): ThemeColors {
  // Use predefined theme if exists
  if (LAND_THEMES[landId]) {
    return LAND_THEMES[landId];
  }

  // Otherwise generate from base theme
  const baseThemeId = Math.floor(landId / 10) * 10 + 1;
  const baseTheme = LAND_THEMES[baseThemeId];

  if (!baseTheme) {
    return LAND_THEMES[1]; // Fallback
  }

  // Shift hue slightly for variety
  const offset = landId % 10;
  return {
    ...baseTheme,
    primary: shiftHue(baseTheme.primary, offset * 10),
    secondary: shiftHue(baseTheme.secondary, offset * 10),
  };
}

function shiftHue(color: number, degrees: number): number {
  // Convert RGB to HSL, shift hue, convert back
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const hsl = rgbToHsl(r, g, b);
  hsl.h = (hsl.h + degrees) % 360;
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

  return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
}
```

**Applying Themes:**

```typescript
export class GameplayScene extends Phaser.Scene {
  private theme: ThemeColors;

  init(data: {land: number, level: number}) {
    this.theme = getThemeForLand(data.land);
  }

  create() {
    // Apply theme to background
    this.cameras.main.setBackgroundColor(this.theme.background);

    // Apply to UI elements
    this.comboBar.setFillStyle(this.theme.primary);

    // Apply to DOM elements
    document.documentElement.style.setProperty('--primary-color',
      `#${this.theme.primary.toString(16).padStart(6, '0')}`
    );
    document.documentElement.style.setProperty('--text-color',
      `#${this.theme.text.toString(16).padStart(6, '0')}`
    );
  }
}
```

### 3.5 Typography Best Practices

**Font Hierarchy:**

```typescript
// src/config/typography.ts
export const TYPOGRAPHY = {
  // Main heading (level complete, land names)
  h1: {
    font: 'SupercellMagic',
    size: 48,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
  },

  // Subheading (hints, labels)
  h2: {
    font: 'SupercellMagic',
    size: 32,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  },

  // Body text (words in game)
  body: {
    font: 'RetroPixel',
    size: 24,
    color: '#ffffff',
    stroke: 'none',
    strokeThickness: 0,
  },

  // UI labels (buttons, scores)
  label: {
    font: 'RetroPixel',
    size: 18,
    color: '#cccccc',
    stroke: 'none',
    strokeThickness: 0,
  },
};

// Helper function
export function createText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: keyof typeof TYPOGRAPHY
): Phaser.GameObjects.Text {
  const config = TYPOGRAPHY[style];

  return scene.add.text(x, y, text, {
    fontFamily: config.font,
    fontSize: config.size,
    color: config.color,
    stroke: config.stroke,
    strokeThickness: config.strokeThickness,
  });
}
```

**Readable Text on Mobile:**

```typescript
// Minimum font sizes for readability
const MIN_FONT_SIZE = 16; // 16px minimum for body text
const MIN_BUTTON_SIZE = 44; // 44px minimum touch target (iOS HIG)

// Contrast ratios (WCAG AA)
function hasGoodContrast(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // AA standard for normal text
}

// Adjust text size for screen size
function getResponsiveFontSize(baseFontSize: number): number {
  const screenWidth = window.innerWidth;
  const scaleFactor = Math.max(0.8, Math.min(1.2, screenWidth / 390));
  return Math.max(MIN_FONT_SIZE, baseFontSize * scaleFactor);
}
```

---

## 4. Code Architecture

### 4.1 Breaking Down Large Scene Files

**Current Problem:**
`GameplayScene.ts` is 4,539 lines - impossible to maintain.

**Component-Based Architecture:**

```
src/
  scenes/
    GameplayScene.ts (< 300 lines - orchestrator only)
  components/
    gameplay/
      WordBox.ts
      ComboBar.ts
      ScoreDisplay.ts
      HintSystem.ts
      RuutCharacter.ts
      PowerupInventory.ts
      Timer.ts
    ui/
      ProgressBar.ts
      Button.ts
      Modal.ts
  systems/
    InputSystem.ts
    ScoringSystem.ts
    ComboSystem.ts
    PowerupSystem.ts
```

**Example Refactor:**

```typescript
// src/components/gameplay/WordBox.ts
export class WordBox {
  private scene: Phaser.Scene;
  private container: HTMLElement;
  private slots: SlotState[] = [];
  private domManager: DOMManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.domManager = new DOMManager();
  }

  create(x: number, y: number, words: string[]): void {
    this.container = this.domManager.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    document.body.appendChild(this.container);

    this.setupSlots(words);
  }

  private setupSlots(words: string[]): void {
    words.forEach((word, index) => {
      const slot = this.createSlot(word);
      this.slots.push(slot);
      this.container.appendChild(slot.rowEl);
    });
  }

  private createSlot(word: string): SlotState {
    // Implementation
  }

  updateSlot(index: number, charIndex: number, char: string): void {
    const slot = this.slots[index];
    if (slot && slot.cells[charIndex]) {
      slot.cells[charIndex].textContent = char;
    }
  }

  destroy(): void {
    this.domManager.cleanup();
  }
}

// src/components/gameplay/ComboBar.ts
export class ComboBar {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private value: number = 0;
  private maxValue: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number, width: number, height: number): void {
    this.graphics = this.scene.add.graphics();
    this.graphics.setPosition(x, y);
    this.width = width;
    this.height = height;
  }

  setValue(value: number): void {
    this.value = Phaser.Math.Clamp(value, 0, this.maxValue);
    this.render();
  }

  private render(): void {
    this.graphics.clear();

    // Background
    this.graphics.fillStyle(0x333333, 0.8);
    this.graphics.fillRoundedRect(0, 0, this.width, this.height, 8);

    // Fill
    const fillWidth = (this.value / this.maxValue) * this.width;
    const color = this.getColorForValue(this.value);
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(2, 2, fillWidth - 4, this.height - 4, 6);
  }

  private getColorForValue(value: number): number {
    if (value < 0.4) return 0xff4444;
    if (value < 0.65) return 0xffaa00;
    if (value < 0.8) return 0x00ff88;
    return 0x00ffff;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

// src/systems/ComboSystem.ts
export class ComboSystem {
  private value: number = COMBO_MIN;
  private drainRate: number = DRAIN_T1;
  private lastUpdate: number = 0;

  update(time: number, delta: number): void {
    if (time - this.lastUpdate > 100) {
      this.value = Math.max(COMBO_MIN, this.value - (this.drainRate * delta / 1000));
      this.lastUpdate = time;
    }
  }

  boost(amount: number): void {
    this.value = Math.min(COMBO_MAX, this.value + amount);
    this.updateDrainRate();
  }

  private updateDrainRate(): void {
    if (this.value < T1) this.drainRate = DRAIN_T1;
    else if (this.value < T2) this.drainRate = DRAIN_T2;
    else if (this.value < T3) this.drainRate = DRAIN_T3;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.value = COMBO_MIN;
    this.drainRate = DRAIN_T1;
  }
}

// src/scenes/GameplayScene.ts (Refactored - now < 300 lines)
import { WordBox } from '../components/gameplay/WordBox';
import { ComboBar } from '../components/gameplay/ComboBar';
import { ComboSystem } from '../systems/ComboSystem';
import { ScoringSystem } from '../systems/ScoringSystem';

export class GameplayScene extends Phaser.Scene {
  private wordBox!: WordBox;
  private comboBar!: ComboBar;
  private comboSystem!: ComboSystem;
  private scoringSystem!: ScoringSystem;

  create() {
    // Initialize components
    this.wordBox = new WordBox(this);
    this.wordBox.create(100, 200, this.currentWords);

    this.comboBar = new ComboBar(this);
    this.comboBar.create(50, 100, 300, 20);

    // Initialize systems
    this.comboSystem = new ComboSystem();
    this.scoringSystem = new ScoringSystem();

    // Set up event listeners
    this.events.on('correct-word', this.onCorrectWord, this);
  }

  update(time: number, delta: number) {
    // Update systems
    this.comboSystem.update(time, delta);
    this.comboBar.setValue(this.comboSystem.getValue());
  }

  private onCorrectWord(): void {
    this.comboSystem.boost(0.1);
    const points = this.scoringSystem.calculatePoints(this.comboSystem.getValue());
    this.scoringSystem.addScore(points);
  }

  shutdown() {
    // Clean up components
    this.wordBox.destroy();
    this.comboBar.destroy();

    // Remove listeners
    this.events.off('correct-word', this.onCorrectWord, this);
  }
}
```

### 4.2 Component-Based Architecture Pattern

**Base Component Class:**

```typescript
// src/components/Component.ts
export abstract class Component {
  protected scene: Phaser.Scene;
  protected destroyed: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  abstract create(...args: any[]): void;
  abstract destroy(): void;

  update?(time: number, delta: number): void;
}

// Usage
export class RuutCharacter extends Component {
  private sprite?: Phaser.GameObjects.Sprite;
  private currentAnimation: string = 'idle';

  create(x: number, y: number, skinId: string): void {
    this.sprite = this.scene.add.sprite(x, y, 'ruut_skins', `${skinId}_idle`);
    this.sprite.setScale(0.57);
    this.playAnimation('idle');
  }

  playAnimation(animName: string): void {
    if (this.currentAnimation === animName) return;

    this.currentAnimation = animName;
    this.sprite?.play(`ruut_${animName}`);
  }

  celebrate(): void {
    this.playAnimation('celebrate');
    this.scene.time.delayedCall(1000, () => {
      this.playAnimation('idle');
    });
  }

  destroy(): void {
    this.sprite?.destroy();
    this.destroyed = true;
  }
}
```

### 4.3 State Management Patterns

**Event-Driven State Management:**

```typescript
// src/state/GameState.ts
export class GameState extends Phaser.Events.EventEmitter {
  private static instance: GameState;

  private _score: number = 0;
  private _combo: number = 0;
  private _level: number = 1;
  private _lives: number = 3;

  static getInstance(): GameState {
    if (!this.instance) this.instance = new GameState();
    return this.instance;
  }

  get score(): number { return this._score; }
  set score(value: number) {
    const oldValue = this._score;
    this._score = value;
    this.emit('score-changed', value, oldValue);
  }

  get combo(): number { return this._combo; }
  set combo(value: number) {
    const oldValue = this._combo;
    this._combo = Phaser.Math.Clamp(value, 0, 1);
    this.emit('combo-changed', value, oldValue);
  }

  get level(): number { return this._level; }
  set level(value: number) {
    const oldValue = this._level;
    this._level = value;
    this.emit('level-changed', value, oldValue);
  }

  get lives(): number { return this._lives; }
  set lives(value: number) {
    const oldValue = this._lives;
    this._lives = Math.max(0, value);
    this.emit('lives-changed', value, oldValue);

    if (this._lives === 0) {
      this.emit('game-over');
    }
  }

  reset(): void {
    this._score = 0;
    this._combo = 0;
    this._level = 1;
    this._lives = 3;
    this.emit('reset');
  }
}

// Usage in components
export class ScoreDisplay extends Component {
  private text?: Phaser.GameObjects.Text;

  create(x: number, y: number): void {
    this.text = this.scene.add.text(x, y, '0', {
      fontSize: '32px',
      color: '#ffffff'
    });

    // Listen to state changes
    GameState.getInstance().on('score-changed', this.onScoreChanged, this);
  }

  private onScoreChanged(newScore: number): void {
    this.text?.setText(newScore.toString());

    // Animate
    this.scene.tweens.add({
      targets: this.text,
      scale: 1.2,
      duration: 100,
      yoyo: true
    });
  }

  destroy(): void {
    GameState.getInstance().off('score-changed', this.onScoreChanged, this);
    this.text?.destroy();
  }
}
```

### 4.4 Service Layer Organization

**Service Pattern:**

```typescript
// src/services/ProgressService.ts
export class ProgressService {
  private static instance: ProgressService;
  private supabase = createClient(/* ... */);

  static getInstance(): ProgressService {
    if (!this.instance) this.instance = new ProgressService();
    return this.instance;
  }

  async saveProgress(userId: string, landId: number, levelId: number, score: number): Promise<void> {
    await this.supabase
      .from('progress')
      .upsert({
        user_id: userId,
        land_id: landId,
        level_id: levelId,
        score: score,
        completed_at: new Date().toISOString(),
      });
  }

  async getProgress(userId: string): Promise<UserProgress> {
    const { data } = await this.supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId);

    return this.parseProgress(data);
  }

  async getLeaderboard(landId: number, limit = 10): Promise<LeaderboardEntry[]> {
    const { data } = await this.supabase
      .from('leaderboard')
      .select('*')
      .eq('land_id', landId)
      .order('score', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

// src/services/AnalyticsService.ts
export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!this.instance) this.instance = new AnalyticsService();
    return this.instance;
  }

  trackLevelStart(landId: number, levelId: number): void {
    // Track with your analytics provider
    console.log('Level Start', { landId, levelId });
  }

  trackLevelComplete(landId: number, levelId: number, score: number, time: number): void {
    console.log('Level Complete', { landId, levelId, score, time });
  }

  trackError(error: Error, context: any): void {
    console.error('Error tracked', error, context);
  }
}
```

---

## 5. Mobile-Specific Considerations

### 5.1 Touch Input Optimization

**Touch Target Sizes:**

```typescript
// Minimum touch target: 44x44px (iOS HIG)
// Recommended: 48x48px (Material Design)

export class TouchButton {
  private hitArea: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    const sprite = scene.add.sprite(x, y, texture);

    // Ensure minimum touch area
    const minSize = 44;
    const width = Math.max(sprite.width, minSize);
    const height = Math.max(sprite.height, minSize);

    this.hitArea = new Phaser.Geom.Rectangle(
      -width / 2,
      -height / 2,
      width,
      height
    );

    sprite.setInteractive(this.hitArea, Phaser.Geom.Rectangle.Contains);
  }
}
```

**Preventing Accidental Touches:**

```typescript
export class GameplayScene extends Phaser.Scene {
  private lastTouchTime: number = 0;
  private touchDebounce: number = 100; // 100ms debounce

  create() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const now = Date.now();

      // Debounce rapid touches
      if (now - this.lastTouchTime < this.touchDebounce) {
        return;
      }

      this.lastTouchTime = now;
      this.handleTouch(pointer);
    });
  }

  private handleTouch(pointer: Phaser.Input.Pointer): void {
    // Ignore accidental touches near edges
    const edgeMargin = 20;
    if (pointer.x < edgeMargin ||
        pointer.x > this.cameras.main.width - edgeMargin ||
        pointer.y < edgeMargin ||
        pointer.y > this.cameras.main.height - edgeMargin) {
      return;
    }

    // Process touch
  }
}
```

### 5.2 Keyboard Handling for Typing Games

**Virtual Keyboard Management:**

```typescript
// src/input/KeyboardManager.ts
export class KeyboardManager {
  private scene: Phaser.Scene;
  private inputElement: HTMLInputElement;
  private isKeyboardOpen: boolean = false;

  create(): void {
    // Create invisible input for keyboard
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.style.position = 'absolute';
    this.inputElement.style.left = '-9999px';
    this.inputElement.autocomplete = 'off';
    this.inputElement.autocorrect = 'off';
    this.inputElement.autocapitalize = 'off';
    this.inputElement.spellcheck = false;
    document.body.appendChild(this.inputElement);

    // Listen for input
    this.inputElement.addEventListener('input', (e) => {
      const value = this.inputElement.value;
      if (value.length > 0) {
        const char = value[value.length - 1];
        this.onCharacter(char);
        this.inputElement.value = ''; // Clear for next char
      }
    });

    // Detect keyboard open/close
    window.visualViewport?.addEventListener('resize', () => {
      this.onKeyboardChange();
    });
  }

  openKeyboard(): void {
    this.inputElement.focus();
  }

  closeKeyboard(): void {
    this.inputElement.blur();
  }

  private onKeyboardChange(): void {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const windowHeight = window.innerHeight;

    this.isKeyboardOpen = viewportHeight < windowHeight;

    if (this.isKeyboardOpen) {
      // Adjust UI for keyboard
      this.scene.events.emit('keyboard-opened', windowHeight - viewportHeight);
    } else {
      this.scene.events.emit('keyboard-closed');
    }
  }

  private onCharacter(char: string): void {
    this.scene.events.emit('character-typed', char);
  }

  destroy(): void {
    if (this.inputElement.parentNode) {
      this.inputElement.parentNode.removeChild(this.inputElement);
    }
  }
}

// Usage in GameplayScene
export class GameplayScene extends Phaser.Scene {
  private keyboardManager: KeyboardManager;

  create() {
    this.keyboardManager = new KeyboardManager(this);
    this.keyboardManager.create();

    // Listen for typed characters
    this.events.on('character-typed', this.onCharacterTyped, this);

    // Adjust layout when keyboard opens
    this.events.on('keyboard-opened', (keyboardHeight: number) => {
      // Move UI up to avoid keyboard
      this.tweens.add({
        targets: this.wordBoxContainer,
        y: '-=' + keyboardHeight / 2,
        duration: 300
      });
    });

    this.events.on('keyboard-closed', () => {
      // Reset layout
      this.tweens.add({
        targets: this.wordBoxContainer,
        y: this.originalY,
        duration: 300
      });
    });

    // Open keyboard when level starts
    this.keyboardManager.openKeyboard();
  }

  private onCharacterTyped(char: string): void {
    // Process character
    this.typingEngine.addCharacter(char);
  }
}
```

**Context-Appropriate Keyboard:**

```typescript
// For different input modes
this.inputElement.type = 'text';        // Normal typing
this.inputElement.type = 'email';       // Email input (includes @)
this.inputElement.type = 'number';      // Numeric keypad
this.inputElement.inputMode = 'none';   // Hide keyboard entirely

// For word games, use text with autocorrect disabled
this.inputElement.type = 'text';
this.inputElement.autocomplete = 'off';
this.inputElement.autocorrect = 'off';
this.inputElement.autocapitalize = 'none';
this.inputElement.spellcheck = false;
```

### 5.3 Battery Life Optimization

**Reduce CPU/GPU Usage:**

```typescript
// src/utils/PerformanceManager.ts
export class PerformanceManager {
  private scene: Phaser.Scene;
  private batteryLevel: number = 1;
  private isLowPowerMode: boolean = false;

  async init(): Promise<void> {
    // Check battery status
    if ('getBattery' in navigator) {
      // @ts-ignore
      const battery = await navigator.getBattery();
      this.batteryLevel = battery.level;
      this.isLowPowerMode = battery.level < 0.2;

      battery.addEventListener('levelchange', () => {
        this.batteryLevel = battery.level;
        this.updatePerformanceSettings();
      });
    }
  }

  private updatePerformanceSettings(): void {
    if (this.batteryLevel < 0.2 || this.isLowPowerMode) {
      // Low power mode
      this.scene.game.config.fps.target = 30; // Reduce FPS
      this.disableParticles();
      this.disableShadows();
      this.reduceAnimations();
    } else {
      // Normal mode
      this.scene.game.config.fps.target = 60;
      this.enableParticles();
      this.enableShadows();
    }
  }

  private disableParticles(): void {
    // Disable non-essential particle effects
  }

  private reduceAnimations(): void {
    // Use simpler animations
  }
}
```

**Pause When Inactive:**

```typescript
// Automatically pause game when tab is hidden
document.addEventListener('visibilitychange', () => {
  const game = Phaser.GAMES[0];

  if (document.hidden) {
    // Pause all scenes
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isActive()) {
        scene.scene.pause();
      }
    });

    // Stop all audio
    game.sound.pauseAll();

    // Reduce update rate
    game.loop.targetFps = 1;
  } else {
    // Resume
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isPaused()) {
        scene.scene.resume();
      }
    });

    game.sound.resumeAll();
    game.loop.targetFps = 60;
  }
});
```

### 5.4 Different Screen Sizes/Aspect Ratios

**Responsive Layout:**

```typescript
// src/utils/ResponsiveLayout.ts
export class ResponsiveLayout {
  static getDeviceCategory(): 'small' | 'medium' | 'large' {
    const width = window.innerWidth;

    if (width < 375) return 'small';  // iPhone SE, small Android
    if (width < 428) return 'medium'; // iPhone 12/13/14
    return 'large';                    // iPhone Pro Max, tablets
  }

  static getSafeArea(): {top: number, bottom: number, left: number, right: number} {
    // Account for notches and safe areas
    const top = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sat') || '0');
    const bottom = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sab') || '0');
    const left = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sal') || '0');
    const right = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sar') || '0');

    return { top, bottom, left, right };
  }

  static getScaleFactor(): number {
    // Scale UI based on screen size
    const baseWidth = 390; // iPhone 12/13 width
    const actualWidth = window.innerWidth;
    return Math.max(0.8, Math.min(1.2, actualWidth / baseWidth));
  }
}

// In CSS
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

// Apply in game
export class GameplayScene extends Phaser.Scene {
  create() {
    const safeArea = ResponsiveLayout.getSafeArea();
    const scaleFactor = ResponsiveLayout.getScaleFactor();

    // Position UI within safe area
    const topMargin = safeArea.top + 20;
    const bottomMargin = this.cameras.main.height - safeArea.bottom - 20;

    this.scoreDisplay.setPosition(this.cameras.main.centerX, topMargin);
    this.wordBox.setPosition(this.cameras.main.centerX,
      bottomMargin - 200 * scaleFactor);
  }
}
```

**Landscape Mode Support (optional):**

```typescript
// Detect orientation
window.addEventListener('orientationchange', () => {
  const orientation = window.screen.orientation.type;

  if (orientation.includes('landscape')) {
    // Show warning to rotate to portrait
    this.showRotateWarning();
  } else {
    this.hideRotateWarning();
  }
});

// Lock to portrait (if supported)
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('portrait').catch(() => {
    // Orientation lock not supported
  });
}
```

### 5.5 iOS vs Android Differences

**Platform Detection:**

```typescript
// src/utils/Platform.ts
export class Platform {
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  static isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  static getVersion(): {major: number, minor: number} | null {
    if (this.isIOS()) {
      const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        return {major: parseInt(match[1]), minor: parseInt(match[2])};
      }
    } else if (this.isAndroid()) {
      const match = navigator.userAgent.match(/Android (\d+)\.(\d+)/);
      if (match) {
        return {major: parseInt(match[1]), minor: parseInt(match[2])};
      }
    }
    return null;
  }
}
```

**Platform-Specific Fixes:**

```typescript
// iOS Safari audio fix
if (Platform.isIOS()) {
  // iOS requires user interaction before playing audio
  document.addEventListener('touchstart', () => {
    this.sound.play('silence'); // Play silent sound to unlock audio
  }, {once: true});
}

// Android Chrome input fix
if (Platform.isAndroid()) {
  // Android sometimes doesn't focus input properly
  this.inputElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    this.inputElement.focus();
  });
}

// Safari viewport height fix
if (Platform.isSafari()) {
  // Safari's 100vh includes browser chrome
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);

  // In CSS
  // height: calc(var(--vh, 1vh) * 100);
}
```

---

## 6. Build and Bundle Optimization

### 6.1 Vite Configuration for Mobile

**Optimized vite.config.ts:**

```typescript
// /Users/nathanielgiddens/WordRunProject/wordrun-vite/vite.config.ts
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
    host: true,
    hmr: { clientPort: 443 }
  },

  preview: {
    port: 4175,
    strictPort: true,
    host: true
  },

  build: {
    target: 'es2020',

    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB

    // Manual chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk (Phaser + Supabase)
          'vendor': ['phaser', '@supabase/supabase-js'],

          // UI scenes (loaded less frequently)
          'ui-scenes': [
            './src/scenes/TitleScreen.ts',
            './src/scenes/MapScene.ts',
            './src/scenes/WorldMapScene.ts',
          ],

          // Gameplay scenes (core game)
          'gameplay': [
            './src/scenes/GameplayScene.ts',
            './src/scenes/WordChainGameScene.ts',
          ],

          // Components
          'components': [
            './src/components/gameplay/WordBox.ts',
            './src/components/gameplay/ComboBar.ts',
            // ... other components
          ],
        },

        // Use content hash for long-term caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      }
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // Remove specific functions
      },
      mangle: {
        safari10: true, // Fix Safari 10 bugs
      },
    },

    // Source maps (disable in production)
    sourcemap: false,

    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['phaser', '@supabase/supabase-js'],
    exclude: [],
  },

  plugins: [
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),

    // Brotli compression (better than gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

### 6.2 Code Splitting Strategies

**Dynamic Imports for Scenes:**

```typescript
// src/main.ts
// Don't import all scenes upfront
// import { GameplayScene } from './scenes/GameplayScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0e0e12',
  width: 390,
  height: 844,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: { createContainer: true },

  // Only load Preloader initially
  scene: [],
});

// Load scenes dynamically
async function loadScene(sceneName: string) {
  switch (sceneName) {
    case 'TitleScreen':
      const { TitleScreen } = await import('./scenes/TitleScreen');
      game.scene.add('TitleScreen', TitleScreen, true);
      break;

    case 'GameplayScene':
      const { GameplayScene } = await import('./scenes/GameplayScene');
      game.scene.add('GameplayScene', GameplayScene, true);
      break;

    // ... other scenes
  }
}

// Start with preloader
import('./scenes/Preloader').then(({ Preloader }) => {
  game.scene.add('Preloader', Preloader, true);
});
```

**Lazy Load Land Assets:**

```typescript
// src/services/AssetManager.ts
export class AssetManager {
  async loadLandAssets(landId: number): Promise<void> {
    // Dynamic import of land-specific code
    const landModule = await import(`./lands/land_${landId}.ts`);
    return landModule.loadAssets(this.scene);
  }
}

// src/lands/land_1.ts
export async function loadAssets(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) => {
    scene.load.once('complete', resolve);

    scene.load.image('bg_1', 'assets/lands/1/background.png');
    scene.load.atlas('particles_1',
      'assets/lands/1/particles.png',
      'assets/lands/1/particles.json'
    );

    scene.load.start();
  });
}
```

### 6.3 Tree Shaking Unused Phaser Features

**Import Only What You Need:**

```typescript
// ❌ BAD - Imports entire Phaser library
import Phaser from 'phaser';

// ✅ GOOD - Import specific modules (if using custom build)
import { Game } from 'phaser/src/core/Game';
import { Scene } from 'phaser/src/scene/Scene';
import { WebGLRenderer } from 'phaser/src/renderer/webgl/WebGLRenderer';

// However, Phaser's default build is already optimized
// The best approach is to use the standard import
// and let Vite's tree-shaking handle it
```

**Custom Phaser Build (Advanced):**

```bash
# Clone Phaser
git clone https://github.com/photonstorm/phaser.git
cd phaser

# Edit webpack config to exclude unused features
# Remove: Arcade Physics (if not used), Cameras3D, etc.

# Build custom version
npm install
npm run build
```

**Alternative: Use Phaser-CE (lighter) if features match:**

```typescript
// For simple 2D games, consider Phaser CE (Community Edition)
// Smaller bundle size, but older API
```

### 6.4 Progressive Web App Configuration

**manifest.json:**

```json
{
  "name": "WordRun - Word Puzzle Adventure",
  "short_name": "WordRun",
  "description": "Chain 11 related words in this addictive word puzzle game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0e0e12",
  "theme_color": "#0066ff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    {
      "src": "/screenshots/gameplay.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

**Service Worker for Offline Support:**

```typescript
// public/sw.js
const CACHE_NAME = 'wordrun-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css',
  '/assets/vendor.js',
  '/assets/fonts/retro-pixel-arcade.woff2',
  '/assets/fonts/supercell-magic.woff2',
  '/assets/atlases/ui_3d.png',
  '/assets/atlases/ui_3d.json',
  '/assets/characters/ruut_walk_cycle.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase requests (always fetch fresh)
  if (event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache new requests
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
```

**Register Service Worker:**

```typescript
// src/main.ts
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, prompt user to reload
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      },
      (error) => {
        console.error('SW registration failed:', error);
      }
    );
  });
}
```

**iOS Add to Home Screen:**

```html
<!-- In index.html -->
<head>
  <!-- Standard PWA -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0066ff">

  <!-- iOS specific -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="WordRun">
  <link rel="apple-touch-icon" href="/icons/icon-180x180.png">

  <!-- Splash screens for iOS -->
  <link rel="apple-touch-startup-image"
        media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        href="/splash/iphone-12-13-14.png">
  <link rel="apple-touch-startup-image"
        media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        href="/splash/iphone-14-pro-max.png">
</head>
```

---

## 7. Professional Aesthetics

### 7.1 UI Animation Libraries

**GreenSock (GSAP) Integration:**

```bash
npm install gsap
```

```typescript
// src/fx/GSAPAnimations.ts
import gsap from 'gsap';

export class GSAPAnimations {
  static fadeIn(element: HTMLElement, duration = 0.3): gsap.core.Tween {
    return gsap.from(element, {
      opacity: 0,
      duration,
      ease: 'power2.out',
    });
  }

  static slideInFromBottom(element: HTMLElement, duration = 0.5): gsap.core.Tween {
    return gsap.from(element, {
      y: 100,
      opacity: 0,
      duration,
      ease: 'back.out(1.7)',
    });
  }

  static pulse(element: HTMLElement, scale = 1.1): gsap.core.Tween {
    return gsap.to(element, {
      scale,
      duration: 0.3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  static countUp(
    element: HTMLElement,
    from: number,
    to: number,
    duration = 1
  ): gsap.core.Tween {
    const obj = { value: from };
    return gsap.to(obj, {
      value: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString();
      },
    });
  }
}

// Usage
export class ScoreDisplay extends Component {
  create(x: number, y: number) {
    this.element = document.createElement('div');
    this.element.textContent = '0';
    document.body.appendChild(this.element);

    GSAPAnimations.slideInFromBottom(this.element);
  }

  updateScore(newScore: number) {
    const oldScore = parseInt(this.element.textContent || '0');
    GSAPAnimations.countUp(this.element, oldScore, newScore, 0.5);
  }
}
```

**Anime.js (Lightweight Alternative):**

```bash
npm install animejs
```

```typescript
// src/fx/AnimeAnimations.ts
import anime from 'animejs';

export class AnimeAnimations {
  static staggerIn(elements: NodeListOf<Element>, delay = 100): anime.AnimeInstance {
    return anime({
      targets: elements,
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(delay),
      easing: 'easeOutExpo',
    });
  }

  static morphPath(element: SVGPathElement, d: string): anime.AnimeInstance {
    return anime({
      targets: element,
      d,
      duration: 500,
      easing: 'easeInOutQuad',
    });
  }
}
```

### 7.2 Achieving Native App Feel

**60 FPS Animations:**

```typescript
// Use CSS transforms (GPU accelerated)
// ✅ GOOD
element.style.transform = `translateX(${x}px) translateY(${y}px)`;

// ❌ BAD (causes layout recalculation)
element.style.left = `${x}px`;
element.style.top = `${y}px`;
```

**Smooth Scrolling:**

```css
/* Momentum scrolling on iOS */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

**Native-Like Gestures:**

```typescript
// src/input/GestureRecognizer.ts
export class GestureRecognizer {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;

  onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.startTime = Date.now();
  }

  onPointerUp(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.startX;
    const deltaY = pointer.y - this.startY;
    const deltaTime = Date.now() - this.startTime;

    // Swipe detection
    if (deltaTime < 300 && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    }

    // Tap detection
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.onTap();
    }

    // Long press
    if (deltaTime > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.onLongPress();
    }
  }

  private onSwipeRight(): void { /* ... */ }
  private onSwipeLeft(): void { /* ... */ }
  private onTap(): void { /* ... */ }
  private onLongPress(): void { /* ... */ }
}
```

### 7.3 Loading Screens and Progress Indicators

**Professional Loading Screen:**

```typescript
// src/scenes/Preloader.ts
export class Preloader extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  preload(): void {
    // Create loading UI
    this.createLoadingUI();

    // Listen to loading events
    this.load.on('progress', this.onProgress, this);
    this.load.on('complete', this.onComplete, this);

    // Load assets
    this.loadAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0e0e12);

    // Logo
    const logo = this.add.text(width / 2, height / 2 - 100, 'WORDRUN', {
      fontFamily: 'SupercellMagic',
      fontSize: '64px',
      color: '#ffffff',
    });
    logo.setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: logo,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Progress bar background
    const barWidth = 400;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 50;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x222222, 0.8);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 10);

    // Progress bar fill
    this.loadingBar = this.add.graphics();

    // Progress text
    this.progressText = this.add.text(width / 2, barY + 50, '0%', {
      fontFamily: 'RetroPixel',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.progressText.setOrigin(0.5);

    // Tips
    const tips = [
      'Chain words by their meaning, not spelling',
      'Longer combos earn more points',
      'Use hints wisely - they\'re limited!',
      'Unlock new lands by completing levels',
    ];
    const randomTip = Phaser.Math.RND.pick(tips);

    const tipText = this.add.text(width / 2, height - 100, randomTip, {
      fontFamily: 'RetroPixel',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: width - 40 },
    });
    tipText.setOrigin(0.5);
  }

  private onProgress(value: number): void {
    const { width, height } = this.cameras.main;
    const barWidth = 400;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 50;

    // Update progress bar
    this.loadingBar.clear();
    this.loadingBar.fillStyle(0x0066ff, 1);
    this.loadingBar.fillRoundedRect(
      barX + 2,
      barY + 2,
      (barWidth - 4) * value,
      barHeight - 4,
      8
    );

    // Update text
    this.progressText.setText(Math.round(value * 100) + '%');
  }

  private onComplete(): void {
    // Fade out loading screen
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScreen');
    });
  }

  private loadAssets(): void {
    // Load core assets
    this.load.atlas('ui_3d',
      'assets/atlases/ui_3d.png',
      'assets/atlases/ui_3d.json'
    );

    this.load.atlas('ruut_skins',
      'assets/atlases/ruut_skins.png',
      'assets/atlases/ruut_skins.json'
    );

    // Load fonts
    // ... (WebFont loader from section 1.2)

    // Load first land
    AssetManager.getInstance().loadLand(this, 1);
  }
}
```

**In-Game Loading Indicator:**

```typescript
// src/ui/LoadingSpinner.ts
export class LoadingSpinner extends Component {
  private container?: Phaser.GameObjects.Container;
  private spinner?: Phaser.GameObjects.Graphics;

  create(x: number, y: number): void {
    this.container = this.scene.add.container(x, y);
    this.spinner = this.scene.add.graphics();

    this.container.add(this.spinner);
    this.container.setDepth(1000);

    // Animate
    this.scene.tweens.add({
      targets: this.container,
      angle: 360,
      duration: 1000,
      repeat: -1,
      ease: 'Linear',
    });

    this.render();
  }

  private render(): void {
    if (!this.spinner) return;

    this.spinner.clear();
    this.spinner.lineStyle(4, 0xffffff, 1);
    this.spinner.beginPath();
    this.spinner.arc(0, 0, 20, 0, Math.PI * 1.5);
    this.spinner.strokePath();
  }

  destroy(): void {
    this.container?.destroy();
  }
}
```

### 7.4 Error States and Feedback

**User-Friendly Error Messages:**

```typescript
// src/ui/ErrorModal.ts
export class ErrorModal {
  static show(
    scene: Phaser.Scene,
    title: string,
    message: string,
    onRetry?: () => void
  ): void {
    const { width, height } = scene.cameras.main;

    // Semi-transparent overlay
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    overlay.setDepth(999);

    // Modal container
    const modal = scene.add.container(width / 2, height / 2);
    modal.setDepth(1000);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(-150, -100, 300, 200, 20);
    modal.add(bg);

    // Icon
    const icon = scene.add.text(0, -60, '⚠️', {
      fontSize: '48px',
    });
    icon.setOrigin(0.5);
    modal.add(icon);

    // Title
    const titleText = scene.add.text(0, -10, title, {
      fontFamily: 'SupercellMagic',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    });
    titleText.setOrigin(0.5);
    modal.add(titleText);

    // Message
    const messageText = scene.add.text(0, 30, message, {
      fontFamily: 'RetroPixel',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: 250 },
    });
    messageText.setOrigin(0.5);
    modal.add(messageText);

    // Buttons
    const buttonY = 80;

    if (onRetry) {
      // Retry button
      const retryBtn = scene.add.text(-60, buttonY, 'Retry', {
        fontFamily: 'RetroPixel',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#0066ff',
        padding: { x: 20, y: 10 },
      });
      retryBtn.setOrigin(0.5);
      retryBtn.setInteractive({ cursor: 'pointer' });
      retryBtn.on('pointerdown', () => {
        overlay.destroy();
        modal.destroy();
        onRetry();
      });
      modal.add(retryBtn);
    }

    // Close button
    const closeBtn = scene.add.text(60, buttonY, 'Close', {
      fontFamily: 'RetroPixel',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 20, y: 10 },
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ cursor: 'pointer' });
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      modal.destroy();
    });
    modal.add(closeBtn);

    // Animate in
    modal.setScale(0);
    scene.tweens.add({
      targets: modal,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }
}

// Usage
try {
  await ProgressService.getInstance().saveProgress(userId, landId, levelId, score);
} catch (error) {
  ErrorModal.show(
    this,
    'Network Error',
    'Failed to save progress. Check your internet connection.',
    () => this.retrySaveProgress()
  );
}
```

**Connection Status Indicator:**

```typescript
// src/ui/ConnectionStatus.ts
export class ConnectionStatus {
  private static indicator: HTMLElement;

  static init(): void {
    this.indicator = document.createElement('div');
    this.indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: 'RetroPixel', monospace;
      font-size: 12px;
      color: white;
      z-index: 9999;
      display: none;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(this.indicator);

    // Monitor connection
    window.addEventListener('online', () => this.showOnline());
    window.addEventListener('offline', () => this.showOffline());

    if (!navigator.onLine) {
      this.showOffline();
    }
  }

  private static showOnline(): void {
    this.indicator.textContent = 'Connected';
    this.indicator.style.backgroundColor = '#00ff88';
    this.indicator.style.display = 'block';

    setTimeout(() => {
      this.indicator.style.opacity = '0';
      setTimeout(() => {
        this.indicator.style.display = 'none';
        this.indicator.style.opacity = '1';
      }, 300);
    }, 2000);
  }

  private static showOffline(): void {
    this.indicator.textContent = 'Offline Mode';
    this.indicator.style.backgroundColor = '#ff4444';
    this.indicator.style.display = 'block';
  }
}

// In main.ts
ConnectionStatus.init();
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Priority: Critical Performance Issues**

1. **Refactor GameplayScene.ts**
   - Extract components (WordBox, ComboBar, etc.)
   - Create BaseScene class
   - Implement proper cleanup
   - Target: < 300 lines

2. **Fix Memory Leaks**
   - Implement DOMManager
   - Add proper shutdown methods
   - Set up MemoryMonitor

3. **Asset Optimization**
   - Create texture atlases for UI
   - Compress audio files
   - Set up AssetManager

### Phase 2: Visual Polish (Week 3-4)

**Priority: User Experience**

1. **Implement Juice Effects**
   - Screen shake on correct/wrong
   - Particle effects
   - Button micro-interactions
   - Haptic feedback

2. **Theme System**
   - Create color palettes for land groups
   - Dynamic theming
   - Smooth transitions

3. **Improved Loading**
   - Professional loading screen
   - Progress indicators
   - Tips display

### Phase 3: Mobile Optimization (Week 5-6)

**Priority: Platform Compliance**

1. **Touch Input**
   - Proper touch targets (44px minimum)
   - Gesture recognition
   - Keyboard management

2. **Responsive Layout**
   - Safe area handling
   - Multiple screen sizes
   - Orientation lock

3. **Platform-Specific Fixes**
   - iOS audio unlock
   - Android input fixes
   - Safari viewport height

### Phase 4: Build Optimization (Week 7-8)

**Priority: Performance & Distribution**

1. **Vite Configuration**
   - Code splitting
   - Manual chunking
   - Compression plugins

2. **PWA Setup**
   - manifest.json
   - Service worker
   - Offline support

3. **Testing & Profiling**
   - Performance profiling
   - Memory profiling
   - Cross-device testing

### Success Metrics

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Frame Rate: Stable 60 FPS
- Memory Usage: < 200 MB on low-end devices
- Bundle Size: < 2 MB (gzipped)

**User Experience Targets:**
- Touch response: < 100ms
- Scene transitions: < 300ms
- No jank during gameplay
- Smooth animations on all devices

---

## Sources

This document was compiled using the following research and best practices:

**Phaser 3 Performance:**
- [How I optimized my Phaser 3 action game — in 2025](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b)
- [Phaser - How I optimized my Phaser 3 action game — in 2025](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
- [Tips on speeding up Phaser games](https://gist.github.com/MarcL/748f29faecc6e3aa679a385bffbdf6fe)
- [Phaser Mobile Performance Documentation](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md)

**Texture Atlas & Asset Optimization:**
- [How to create sprite sheets for Phaser 3 with TexturePacker](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser)
- [Working with Texture Atlases in Phaser 3](https://airum82.medium.com/working-with-texture-atlases-in-phaser-3-25c4df9a747a)
- [Phaser Textures Documentation](https://docs.phaser.io/phaser/concepts/textures)

**Mobile Game UI/UX Design:**
- [Best Examples in Mobile Game UI Designs (2025 Review)](https://pixune.com/blog/best-examples-mobile-game-ui-design/)
- [UI/UX Design Trends in Mobile Apps for 2025](https://www.chopdawg.com/ui-ux-design-trends-in-mobile-apps-for-2025/)
- [Mobile UX Design Patterns That Convert in 2025](https://medium.com/@JanefrancesUIUX/mobile-ux-design-patterns-that-convert-in-2025-23137d3b0e56)
- [Top 7 Mobile UX Design Patterns to Watch in 2025](https://zethic.com/mobile-ux-patterns-dominating/)

**Vite & Build Optimization:**
- [Phaser + TypeScript + Vite Template](https://phaser.io/news/2024/01/phaser-vite-typescript-template)
- [Reduce the bundle size of a game using Vite and Typescript](https://phaser.discourse.group/t/reduce-the-bundle-size-of-a-game-using-vite-and-typescript/14046)
- [Optimize Vite Build Time: A Comprehensive Guide](https://dev.to/perisicnikola37/optimize-vite-build-time-a-comprehensive-guide-4c99)
- [Vite Features Documentation](https://vite.dev/guide/features)

**Scene Management & Architecture:**
- [Game States and Scene Management](https://app.studyraid.com/en/read/12499/404229/game-states-and-scene-management)
- [The Power of Dependency Injection in Phaser 3](https://dev.to/belka/the-power-of-dependency-injection-in-phaser-3-building-a-modular-game-with-solid-principles-5251)
- [Phaser Scenes Documentation](https://docs.phaser.io/phaser/concepts/scenes)
- [An architecture for Phaser JS + Redux](http://orta.io/notes/games/phaser-redux/)

**Mobile Keyboard & Input:**
- [How to handle the on-screen keyboard without messing up your app usability](https://www.mobilespoon.net/2018/12/10-usability-rules-keyboard-mobile-app.html)
- [A Guide To Designing Touch Keyboards](https://www.smashingmagazine.com/2013/08/guide-to-designing-touch-keyboards-with-cheat-sheet/)
- [10 Commandments of Building a Virtual Keyboard App](https://www.fleksy.com/blog/10-commandments-of-building-a-virtual-keyboard-app/)
- [Apple Virtual Keyboards HIG](https://developer.apple.com/design/human-interface-guidelines/components/selection-and-input/onscreen-keyboards/)

**DOM vs Canvas Performance:**
- [Phaser 3.17.0 Released (DOM Element features)](https://phaser.io/news/2019/05/phaser-3170-released)
- [Phaser DOM Element Documentation](https://docs.phaser.io/phaser/concepts/gameobjects/dom-element)

**Progressive Web Apps:**
- [Progressive Web Apps: bridging web and mobile in 2025](https://tsh.io/blog/progressive-web-apps-in-2025)
- [Do We Still Need Progressive Web Apps (PWAs) in 2025?](https://devtechinsights.com/do-we-still-need-progressive-web-apps-pwas-2025/)
- [11 Best Progressive Web Apps Games (PWA Games) in 2025](https://simicart.com/blog/pwa-games/)
- [The State of Progressive Web Apps 2025](https://www.enonic.com/blog/state-of-progressive-web-apps)
- [Progressive Web Apps Documentation](https://web.dev/learn/pwa/progressive-web-apps)

---

## Next Steps

1. Review this document with your team
2. Prioritize items based on your roadmap
3. Start with Phase 1 (Foundation) - the refactoring will make everything else easier
4. Set up monitoring/profiling tools early
5. Test on real devices frequently (iOS and Android)

For questions or clarifications on any section, feel free to ask. Good luck with WordRun!
