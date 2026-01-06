/* =========================================================
   FILE: src/scenes/GameplayScene.ts
   BASE: 0.03 with targeted migrations from 0.05 → 0.06
   CHANGESET:
   - Fix wheel "wrong" feedback (defer clear, visible shake)
   - Combo bar above word box; score centered above bar
   - Level (sun/moon) on hint row right, just left of hearts
   - Keep clock left; keep confirm pill above wheel
   ========================================================= */
   import Phaser from 'phaser';
   import { DEMO_LEVELS, type LevelSpec, type StarChallengeConfig } from '../content';
   import { mountDom, basicColumn } from '../utils';
   import { DataManager } from '../DataManager';
   import { GameDataManager } from '../GameDataManager';
   import { DebugBus } from '../dev/DebugHUD';
   import { LogBus } from '../dev/LogBus';
   import { getWheelMode } from '../data/adapter';
import { initTrapRuntime, onCorrectWord, 
 getTrapStateSafe } from "../services/TrapRuntime";
import { getLandMeta } from '../landMeta';
import { GAME_CONFIG } from '../config';
import { ComboBar } from '../ui/ComboBar';
import { HintSystem } from '../gameplay/HintSystem';
import { PowerUpInventory } from '../gameplay/PowerUpInventory';
import { RuutCharacter } from '../ui/RuutCharacter';


   



   // =====================
// LAYOUT CONTROLS (MVP)
// =====================
// Set LOCK_LAYOUT = true after you tune these numbers.
const LOCK_LAYOUT = false;

// Wordbox sizing (prevents stretching / elongation)
const WORDBOX_MAX_W_PX = 520;     // ↓ lower makes it tighter
const WORDBOX_MIN_W_PX = 320;     // keeps it usable on small screens
const GAMEPLAY_LIFT_PX = 1000; // increase to lift everything up (try 36 → 56)


// Padding around the whole wordbox “stage” (independent sides)
const WORDBOX_PAD_L = -30;          // left padding INSIDE the stage
const WORDBOX_PAD_R = 16;          // right padding INSIDE the stage
const WORDBOX_PAD_T = 0;          // top padding INSIDE the stage
const WORDBOX_PAD_B = -30;          // bottom padding INSIDE the stage

// Ruut positioning + scale (no squish)
const RUUT_SCALE = 0.57;          // < half size (0.50 = half)
const RUUT_OFFSET_X = 4;        // more negative = further left
const RUUT_OFFSET_Y = 530;          // bigger = higher, negative = lower

// How much space to reserve so Ruut never overlaps wordbox
const RUUT_RESERVED_W = 54;       // ↓ reduce to make wordbox nearly identical
const BANNER_SAFE_PX = 35; // space reserved for ad banner at bottom



   
   /* ---------- Safe area helper ---------- */
   function getSafeRect(screenW: number, screenH: number, padPct = 0.05) {
     const padX = Math.round(screenW * padPct);
     const padY = Math.round(screenH * padPct);
     const w = screenW - padX * 2;
     const h = screenH - padY * 2;
     const x = padX, y = padY;
     return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, top: y, right: x + w, bottom: y + h, left: x };
   }
   
   /* ---------- Types ---------- */
   type RoundParams = { land: number; level: number };
   type InputMode = 'keyboard' | 'wheel';
   
   type SlotState = {
     word: string;
     len: number;
     cur: number;
     cells: HTMLSpanElement[];
     rowEl: HTMLDivElement;
     boxEl: HTMLDivElement;
   };
   
   /* ---------- Combo constants ---------- */
   const COMBO_MIN = 0.01;
   const COMBO_MAX = 1.0;
   const T1 = 0.40, T2 = 0.65, T3 = 0.80;
   const DRAIN_T1 = 3, DRAIN_T2 = 5, DRAIN_T3 = 7;
   
   const BASE_POINTS_PER_WORD = 15;
   const BOOST_T1 = 5, BOOST_T2 = 10, BOOST_T3 = 20;
   
   const HINTS: Record<string, string> = {
     door:'entry', stop:'halt', sign:'marker', up:'direction', start:'begin', button:'switch',
     nose:'smell', ring:'call', bell:'chime', tower:'tall', clock:'timepiece', station:'platform',
     master:'expert', key:'unlock', lock:'secure', pick:'choose', pocket:'jeans', change:'coins',
     rate:'speed', heart:'organ', beat:'rhythm', box:'container', light:'bright', house:'home',
     party:'celebration', line:'queue', cook:'chef', book:'read', club:'group', soda:'fizzy',
     pop:'burst', quiz:'test', show:'display', train:'rail', moon:'night'
   };

   const KEY_ROWS: string[][] = [
     ['Q','W','E','R','T','Y','U','I','O','P'],
     ['A','S','D','F','G','H','J','K','L'],
     ['Z','X','C','V','B','N','M','⌫','⏎']
   ];

   // ⭐ Per-level progress stored by levelKey ("land_0_level_1", etc.)
type LevelProgress = {
  bestStars: number;
  bestScore: number;
  bestTimeMs: number;
};

   
   export class GameplayScene extends Phaser.Scene {
    private spec!: LevelSpec;
    private dataManager!: DataManager;
    private gameData!: GameDataManager;      // global lives / progression
    private menuDom?: Phaser.GameObjects.DOMElement;   // ← add this
    private livesModalOpen = false;

      // --- RUUT COMPANION (DOM) ---
  private ruutEl: HTMLDivElement | null = null;
  private ruutCharacter?: RuutCharacter;

  private comboBar?: ComboBar;
  private hintSystem?: HintSystem;
  private powerUpInventory?: PowerUpInventory;
  private initialComboValue = COMBO_MIN;



    


    // Fail-flow guard
    private noMovesHandled = false;          // prevent double-trigger on no moves

    // Prevent multiple completion flows for the same round
private levelCompleted = false;

  
    // TRAPS / POWERUPS: temporary Lock Key count (per level)
    // Base state: no keys. Levels that want keys must explicitly set this.
    private lockKeyCount = 0;
  
    // TRAPS: rows that we’ve manually released via play-keys or lock keys
    private releasedLocks = new Set<number>();
    
  

  
   
     /* ---------- Phaser layout anchors ---------- */
     private applyLayoutPhaser(safe: { cx:number; cy:number; bottom:number }) {
       const wheelRadius  = 160;
       const wheelGap     = 40;
       const wordGap      = 22;
       const pillGap      = 10;
   
       if ((this as any).wheelContainer) {
         (this as any).wheelContainer.x = safe.cx;
         (this as any).wheelContainer.y = safe.bottom - wheelRadius - wheelGap;
       }
       if ((this as any).wordBox) {
         const wb = (this as any).wordBox;
         const wbH = (wb.displayHeight ?? 40);
         wb.x = safe.cx;
         wb.y = ((this as any).wheelContainer?.y ?? safe.cy) - wheelRadius - wordGap - wbH / 2;
       }
       if ((this as any).confirmPill) {
         const cp = (this as any).confirmPill;
         cp.x = safe.cx;
         cp.y = ((this as any).wheelContainer?.y ?? safe.cy) - wheelRadius - pillGap;
       }
     }
   
     /* ---------- DOM layout ---------- */
     private layoutDomIntoSafe(safe:{x:number;y:number;w:number;h:number;cx:number}) {
       const wrap = document.getElementById('wrap_root') as HTMLDivElement;
       if (wrap) { wrap.style.left=`${safe.x}px`; wrap.style.top=`${safe.y}px`; wrap.style.width=`${safe.w}px`; wrap.style.height=`${safe.h}px`; }
   
       const title = document.getElementById('gameTitle') as HTMLDivElement;
       if (title) { title.style.left='0px'; title.style.top='0px'; title.style.width=`${safe.w}px`; }
   
       const clockRow = document.getElementById('clockRow') as HTMLDivElement;
       const hintBar  = document.getElementById('hintBar') as HTMLDivElement;
       const rows     = document.getElementById('rows') as HTMLDivElement;
       const kbWrap   = (document.getElementById('kb')?.parentElement) as HTMLDivElement | null;
       const wheelWrap= document.getElementById('wheelWrap') as HTMLDivElement;
       const startRow = document.getElementById('startRow') as HTMLDivElement;
       const combo    = document.getElementById('combo') as HTMLDivElement;
       const scoreCtr = document.getElementById('scoreCenter') as HTMLDivElement;
   
       [clockRow, hintBar, startRow, combo, scoreCtr, rows, kbWrap || undefined, wheelWrap]
         .filter(Boolean)
         .forEach((el: any) => el.style.maxWidth = `${Math.min(680, safe.w)}px`);
   
       [clockRow, scoreCtr, combo].forEach((el: any) => { if (el) el.style.marginInline = 'auto'; });
   
       if (hintBar) { hintBar.style.paddingLeft='8px'; hintBar.style.paddingRight='8px'; }
   
       if (rows) {
        rows.style.maxHeight = 'unset';
        // ✅ prevent left/right scroll while keeping vertical scroll for long chains
        rows.style.overflowY = 'auto';
        rows.style.overflowX = 'hidden';
      }

      // Responsive keyboard sizing (CSS vars used in the DOM CSS)
      if (wrap) {
        const kbScale = Math.max(0.82, Math.min(1.0, safe.w / 390));
        wrap.style.setProperty('--kb-gap', `${Math.round(6 * kbScale)}px`);
        wrap.style.setProperty('--kb-pad', `${Math.round(8 * kbScale)}px`);
        wrap.style.setProperty('--kb-key-h', `${Math.round(44 * kbScale)}px`);
        wrap.style.setProperty('--kb-key-pad-x', `${Math.round(10 * kbScale)}px`);
        wrap.style.setProperty('--kb-font', `${Math.round(16 * kbScale)}px`);
      }

     }
   
     /* ---------- State ---------- */
     private points = 0;
     private pointsEl!: HTMLSpanElement;
     private clockEl!: HTMLSpanElement;
     private levelStartMs = 0;
     private pausedAccumMs = 0;
     private pauseStartedAt: number | null = null;
     private clockTick?: number;
     private clockTickFn?: () => void;

   
     private isNight = false;
     private levelIconEl!: HTMLDivElement;
     private themeToggleEl!: HTMLButtonElement;
   
     // Inventory powerup bar (nullable so it won't crash if not found)
	private lockKeyBadgeEl: HTMLSpanElement | null = null;
     private invLockKeyBtn!: HTMLButtonElement;
     private invLockKeyCountEl!: HTMLSpanElement;
     

   
     private livesEl!: HTMLDivElement;
     private heartSlots = 4;
     private lockedSlots = 0;
     private halfLives = 8;
   
     private modalOverlayEl!: HTMLDivElement;
     private livesOverlayEl!: HTMLDivElement;
     private livesCdEl!: HTMLDivElement;
     private powerupOverlayEl?: HTMLDivElement;
     
   
     private static readonly HINT_COOLDOWN_MS  = 15 * 60 * 1000;
     private static readonly LIVES_COOLDOWN_MS = 60 * 60 * 1000;
     private livesNextAt: number | null = null;
     private livesCdTimer?: number;
   
     private tier1Consec = 0;
     private tier2Consec = 0;
     private tier3Consec = 0;
     private inTier1 = false;
     private inTier2 = false;
     private inTier3 = false;
     private tier1CycleIndex = 0;
     private tier2CycleIndex = 0;
     private tier3CycleIndex = 0;
     private tier3ConsecAwards = 0;
   
     //private answerKeyEl!: HTMLDivElement;
private sceneEl: HTMLElement | null = null;
private slots: SlotState[] = [];
private currentSlotIndex = 0;
private lockedSlots = 0;
     // ⭐ Star meter configuration
private starMeterEl!: HTMLDivElement;
private starMeterFillEl!: HTMLDivElement;
private starSlotsEls: HTMLSpanElement[] = [];

// Default thresholds (can be overridden per-level via spec.starTimes)
private starThreeMs = 90_000;   // <= 1:30 → 3 stars
private starTwoMs   = 180_000;  // <= 3:00 → 2 stars
private starOneMs   = 290_000;  // <= 4:50 → 1 star

// ⭐ Render earned stars on recap overlay
private renderRecapStars(earnedStars: number) {
  if (!this.recapStarsEl) return;

  const clamped = Math.max(0, Math.min(3, earnedStars));
  const full   = '★'.repeat(clamped);
  const empty  = '☆'.repeat(3 - clamped);

  // Show full + empty so player sees what they missed too
  this.recapStarsEl.textContent = full + empty;
}




     // ⭐ Recap overlay elements
     private recapOverlayEl!: HTMLDivElement;
     private recapSummaryEl!: HTMLDivElement;
     private recapStarsEl!: HTMLDivElement;
     private recapContinueBtnEl!: HTMLButtonElement;
     private recapDiamondEl?: HTMLElement;
     private recapHasNextLevel = false;
     // ⭐ Pre-level panel
private preLevelOverlayEl!: HTMLDivElement;
private preLevelTextEl!: HTMLDivElement;
private preLevelStartBtnEl!: HTMLButtonElement;





    // Inventory powerup bar (3 slots, slot 0 is used for Lock Key for now)
    private powerBarEl!: HTMLDivElement;




// === TRAPS: helper – is a given slot locked? (respecting releases) ===
private isSlotLocked(index: number): boolean {
  const state: any = getTrapStateSafe();
  if (!state || !state.lockedIndices || typeof state.lockedIndices.has !== "function") {
    return false;
  }
  if (this.releasedLocks.has(index)) return false;
  return state.lockedIndices.has(index);
}

private isAnyOverlayOpen(): boolean {
  return (
    (this.modalOverlayEl && this.modalOverlayEl.style.display === 'flex') ||
    (this.livesOverlayEl && this.livesOverlayEl.style.display === 'flex') ||
    (this.powerupOverlayEl && this.powerupOverlayEl.style.display === 'flex') ||
    (this.preLevelOverlayEl && this.preLevelOverlayEl.style.display === 'flex') ||
    (this.recapOverlayEl && this.recapOverlayEl.style.display === 'flex')
  );
}


private findNextUnlockedSlot(startIndex: number): number {
  const len = this.slots.length;
  if (len === 0) return -1;

  // Walk through all slots at most once, wrapping around.
  for (let step = 0; step < len; step++) {
    const idx = (startIndex + step) % len;
    const slot = this.slots[idx];
    if (!slot) continue;

    // We only want rows that:
    //  - are NOT locked, and
    //  - are NOT complete (still have blanks)
    if (!this.isSlotLocked(idx) && !this.isRowComplete(slot)) {
      return idx;
    }
  }

  // No unlocked + incomplete slots found
  return -1;
}


// === TRAPS: reflect lockdown indices on the DOM rows ===
private refreshLockedFromTraps() {
  const state: any = getTrapStateSafe();
  if (!state || !state.lockedIndices || typeof state.lockedIndices.has !== "function") return;

  this.lockedSlots = 0;

  this.slots.forEach((slot, index) => {
    const lockedByTrap = state.lockedIndices.has(index);
    const isLocked = lockedByTrap && !this.releasedLocks.has(index);

    if (isLocked) {
      slot.boxEl.classList.add("trap-locked");
      slot.rowEl.classList.add("trap-locked");
      this.lockedSlots++;
    } else {
      slot.boxEl.classList.remove("trap-locked");
      slot.rowEl.classList.remove("trap-locked");
    }
  });

  console.log("[TRAP] refreshLockedFromTraps", {
    locked: this.lockedSlots,
  });
}

private async syncHeartsFromHalfLives(): Promise<void> {
  const dataManager = DataManager.getInstance();

  const maxHearts = this.heartSlots;
  const hearts = Math.max(0, Math.min(Math.ceil(this.halfLives / 2), maxHearts));

  await dataManager.updatePlayerState({
    hearts,
    max_hearts: maxHearts,
  });
}


private isBlockingModalOpen(): boolean {
  return this.livesModalOpen || this.modalOverlayEl?.style.display === 'flex';
}


private async loseLifeAndReturnToMap(): Promise<void> {
  const dataManager = DataManager.getInstance();
  const playerState = dataManager.getCachedPlayerState
    ? dataManager.getCachedPlayerState()
    : null;

  const DEFAULT_MAX_LIVES = 3;
  const DEFAULT_MAX_HEARTS = 4;

  const maxLives = playerState?.max_lives ?? DEFAULT_MAX_LIVES;
  const currentLivesRaw = playerState?.lives ?? maxLives;
  const newLives = Math.max(0, currentLivesRaw - 1);

  const maxHearts =
    playerState?.max_hearts ??
    (this.heartSlots > 0 ? this.heartSlots : DEFAULT_MAX_HEARTS);

  // IMPORTANT: wait for updatePlayerState to finish (so cache is updated)
  await dataManager.updatePlayerState({
    lives: newLives,
    max_lives: maxLives,
    hearts: maxHearts,
    max_hearts: maxHearts,
  });

  this.closeLivesModal();
  this.scene.start('WorldMapScene', { land: 1, level: 1 });
}





  // === TRAPS: flash "unlocked" icon and pause clock briefly ===
  private flashUnlockIcon(rowIndex: number) {
    const slot = this.slots[rowIndex];
    if (!slot) return;

    // Visually mark this row as freshly unlocked
    slot.boxEl.classList.add("trap-unlocked-flash");
    slot.rowEl.classList.add("trap-unlocked-flash");

    // Use the same pause mechanism as visibility changes, but for a fixed duration
    let pausedByFlash = false;
    let flashPauseStart = 0;

    if (!this.pauseStartedAt) {
      pausedByFlash = true;
      flashPauseStart = performance.now();
      this.pauseStartedAt = flashPauseStart;
    }

    window.setTimeout(() => {
      // Remove the open-lock flash
      slot.boxEl.classList.remove("trap-unlocked-flash");
      slot.rowEl.classList.remove("trap-unlocked-flash");

      // If we were the ones who paused the clock, finalize that pause
      if (pausedByFlash && this.pauseStartedAt === flashPauseStart) {
        const now = performance.now();
        this.pausedAccumMs += now - flashPauseStart;
        this.pauseStartedAt = null;
      }
    }, 1500);
  }


   
     private boundNativeKey?: (e: KeyboardEvent) => void;
     private focusTrap!: HTMLInputElement;
   
     private inputMode: InputMode = 'keyboard';
     private isHardPaused = false;

   
     // Wheel
     private wheelNodes: HTMLDivElement[] = [];
private wheelPath: number[] = [];
private wheelSvg?: SVGSVGElement;
private wheelPolyline?: SVGPolylineElement;
private wheelRAF = 0;

// Raw pointer (wheel-local pixels)
private ptrX = 0; 
private ptrY = 0;

// Pointer in “edge space” (after scale + offset)
private ptrEdgeX = 0;
private ptrEdgeY = 0;

// Raw (node) centers and transformed (edge-space) centers
private wheelRawCenters: {x:number;y:number}[] = [];
private wheelCenters: {x:number;y:number}[] = [];

// Node-space center for transforms
private wheelNodeCenter = { x: 0, y: 0 };

// ✅ Manual tuning knobs for the SVG/edges layer ONLY
private wheelEdgeOffsetX = 0;  // +right / -left
private wheelEdgeOffsetY = 0;  // +down  / -up
// ✅ Persistent, resize-safe edge correction (percent of wheel size)
private wheelEdgeOffsetXPct = 0; // e.g. 0.05 means 5% of wheel width
private wheelEdgeOffsetYPct = 0; // e.g. 0.05 means 5% of wheel height

private wheelEdgeScale = 1;    // radius scale (1 = normal)
private wheelEdgeCenterLocked = false;
private wheelEdgeCenterLockScreen = { x: 0, y: 0 }; // screen pixels
private wheelWheelRect = { left: 0, top: 0 };       // cached for locking

private wheelResizeObserver?: ResizeObserver;

// Hotkeys binder
private boundWheelTuneKey?: (e: KeyboardEvent) => void;
private onLayoutResize = () => {
  this.applyLayoutTuning();
};


   
     constructor() { super('GameplayScene'); }

     
   
     /* ---------- INIT ---------- */
     init(data: RoundParams) {
       this.dataManager = DataManager.getInstance();
       this.initializeAsync(data);
   
       const level = Number((data && data.level) ?? 1);
       this.spec = DEMO_LEVELS.find(s => s.level === level) ?? DEMO_LEVELS[0];
           // Set land-based visual flag on <body> so CSS can change backgrounds

           

           // ⭐ Optional per-level star timing overrides
// In your LevelSpec, you can define:
// starTimes?: { threeMs: number; twoMs: number; oneMs: number }
const starTimes = (this.spec as any).starTimes;
if (starTimes) {
  if (typeof starTimes.threeMs === 'number') this.starThreeMs = starTimes.threeMs;
  if (typeof starTimes.twoMs   === 'number') this.starTwoMs   = starTimes.twoMs;
  if (typeof starTimes.oneMs   === 'number') this.starOneMs   = starTimes.oneMs;
}

            // 🔁 RESET per-level flags here
  this.levelCompleted = false;      // <-- ADD THIS
  this.noMovesHandled = false;      // (optional extra safety if you want it here too)


    const landMeta = getLandMeta(this.spec.land);
    document.body.dataset.land = String(landMeta.id);

       console.log("[LEVEL SPEC PICKED]", {
        id: this.spec.id,
        kind: this.spec.kind,
        land: this.spec.land,
        level: this.spec.level,
      });
      
   
       const prevCombo = (window as any).__comboValue__ as number | undefined;
       this.initialComboValue = (typeof prevCombo === 'number' && prevCombo >= T1)
         ? Math.min(COMBO_MAX, Math.max(prevCombo, COMBO_MIN))
         : COMBO_MIN;
       (window as any).__comboValue__ = this.initialComboValue;
   
       this.points = 0;
       
       // 🔹 Pull hearts from cached player state (no async/await here)
       const dataManager = DataManager.getInstance();
       const playerState = dataManager.getCachedPlayerState
         ? dataManager.getCachedPlayerState()
         : null;
       
       const DEFAULT_MAX_HEARTS = 4;
       
       const maxHearts = playerState?.max_hearts ?? DEFAULT_MAX_HEARTS;
       const currentHeartsRaw = playerState?.hearts ?? maxHearts;
       const currentHearts = Math.max(0, Math.min(currentHeartsRaw, maxHearts));
       
       this.heartSlots = maxHearts;
       this.lockedSlots = 0;
       
       // 👇 Use *current* hearts, not always full
       this.halfLives = currentHearts * 2;
       
       this.livesNextAt = null;
       

   
       this.tier1Consec = this.tier2Consec = this.tier3Consec = 0;
       this.inTier1 = this.inTier2 = this.inTier3 = false;
       this.tier1CycleIndex = this.tier2CycleIndex = this.tier3CycleIndex = 0;
       this.tier3ConsecAwards = 0;
   
       this.currentSlotIndex = 0;
       this.slots = [];
   
       const persistedNight = (window as any).__isNight__;
       if (typeof persistedNight === 'boolean') this.isNight = persistedNight;
   
       const persistedMode = (window as any).__inputMode__;
       if (persistedMode === 'wheel' || persistedMode === 'keyboard') this.inputMode = persistedMode;
     }

     private async hydrateHeartsFromSavedState(): Promise<void> {
      const dm = DataManager.getInstance();
      const state = await dm.getPlayerState(); // whatever your getter is called
    
      // Use saved hearts as truth
      const savedMax = state?.max_hearts ?? this.heartSlots;
      const savedHearts = Math.max(0, Math.min(state?.hearts ?? savedMax, savedMax));
    
      this.heartSlots = savedMax;
    
      // Derive halfLives from hearts so it can’t “restart” from stale values
      this.halfLives = savedHearts * 2;
    
      this.refreshHeartsUI?.(); // call your actual UI refresh method
    
      if (savedHearts <= 0) {
        this.enterOutOfHeartsState();
      }
    }

    
    
   
     private async initializeAsync(_: RoundParams) {
       try {
         const enhancedWheelMode = await this.dataManager.featureFlag('enable_wheel_mode_v2');
         const wheelMode = await getWheelMode(); // 'aligned' | 'baseline'
         const persistedMode = (window as any).__inputMode__;
         if (!persistedMode) {
           this.inputMode = enhancedWheelMode ? 'wheel' : 'keyboard';
           (window as any).__inputMode__ = this.inputMode;
         }
         if (wheelMode === 'aligned') DebugBus.hud.set('wheelMode', 'aligned');
       } catch { /* keep defaults */ }
     }

     

     
   
     /* ---------- CREATE ---------- */
     create(): void {
       this.cameras.main.fadeIn(150, 0, 0, 0);
       DebugBus.hud.init(this);
       DebugBus.hud.set('scene', 'GameplayScene');
       DebugBus.hud.set('inputMode', this.inputMode);

         // Global save / lives manager
  this.gameData = GameDataManager.getInstance();
  this.noMovesHandled = false;
  this.createMenuButton();

  


        // TRAPS: clear any play-key releases from previous level
  this.releasedLocks.clear();
   
       const { level, words } = this.spec;

       // Override default star thresholds if this level specifies custom times
if (this.spec.starTimes) {
  this.starThreeMs = this.spec.starTimes.threeMs ?? this.starThreeMs;
  this.starTwoMs   = this.spec.starTimes.twoMs   ?? this.starTwoMs;
  this.starOneMs   = this.spec.starTimes.oneMs   ?? this.starOneMs;
}


       
   
       /* Start word as indexless first row INSIDE word area */
       const startWord = words[0];
       const startCells = Array.from(startWord).map((ch, j) => `
         <span class="cell prefill" data-col="${j}">
           <span class="ch">${ch.toUpperCase()}</span>
           <span class="u"></span>
         </span>
       `).join('');
       const startRowHtml = `
         <div class="row startRow" id="startRow" aria-hidden="false">
           <span class="idx"></span>
           <div class="cells" id="box_start" data-len="${startWord.length}" style="
             display:inline-grid;
             grid-template-columns: repeat(${startWord.length}, 1ch);
             column-gap:.35ch; align-items:end;">
             ${startCells}
           </div>
           <span class="ok" aria-hidden="true"></span>
         </div>
       `;
   
       const rowsHtml = words.slice(1).map((w, i) => {
         const L = w.length;
         const cells = Array.from({ length: L }).map((_, j) => `
           <span class="cell" data-col="${j}">
             <span class="ch"></span>
             <span class="u"></span>
           </span>
         `).join('');
         return `
           <div class="row" id="row_${i}">
             <span class="idx">${i + 1}.</span>
             <div class="cells" id="box_${i}" data-len="${L}" style="
               display:inline-grid;
               grid-template-columns: repeat(${L}, 1ch);
               column-gap:.35ch; align-items:end;">
               ${cells}
             </div>
             <span class="ok" id="ok_${i + 1}" aria-hidden="true"></span>
           </div>
         `;
       }).join('');
   
       const answerKey = `${words[0]} → ${words.slice(1).join(' → ')}`;
   
       

/* ---------- HTML ---------- */
       const html = basicColumn(`
         <style>

         :root {
          --pre-title-size: 32px;
          --pre-title-color: #ffffff;
        
          --pre-goal-size: 22px;
          --pre-goal-color: #dbeafe;
        
          --pre-star-size: 48px;
          --pre-star-color: #ffd700;
        
          --pre-btn-bg: linear-gradient(90deg,#34d399,#10b981);
          --pre-btn-size: 22px;

          --pre-star-size: 48px;
          --pre-star-color: #facc15;
          --pre-star-gap: 10px;
          --pre-star-margin-bottom: 24px;
          --pre-star-shadow: 0 0 10px rgba(0,0,0,0.75);
        }
        
         :root {
          /* Will be decided at runtime based on background brightness */
          --ww-word-text: #ffffff;
          --ww-ui-text:   #ffffff;
        }
    
           #wrap_root { position:absolute; inset:auto; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; color:#fff; overflow:hidden; }
           #gameTitle { position:absolute; top:0; left:0; height:44px; display:flex; align-items:center; justify-content:center; font-weight:900; letter-spacing:0.3px; background:rgba(0,0,0,.18); user-select:none; cursor:pointer; z-index:10; }
           .wrapInner {
            position:absolute;
            left:0; right:0; top:44px; bottom:0;
            display:flex;
            flex-direction:column;
            gap:10px;
          
            /* ✅ single source of truth for bottom safe space */
            padding: 10px 12px calc(10px + var(--wr-banner-safe, 0px)) 12px;
          
            overflow:hidden;
          }
          
   
           /* Top: clock left (sticky relative to safe box). Points removed from here. */
           #clockRow { display:flex; align-items:center; justify-content:flex-start; gap:12px; }
           .clockLeft {
            font-size:14px;
            opacity:.9;
            color: var(--ww-ui-text);
          }
           .clusterRight { margin-left:auto; display:flex; align-items:center; gap:8px; }
           .adminToggle, .adminBtn { padding:4px 8px; font-size:12px; border-radius:8px; cursor:pointer; }
           .adminToggle { border:1px solid rgba(255,255,255,.15); background:#1a1d2a; color:#fff; }
           .adminBtn    { border:1px solid rgba(255,140,0,.5); background:#2a1a0a; color:#ffa500; }
   
           /* Hint row: left (hint + text), right shelf: level icon then hearts (level is "near-right") */
           #hintBar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 8px; }
           .hintLeft { display:flex; align-items:center; gap:8px; min-width:0; }
           .bulbBtn { border:0; background:#2b2e3b; color:#fff; padding:6px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px; }
           .text { font-size:16px; font-weight:600; min-height:20px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:52vw; }
           .badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; padding:0 4px; border-radius:999px; background:#4bce97; color:#0b1f16; font-size:12px; font-weight:800; line-height:1; }
   
           .rightShelf { display:flex; align-items:center; gap:10px; }
           /* Inventory bar */
           .inventoryBar {
             display:flex;
             align-items:center;
             justify-content:flex-start;
             gap:8px;
             padding:4px 12px 0 12px;
           }
           .invItem {
             display:inline-flex;
             align-items:center;
             gap:6px;
             padding:6px 10px;
             border-radius:10px;
             border:1px solid rgba(255,255,255,0.2);
             background:rgba(10,12,24,0.85);
             color:#ffffff;
             font-size:13px;
             cursor:pointer;
           }
           .invItem:disabled {
             opacity:0.4;
             cursor:default;
           }
           .invIcon {
             font-size:16px;
           }
           .invLabel {
             font-weight:600;
           }
           .invCount {
             font-weight:800;
             font-size:12px;
             padding:2px 6px;
             border-radius:999px;
             background:#2ee86c;
             color:#05140a;
           }

           .levelIcon { position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; }
           .levelIcon .num { position:absolute; font-weight:900; font-size:14px; color:#0b1220; }
           .sun { width:36px; height:36px; border-radius:50%; background:#ffd54f; box-shadow:0 0 10px rgba(255,213,79,.6); }
           .moon { position:relative; width:36px; height:36px; border-radius:50%; background:#9fa8da; overflow:hidden; }
           .moon::after{ content:''; position:absolute; width:36px; height:36px; background:#0f1220; border-radius:50%; left:10px; top:0; }
           .moonInnerLine { position:absolute; left:10px; top:0; width:36px; height:36px; border-radius:50%; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.3); }
           .moonNum { position:absolute; font-weight:900; font-size:13px; color:#ffffff; left:14px; bottom:8px; transform:translateX(-2px); }
   
           .lives { display:flex; gap:6px; align-items:center; }
           .heartSvg { display:inline-flex; width:22px; height:22px; }
           .heartSvg svg { display:block; }

           /* Inventory bar slots: empty slots are always dim */
.powerSlot.empty {
  opacity: 0.4;
}

/* When a button is empty, hide its icon/badge/count */
.powerBtn.empty .icon,
.powerBtn.empty .powerBadge,
.powerBtn.empty .count {
  opacity: 0;
}


.powerBarInner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(8, 14, 30, 0.7);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}

.powerSlot {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* Inventory Powerup Bar */
.powerBar {
  margin-top: 4px;
  margin-bottom: 2px;
  display: flex;
  justify-content: center;
}
.powerBarInner {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  box-shadow: 0 0 10px rgba(0,0,0,.35);
}
.powerSlot {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 0 1px rgba(255,255,255,.18), inset 0 0 6px rgba(0,0,0,.5);
  transition: opacity 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
}
.powerSlot-empty {
  opacity: 0.35;
  background: rgba(8,12,24,0.5);
}
.powerSlot-filled {
  opacity: 1;
  background: radial-gradient(circle at 30% 30%, #ffffff, #bbe6ff);
}
.powerSlot-filled:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px rgba(255,255,255,.35), 0 3px 8px rgba(0,0,0,.6);
}
.powerIconWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(var(--wr-gameplay-lift));
will-change: transform;

}
.powerIcon {
  font-size: 18px;
  line-height: 1;
}
.powerBadge {
  position: absolute;
  right: -6px;
  bottom: -6px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #4bce97;
  color: #0b1f16;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 0 4px rgba(0,0,0,.6);
}


/* Dim icon when there are zero of that powerup */
.powerSlot[data-slot="lockKey"].empty .powerIconWrap {
  opacity: 0.25;
  box-shadow: none;
}

/* Inventory: empty slots are dim */
.powerSlot.empty {
  opacity: 0.45;
}

#hintNoThanks:hover { text-decoration: underline; }
#hintNoThanks:active { text-decoration: underline; }


   
           /* Score centered above combo; combo above word box */
           .scoreCenter {
            text-align:center;
            font-size:22px;
            font-weight:800;
            /* For auto-contrast, we drop the gradient and use a solid color */
            background: none;
            -webkit-background-clip: initial;
            background-clip: initial;
            color: var(--ww-ui-text);
            text-shadow: none;
          }
   
           .combo { margin:2px auto 0 auto; position:relative; width:min(280px, 92%); height:18px; border-radius:999px;
             background: rgba(255,255,255,0.12); box-shadow: inset 0 0 8px rgba(255,255,255,.15), 0 2px 6px rgba(0,0,0,.2); overflow:visible; }
           .combo::after { content:''; position:absolute; inset:0; border-radius:999px; background: linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.05)); pointer-events:none; }
           .comboFill { position:absolute; left:0; top:0; bottom:0; width:1%; background: linear-gradient(90deg, #2ee86c, #ffd54f, #ff4d4d);
             border-radius:999px 0 0 999px; transition: width 120ms linear; }
           .th { position:absolute; top:-2px; bottom:-2px; width:2px; background: rgba(255,255,255,.35); box-shadow:0 0 6px rgba(255,255,255,.25); }
           .t1 { left:40%; } .t2 { left:65%; } .t3 { left:80%; }

           /* ⭐ Star challenge meter: bar behind 3 big stars */
.starMeter {
  margin: 4px auto 0 auto;
  position: relative;
  width: min(260px, 92%);
  height: 32px;                    /* tall enough for heart-sized stars */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ⭐ Dedicated PRE overlay gold stars row */
#preLevelStarsRow {
  font-size: var(--pre-star-size, 48px);
  color: var(--pre-star-color, #facc15);
  text-shadow: var(--pre-star-shadow, 0 0 10px rgba(0,0,0,0.75));
  margin-bottom: var(--pre-star-margin-bottom, 24px);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--pre-star-gap, 10px);
}


/* Track behind the stars */
.starMeterTrack {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
  z-index: 0;
}

/* Fill that shrinks over time, also behind the stars */
.starMeterFill {
  position: absolute;
  left: 12px;
  right: 12px;              /* ✅ match track inset */
  top: 50%;
  transform: translateY(-50%);

  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #facc15, #f97316);

  /* width will be set in px by JS; keep overflow safe */
  max-width: calc(100% - 24px);
  transition: width 0.2s linear;
  z-index: 0;
}


/* Row of stars centered on top of the bar */
.starMeterStars {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Base star style – roughly heart-sized */
.starSlot {
  font-size: 22px;                 /* hearts are ~22px tall */
  line-height: 22px;
  text-shadow: 0 0 6px rgba(0,0,0,0.7);
  color: #facc15;
  transition: transform 0.12s ease, opacity 0.12s ease, color 0.12s ease;
}

/* Center star ~15% bigger */
.starSlot-middle {
  transform: scale(1.15);
}

/* Dimmed / lost stars */
.starSlot.dim {
  opacity: 0.35;
  color: #9ca3af;
  text-shadow: 0 0 4px rgba(0,0,0,0.4);
}





   
/* Rows/word area */
.rowsWrap{
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;

  min-width: 0;
  min-height: 0;

  /* ✅ THIS controls the bottom edge of the wordbox */
  padding-bottom: 10px;   /* ↑ increase to raise the bottom */
}




/* Wrap score + combo + wordbox so they behave like before (no stretching) */
.wordStage{
  position: relative;

  /* ✅ THIS is the missing constraint: make this a vertical flex container */
  display: flex;
  flex-direction: column;

  /* ✅ Allow it to take remaining height inside .wrapInner */
  flex: 1 1 auto;

  /* ✅ Critical for scroll children in a flex column */
  min-height: 0;

  /* Your existing sizing behavior */
  width: 100%;
  max-width: var(--wr-wordbox-max-w, 680px);
  min-width: var(--wr-wordbox-min-w, 320px);
  margin: 0 auto;

  padding-left: calc(var(--wr-wordbox-pad-l, 0px) + var(--wr-ruut-reserved-w, 0px));
  padding-right: var(--wr-wordbox-pad-r, 0px);
  padding-top: var(--wr-wordbox-pad-t, 0px);
  padding-bottom: var(--wr-wordbox-pad-b, 0px);

  box-sizing: border-box;

  /* optional: keeps layout tight */
  gap: 8px;
}



/* Ruut companion: absolutely positioned so it does NOT change layout */
#ruutCompanion{
  position: fixed;                 /* ✅ screen-anchored */
  left: var(--wr-ruut-x);
  bottom: calc(var(--wr-ruut-y) + var(--wr-banner-safe));

  width: 92px;
  height: 134px;

  background-repeat: no-repeat;
  background-position: 0px 0px;
  background-size: 368px 134px;

  pointer-events: none;
  filter: drop-shadow(0 10px 10px rgba(0,0,0,0.35));

  --ruut-extra-tx: 0px;
  --ruut-extra-rot: 0deg;

  transform-origin: 50% 100%;
  transform:
    translate(var(--ruut-extra-tx), 0px)
    rotate(var(--ruut-extra-rot))
    scale(var(--wr-ruut-scale));
  z-index: 9999;                   /* ✅ stays on top */
}




/* Idle: subtle bob */
#ruutCompanion.idle{
  animation: none;
}


/* Happy: walk-cycle (same size you said you like) */
#ruutCompanion.happy{
  animation: ruutWalk 0.45s steps(4) infinite;
}

/* Sad: shake */
#ruutCompanion.sad{
  animation: ruutSad 0.35s ease-in-out 2;
}

@keyframes ruutWalk{
  from{ background-position-x: 0px; }
  to  { background-position-x: -368px; }
}

@keyframes ruutBob{
  0%,100%{ transform: translateY(0px); }
  50%    { transform: translateY(-4px); }
}

#ruutCompanion.sad{
  animation: ruutSad 0.35s ease-in-out 2;
}

@keyframes ruutSad{
  0%   { --ruut-extra-tx: 0px; }
  25%  { --ruut-extra-tx: -3px; }
  50%  { --ruut-extra-tx: 3px; }
  75%  { --ruut-extra-tx: -2px; }
  100% { --ruut-extra-tx: 0px; }
}




/* Default (all lands): dark translucent panel */
#rows {
  min-height: 0; /* ✅ allows scrolling instead of forcing height growth */

  position:relative;
  flex: 0 1 auto;
  padding:8px;
  border-radius:12px;
  min-width:0;
  max-width:100%;
  /* ✅ STOP infinite stretching; become scrollable instead */
  max-height: clamp(17px, 28vh, 26px);
  min-height: 17px;


  /* ✅ kill horizontal scroll */
  overflow-y:auto;
  overflow-x:hidden;
  overscroll-behavior: contain;
  scrollbar-gutter: stable both-edges;

  /* panel */
  background-color: var(--rows-bg, rgba(5, 10, 20, 0.45));
  box-shadow: var(--rows-shadow, 0 0 12px rgba(0, 0, 0, 0.45));
  backdrop-filter: blur(var(--rows-blur, 4px));
  -webkit-backdrop-filter: blur(var(--rows-blur, 4px));
}

/* Flex children must be allowed to shrink (prevents X overflow in flex layouts) */
.rowsWrap, #rows, .rows, .row, .cells { min-width:0; }
.cells { max-width:100%; overflow:hidden; }

/* Land 1: light "mist" word area panel */
body[data-land="1"] {
  --rows-bg: rgba(255, 255, 255, 0.25);
  --rows-shadow: 0 4px 22px rgba(0, 0, 0, 0.25);
  --rows-blur: 12px;
}


          .overlay {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          
          /* Pre-level overlay: ombré frost + purple vignette */
.overlayPreLevel {
  background:
    radial-gradient(circle at 50% 25%, rgba(147, 197, 253, 0.25), transparent 10%),
    radial-gradient(circle at 50% 120%, rgba(129, 140, 248, 0.55), rgba(15, 23, 42, 0.95));
  position: relative;
}

/* Stronger directional blur toward wordbox */
.overlayPreLevel::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  /* Ombre direction: more blurry toward bottom */
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.0) 25%,
    rgba(255, 255, 255, 0.0) 50%,
    rgba(255, 255, 255, 0.0) 70%,
    rgba(255, 255, 255, 0.35) 85%,
    rgba(255, 255, 255, 0.45) 100%
  );

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 1; /* blur layer */
}

/* ⭐ Put overlay content ABOVE blur layer */
.overlayPreLevel .modal {
  position: relative;
  z-index: 2;
}

/* ⭐ Stylize title using CSS variables */
.overlayPreLevel #preLevelTitle {
  font-size: var(--pre-title-size, 30px);
  font-weight: var(--pre-title-weight, 900);
  color: var(--pre-title-color, #ffffff);
  text-shadow: var(--pre-title-shadow, 0 0 12px rgba(0,0,0,0.5));
  margin-bottom: 10px;
  margin-left: 50px;

}

/* ⭐ Stylize main text */
.overlayPreLevel #preLevelText {
  font-size: var(--pre-goal-size, 20px);
  font-weight: var(--pre-goal-weight, 700);
  color: var(--pre-goal-color, #e2e8f0);
  text-shadow: var(--pre-goal-shadow, 0 0 6px rgba(0,0,0,0.6));
  margin-bottom: 18px;
  text-align: center;
}

<div id="preLevelStarsRow" class="preStars">★ ★ ★</div>


/* ⭐ Inline stars inside the pre-level text */
.overlayPreLevel .preTextStars {
  color: #facc15;                 /* gold */
  font-size: 1.3em;               /* bigger than the text */
  text-shadow: 0 0 8px rgba(0,0,0,0.75);
}



/* ⭐ Gold stars row, fully customizable */
.overlayPreLevel .preStars {
  font-size: var(--pre-star-size, 48px);
  color: var(--pre-star-color, #facc15);
  text-shadow: var(--pre-star-shadow, 0 0 10px rgba(0,0,0,0.75));
  margin-bottom: var(--pre-star-margin-bottom, 24px);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--pre-star-gap, 10px);
}

/* ⭐ Use same star styling on recap overlay */
.overlayPreLevel .preStars,
.overlayRecap .preStars {
  font-size: var(--pre-star-size, 48px);
  color: var(--pre-star-color, #facc15);
  text-shadow: var(--pre-star-shadow, 0 0 10px rgba(0,0,0,0.75));
  margin-bottom: var(--pre-star-margin-bottom, 24px);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--pre-star-gap, 10px);
}



/* ⭐ Style Play button with variables */
.overlayPreLevel #preLevelStart {
  font-size: var(--pre-btn-size, 20px);
  padding: var(--pre-btn-pad, 12px 22px);
  background: var(--pre-btn-bg, rgba(46,232,108,0.9));
  color: var(--pre-btn-color, #0b1f16);
  border-radius: var(--pre-btn-radius, 12px);
  font-weight: var(--pre-btn-weight, 900);
  cursor: pointer;
  border: 0;
  margin-left: 50px;
  box-shadow: var(--pre-btn-shadow, 0 4px 12px rgba(0,0,0,0.3));
  transition: transform .12s ease, box-shadow .12s ease;
}

.overlayPreLevel #preLevelStart:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.35);
}

/* === Post-level recap overlay: frosted blue variant of pre-level === */
.overlayRecap {
  background:
    radial-gradient(circle at 50% 25%, rgba(96, 165, 250, 0.35), transparent 60%),
    radial-gradient(circle at 50% 120%, rgba(37, 99, 235, 0.7), rgba(15, 23, 42, 0.98));
  position: relative;
}

/* Blue frosted blur toward bottom (wordbox area) */
.overlayRecap::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  background: linear-gradient(
    to bottom,
    rgba(191, 219, 254, 0.0) 0%,
    rgba(191, 219, 254, 0.0) 40%,
    rgba(191, 219, 254, 0.25) 70%,
    rgba(191, 219, 254, 0.4) 100%
  );

  /* Frosted blur toward bottom, like recap */
.overlayVs::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  background: linear-gradient(
    to bottom,
    rgba(191, 219, 254, 0.0) 0%,
    rgba(191, 219, 254, 0.0) 40%,
    rgba(191, 219, 254, 0.25) 70%,
    rgba(191, 219, 254, 0.4) 100%
  );

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 1;
}

/* Make sure the 1v1 modal content sits above the blur */
.overlayVs .modal {
  position: relative;
  z-index: 2;
}

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 1;
}

/* Put recap content ABOVE blur */
.overlayRecap .modal {
  position: relative;
  z-index: 2;
}

/* Title style for recap – reuse same variables if you like */
.overlayRecap #recapTitle {
  font-size: var(--pre-title-size, 30px);
  font-weight: var(--pre-title-weight, 900);
  color: var(--pre-title-color, #ffffff);
  text-shadow: var(--pre-title-shadow, 0 0 12px rgba(0,0,0,0.5));
  margin-bottom: 10px;
  margin-left: 50px;
}

/* Main recap text */
.overlayRecap #recapSummary {
  font-size: var(--pre-goal-size, 20px);
  font-weight: var(--pre-goal-weight, 700);
  color: var(--pre-goal-color, #e2e8f0);
  text-shadow: var(--pre-goal-shadow, 0 0 6px rgba(0,0,0,0.6));
  margin-bottom: 18px;
  text-align: center;
}

/* Continue button styled same as pre-level Play */
.overlayRecap #recapContinue {
  font-size: var(--pre-btn-size, 20px);
  padding: var(--pre-btn-pad, 12px 22px);
  background: var(--pre-btn-bg, rgba(46,232,108,0.9));
  color: var(--pre-btn-color, #0b1f16);
  border-radius: var(--pre-btn-radius, 12px);
  font-weight: var(--pre-btn-weight, 900);
  cursor: pointer;
  border: 0;
  margin-left: 50px;
  box-shadow: var(--pre-btn-shadow, 0 4px 12px rgba(0,0,0,0.3));
  transition: transform .12s ease, box-shadow .12s ease;
}

.overlayRecap #recapContinue:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.35);
}



          
          /* Post-level recap overlay: blue vignette */
          .overlayRecap {
            background:
              radial-gradient(circle at 50% 25%, rgba(96, 165, 250, 0.35), transparent 60%),
              radial-gradient(circle at 50% 120%, rgba(37, 99, 235, 0.6), rgba(15, 23, 42, 0.95));
          }
          
          /* Pre-level challenge rows */
          .preLevelGoalRow {
            margin-bottom: 10px;
          }
          
          .preLevelTextMain {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.01em;
          }
          
          
          
          /* Bonus challenge descriptions (no-powerups / avoid-trap) */
          .preLevelBonusBlock {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .preLevelBonusLine {
            font-size: 13px;
            font-weight: 600;
            opacity: 0.9;
          }
          
          /* Make Play button a bit bigger */
          #preLevelStart {
            padding: 10px 18px;
            font-size: 15px;
            border-radius: 999px;
            font-weight: 800;
          }
          
          
          
           .row  { display:flex; align-items:center; gap:10px; margin:10px 0; }
           .idx  {
            width:28px;
            text-align:right;
            color: var(--ww-word-text);
            opacity:.85;
          }

           .cells{ position:relative; padding:6px 8px; border-radius:6px; min-height:32px; transition:transform .25s ease; }
           .cells.wrong { border:1px solid #ff4d4d; background-color:rgba(255,77,77,0.12); }
           @keyframes shakeX {
             0% { transform: translateX(0); } 20% { transform: translateX(-6px); }
             40% { transform: translateX(6px); } 60% { transform: translateX(-4px); }
             80% { transform: translateX(4px); } 100%{ transform: translateX(0); }
           }
           .cells.shake { animation: shakeX 250ms ease; }
   
           .cell { width:1ch; display:flex; flex-direction:column; align-items:center; }

           /* All normal letters in the rows use auto-contrast color */
           .ch {
             height:20px;
             line-height:20px;
             font-size:20px;
             font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
             text-transform:lowercase;
             user-select:none;
             color: var(--ww-word-text);
           }

           /* Prefill first letter: still bolder but same auto-contrast color */
           .cell.prefill .ch {
             font-weight:700;
             text-transform:uppercase;
           }

           /* Underlines follow the same word color */
           .u  {
             display:block;
             width:1ch;
             height:2px;
             background: var(--ww-word-text);
             opacity: 0.9;
           }

   
           /* Wheel + confirm pill (unchanged position) */
           #wheelWrap {
            position:relative;
            padding:8px 0;
          
            /* Wheel/table background */
            background-image: url('https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/wheel/wheel_wood_table.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          

          #wheel {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: visible;
            touch-action: none;
          }
          
          
                     
           #wheelSvg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; }
           .wl{
            position:absolute;
            width:44px;height:44px;
            border-radius:50%;
            background:transparent;               /* ✅ removes grey node */
            border:7px solid rgba(255,255,255,.65);
            display:flex;align-items:center;justify-content:center;
            font-weight:900;font-size:50px;color:#fff;
            user-select:none;
            /*box-shadow:none;      */               /* ✅ removes grey “depth” */
            z-index:2;
            transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease;
            text-shadow:0 5px 10px rgba(0,0,0,.85);
            
          }
          .wl.sel{
            border-color:rgba(74,222,128,.95);
            box-shadow:0 0 0 3px rgba(74,222,128,.25),0 0 14px rgba(74,222,128,.35);
            transform:scale(1.06);
          }
          
           .trace { fill:none; stroke:rgba(120,170,255,.9); stroke-width:8; stroke-linecap:round; stroke-linejoin:round; filter: drop-shadow(0 0 6px rgba(90,140,255,.6)); }
           #wheelConfirm { position:absolute; left:50%; transform:translateX(-50%); top:-32px; padding:6px 10px; border-radius:10px; background:rgba(255,255,255,.10); font-weight:800; pointer-events:none; min-width:80px; text-align:center; }
   
           .anskey { font-size:11px; line-height:1.2; opacity:.6; text-align:right; max-width:100%; overflow-wrap:anywhere; word-break:break-word; }

           /* Keyboard (DOM) – responsive via CSS variables set from getSafeRect() */
           .kbWrap { flex:0 0 auto; padding-top:4px; padding-bottom: var(--wr-banner-safe); }
           .kb { width:100%; border-radius:12px; background:#1a1c25; padding: var(--kb-pad, 8px) var(--kb-pad-x, 6px); display:flex; flex-direction:column; gap: var(--kb-gap, 6px); box-sizing:border-box; }
           .kbRow { display:flex; justify-content:center; gap: var(--kb-gap, 6px); }

           .key {
             height: var(--kb-key-h, 44px);
             padding: 0 var(--kb-key-pad-x, 10px);
             border-radius: 10px;
             background:#2b2e3b;
             color:#fff;
             display:flex;
             align-items:center;
             justify-content:center;
             font-size: var(--kb-font, 16px);
             font-weight: 700;
             user-select:none;
             cursor:pointer;
             box-shadow: inset 0 -2px 0 rgba(0,0,0,0.25);
             flex: 1 1 0;
             min-width: 0;
             touch-action: manipulation;
             box-sizing:border-box;
           }
           .key:active { transform: translateY(1px); }

           /* Wider special keys without forcing overflow */
           .key.special { flex: 1.35 1 0; }
           .key.enter  { flex: 1.75 1 0; background:#3a3f52; }
           .key.back   { flex: 1.35 1 0; background:#3a3f52; }

   
           .trap { position:absolute; left:-10000px; width:1px; height:1px; opacity:0; }
           
           /* === Per-land contrast: Land 1 – light mist word area only === */

/* Letters in the word rows */
body[data-land="1"] .rows .row .cell .ch {
  color: #111827; /* dark text on the light mist */
}

/* Underlines for blanks */
body[data-land="1"] .rows .row .u {
  background: #111827;
  opacity: 0.9;
}

/* Row numbering: "1.", "2.", etc. */
body[data-land="1"] .rows .row .idx {
  color: #111827;
  opacity: 0.8;
}

/* Clock / time readout */
body[data-land="1"] #clock {
  color: #111827;
}

/* Score centered above combo bar */
body[data-land="1"] .scoreCenter {
  background: none;
  -webkit-background-clip: initial;
  background-clip: initial;
  color: #111827;
  text-shadow: none;
}

  /* === 1v1 / Versus frosted overlay === */
  .overlayVs {
    background:
      radial-gradient(circle at 50% 25%, rgba(129, 140, 248, 0.35), transparent 60%),
      radial-gradient(circle at 50% 120%, rgba(59, 130, 246, 0.75), rgba(15, 23, 42, 0.98));
    position: relative;
  }

  .overlayVs::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;

    background: linear-gradient(
      to bottom,
      rgba(191, 219, 254, 0.0) 0%,
      rgba(191, 219, 254, 0.0) 40%,
      rgba(191, 219, 254, 0.25) 70%,
      rgba(191, 219, 254, 0.4) 100%
    );

    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 1;
  }

  .overlayVs .modal {
    position: relative;
    z-index: 2;
  }
  /* === 1v1 / Versus frosted overlay === */
  .overlayVs {
    background:
      radial-gradient(circle at 50% 25%, rgba(129, 140, 248, 0.35), transparent 60%),
      radial-gradient(circle at 50% 120%, rgba(59, 130, 246, 0.75), rgba(15, 23, 42, 0.98));
    position: relative;
  }
  
  .overlayVs::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
  
    background: linear-gradient(
      to bottom,
      rgba(191, 219, 254, 0.0) 0%,
      rgba(191, 219, 254, 0.0) 40%,
      rgba(191, 219, 254, 0.25) 70%,
      rgba(191, 219, 254, 0.4) 100%
    );
  
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 1;
  }
  
  .overlayVs .modal {
    position: relative;
    z-index: 2;
  }

         </style>

         

   
         <div id="wrap_root">
         <div id="gameTitle">WordRun</div>
   
           <div class="wrapInner">
             <!-- CLOCK LEFT; right cluster only has admin/theme/mode (points removed) -->
             <div id="clockRow">
               <span class="clockLeft"><span id="clock">00:00</span></span>
               <div class="clusterRight">
                 <button id="themeToggle" class="adminToggle" type="button" title="Toggle Day/Night">Theme</button>
                 <button id="adminBtn" class="adminBtn" type="button" title="Admin Console" style="display:none">⚙️ Admin</button>
                 <button id="modeToggle" class="adminToggle" type="button" title="Toggle Input Mode">Mode</button>
               </div>
             </div>
   
             <!-- HINT LEFT / RIGHT SHELF: level icon then hearts -->
             <div id="hintBar">
               <div class="hintLeft">
                 <button id="hintBtn" class="bulbBtn" type="button" title="Use a hint">
                   <span class="bulbIcon">💡</span>
                   <span id="hintBadge" class="badge">3</span>
                 </button>
                 <span class="text" id="hintText"></span>
               </div>
               <div class="rightShelf">
                 <div class="levelIcon" id="levelIcon" title="Level ${level}"></div>
                 <div class="lives" id="lives" aria-label="lives"></div>
               </div>
             </div>

             <!-- Inventory Powerup Bar (Lock Key + 2 future slots) -->
<div class="powerBar" id="powerBar">
  <div class="powerBarInner">
    <!-- Slot 1: Lock Key -->
    <div class="powerSlot powerSlot-empty" data-slot="p1"></div>

    <!-- Slot 2: empty (will show icon later when a powerup is present) -->
    <div class="powerSlot powerSlot-empty" data-slot="p2"></div>

    <!-- Slot 3: empty -->
    <div class="powerSlot powerSlot-empty" data-slot="p3"></div>
  </div>
</div>



<!-- ⭐ Star challenge bar (bar behind 3 big stars) -->
<div class="starMeter" id="starMeter">
  <!-- Track + fill live behind the stars -->
  <div class="starMeterTrack"></div>
  <div class="starMeterFill" id="starMeterFill"></div>

  <!-- Stars sit on top of the bar -->
  <div class="starMeterStars">
    <span class="starSlot starSlot-left"   data-star="1">★</span>
    <span class="starSlot starSlot-middle" data-star="2">★</span>
    <span class="starSlot starSlot-right"  data-star="3">★</span>
  </div>
</div>


<div class="wordStage" id="wordStage">
  <div id="ruutCompanion" class="idle" aria-hidden="true"></div>

 
   
             <!-- Score centered ABOVE the combo bar -->
             <div class="scoreCenter" id="scoreCenter"><span id="points">0</span></div>
   
             <!-- Combo bar ABOVE the word box -->
             <div class="combo" id="combo">
               <div class="comboFill" id="comboFill"></div>
               <div class="th t1"></div><div class="th t2"></div><div class="th t3"></div>
             </div>

             

   
             <!-- Word area (start row inside) -->
             <div class="rowsWrap">
               <div class="rows" id="rows">
                 ${startRowHtml}
                 ${rowsHtml}
               </div>
             </div>
             </div>

   
             <!-- Keyboard -->
             <div class="kbWrap">
               <div class="kb" id="kb">
                 <div class="kbRow" id="kb_r0"></div>
                 <div class="kbRow" id="kb_r1"></div>
                 <div class="kbRow" id="kb_r2"></div>
               </div>
             </div>
   
             <!-- Wheel + confirm pill kept above wheel -->
             <div class="kbWrap" id="wheelWrap" style="display:none;">
               <div style="position:relative; width:100%; height:220px;">
                 <div id="wheelConfirm"></div>
                 <div id="wheel" style="width:100%; height:220px; position:relative;">
                   <svg id="wheelSvg"></svg>
                 </div>
               </div>
             </div>
           </div>
   
           <div id="overlay" style="
  position:absolute; inset:0;
  display:none;
  align-items:center; justify-content:center;
  background: rgba(0,0,0,0.45);
  z-index: 50;
">
  <div id="hintModalBox" style="
    width:min(420px, 92vw);
    border-radius:16px;
    padding:16px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    color:#fff;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  " role="dialog" aria-modal="true" aria-labelledby="hintTitle">

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div id="hintTitle" style="font-weight:700; font-size:20px;">Need a Hint?</div>
      <button id="modalClose" style="
        appearance:none; border:none;
        background: rgba(255,255,255,0.10);
        color:#fff;
        border-radius:10px;
        width:34px; height:34px;
        cursor:pointer;
        font-size:16px;
      " aria-label="Close">✕</button>
    </div>

    <div style="opacity:0.9; font-size:13px; line-height:1.35; margin-bottom:12px;">
      Watch an ad to reveal a hint.
      <div id="hintCd" style="margin-top:6px;font-weight:700;"></div>
    </div>

    <div style="text-align:center; font-weight:700; font-size:22px; margin-bottom:8px;">Watch Ad</div>

    <!-- Film strip button -->
    <button id="modalPlay" type="button" style="
      width:100%;
      border:none;
      border-radius:14px;
      padding:0;
      cursor:pointer;
      background: transparent;
    ">
      <div style="
        position:relative;
        height:92px;
        border-radius:14px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        overflow:hidden;
      ">
        <!-- film holes -->
        <div style="position:absolute; left:10px; top:10px; bottom:10px; width:10px; display:flex; flex-direction:column; justify-content:space-between;">
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
        </div>
        <div style="position:absolute; right:10px; top:10px; bottom:10px; width:10px; display:flex; flex-direction:column; justify-content:space-between;">
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
        </div>

        <!-- play button -->
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
          <div style="
            width:46px; height:46px;
            border-radius:999px;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.22);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="
              width:0; height:0;
              border-left:14px solid rgba(255,255,255,0.92);
              border-top:9px solid transparent;
              border-bottom:9px solid transparent;
              margin-left:3px;
            "></div>
          </div>
        </div>
      </div>
    </button>

    <button id="hintUpgrade" type="button" style="
      margin-top:12px;
      width:100%;
      padding:12px 10px;
      border-radius:12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.08);
      color:#fff;
      cursor:pointer;
      font-weight:700;
      font-size:18px;
    ">
      Upgrade Power Pack
    </button>
    <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:18px; margin-right:6px;">
  <button id="hintNoThanks" type="button" style="
    appearance:none;
    border:none;
    background:transparent;
    padding:0;
    color: rgba(255,255,255,0.85);
    cursor:pointer;
    font-weight:700;
    font-size:14px;
    text-decoration:none;
  ">No thanks</button>
</div>




  </div>
</div>


   
           <div id="overlayLives" style="
  position:absolute; inset:0;
  display:none;
  align-items:center; justify-content:center;
  background: rgba(0,0,0,0.45);
  z-index: 50;
">
  <div id="livesModalBox" style="
    width:min(420px, 92vw);
    border-radius:16px;
    padding:16px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    color:#fff;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  " role="dialog" aria-modal="true" aria-labelledby="livesTitle">



    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div id="livesTitle" style="font-weight:700; font-size:16px;">Out of Hearts</div>
      <button id="livesClose" style="
        appearance:none; border:none;
        background: rgba(255,255,255,0.10);
        color:#fff;
        border-radius:10px;
        width:34px; height:34px;
        cursor:pointer;
        font-size:16px;
      " aria-label="Close">✕</button>
    </div>

    <div style="opacity:0.9; font-size:13px; line-height:1.35; margin-bottom:12px;">
      You're out of ❤️. Watch an ad to refill your hearts and keep going,
      or return to the map (-1 Life).
      <div id="livesCd" style="margin-top:6px;font-weight:700;"></div>
    </div>

    <div style="text-align:center; font-weight:700; margin-bottom:8px;">Watch Ad</div>

    <!-- Film strip button -->
    <button id="livesPlay" type="button" style="
      width:100%;
      border:none;
      border-radius:14px;
      padding:0;
      cursor:pointer;
      background: transparent;
    ">
      <div style="
        position:relative;
        height:92px;
        border-radius:14px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        overflow:hidden;
      ">
        <!-- film holes -->
        <div style="position:absolute; left:10px; top:10px; bottom:10px; width:10px; display:flex; flex-direction:column; justify-content:space-between;">
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
        </div>
        <div style="position:absolute; right:10px; top:10px; bottom:10px; width:10px; display:flex; flex-direction:column; justify-content:space-between;">
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
          <span style="display:block; width:10px; height:10px; border-radius:3px; background: rgba(255,255,255,0.18);"></span>
        </div>

        <!-- play button -->
        <div style="
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
        ">
          <div style="
            width:46px; height:46px;
            border-radius:999px;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.22);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="
              width:0; height:0;
              border-left:14px solid rgba(255,255,255,0.92);
              border-top:9px solid transparent;
              border-bottom:9px solid transparent;
              margin-left:3px;
            "></div>
          </div>
        </div>
      </div>
    </button>

    <button id="livesNoThanks" type="button" style="
      margin-top:12px;
      width:100%;
      padding:12px 10px;
      border-radius:12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(239, 68, 68, 0.14);
      color:#fff;
      cursor:pointer;
      font-weight:700;
    ">
      No thanks… (-1 Life)
    </button>
  </div>
</div>



           <div id="overlayPowerup" class="overlay" aria-hidden="true" style="display:none;align-items:center;justify-content:center;position:absolute;inset:0;background:rgba(0,0,0,.55);">
           <div class="modal" role="dialog" aria-modal="true" aria-labelledby="powerupTitle">
             <button id="powerupClose" class="close" aria-label="Close">×</button>
             <h3 id="powerupTitle" class="title">No Available Moves</h3>
             <div class="subtitle" id="powerupText">
               No more available moves. Would you like to use a powerup to continue?
             </div>
             <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
               <button id="powerupUseBtn" class="adminToggle" type="button">
                 Yes – use Lock Key
               </button>
               <button id="powerupSkipBtn" class="adminToggle" type="button">
                 No – end level
               </button>
             </div>
           </div>
         </div>

         <div id="overlayPreLevel"
     class="overlay overlayPreLevel"
     aria-hidden="true"
     style="display:none;align-items:center;justify-content:center;position:absolute;inset:0;">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="preLevelTitle">
    <h3 id="preLevelTitle" class="title">Level Goal</h3>

    <!-- Line 1: the text -->
    <div class="subtitle" id="preLevelText">
      <!-- Filled by GameplayScene.showPreLevelPanel -->
    </div>

    <!-- Line 2: BIG GOLD STARS, always ★★★ -->
    <div id="preLevelStarsRow" class="preStars">★ ★ ★</div>

    <button id="preLevelStart" class="adminToggle" type="button" style="margin-top:12px;">
      Play
    </button>
  </div>
</div>


<div id="overlay1v1"
     class="overlay overlayVs"
     aria-hidden="true"
     style="display:none;align-items:center;justify-content:center;position:absolute;inset:0;">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="versusTitle">
    <!-- ✅ all your existing text/buttons stay exactly the same -->
  </div>
</div>







<div id="overlayRecap"
     class="overlay overlayRecap"
     aria-hidden="true"
     style="display:none; align-items:center;justify-content:center;position:absolute;inset:0;">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="recapTitle">
    <h3 id="recapTitle" class="title">Level Complete</h3>

    <div class="subtitle" id="recapSummary">
      <!-- Filled in by GameplayScene at the end of the level -->
    </div>

    <!-- ⭐ This is where EARNED stars will be drawn from TS -->
    <div id="recapStars" class="preStars"></div>

    <button id="recapContinue" class="adminToggle" type="button" style="margin-top:12px;">
      Continue
    </button>
  </div>
</div>






       



   
           <input id="trap" class="trap" autocomplete="off" />
         </div>
       `);
   
       const { el } = mountDom(this, html);

// ✅ Apply layout variables BEFORE anything that depends on layout
this.applyLayoutTuning();

// Auto-contrast: adjust text colors based on actual background tones
this.applyAutoContrast(el);

// ✅ Keep layout stable on device resize/orientation change
window.addEventListener('resize', this.onLayoutResize);


      


           // === Land-based background color for this gameplay scene ===
        // === Land visuals: background image + fallback color on #wrap_root ===
        const wrapRoot = el.querySelector<HTMLDivElement>('#wrap_root');
        if (wrapRoot) {
          const landId = this.spec.land;
    
          let bgColor = '#000000';
          let bgImage = '';
    
          if (landId === 0) {
            bgColor = '#0b1827';
            bgImage = "url('/bg_land0.png')";
          } else if (landId === 1) {
            bgColor = '#20354a';
            bgImage = "url('https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/gameplay-screens/background_sunny_trail.svg')";
          } else if (landId === 2) {
            bgColor = '#2b1c25';
            bgImage = "url('https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/gameplay-screens/background_sunny_trail.svg')";
          } else if (landId === 3) {
            bgColor = '#0a1020';
            bgImage = "url('https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/gameplay-screens/background_sunny_trail.svg')";
          }
    
          wrapRoot.style.backgroundColor = bgColor;
          wrapRoot.style.backgroundImage = bgImage;
          wrapRoot.style.backgroundSize = 'cover';
          wrapRoot.style.backgroundPosition = 'center';
        }
    

   
       /* Grab DOM */
       //this.answerKeyEl = el.querySelector<HTMLDivElement>('#anskey')!;
       this.rowsScrollEl = el.querySelector<HTMLDivElement>('#rows')!;
       this.ruutEl = el.querySelector<HTMLDivElement>('#ruutCompanion');
       this.ruutCharacter = new RuutCharacter(this.ruutEl);
       this.ruutCharacter.init();
       this.pointsEl = el.querySelector<HTMLSpanElement>('#points')!;
       this.clockEl = el.querySelector<HTMLSpanElement>('#clock')!;
       const hintTextEl = el.querySelector<HTMLSpanElement>('#hintText')!;
       const hintBtnEl = el.querySelector<HTMLButtonElement>('#hintBtn')!;
       const hintBadgeEl = el.querySelector<HTMLSpanElement>('#hintBadge')!;
       this.livesEl = el.querySelector<HTMLDivElement>('#lives')!;
this.lockKeyBadgeEl = el.querySelector<HTMLSpanElement>('#lockKeyBadge')!;
       const invLockKeyBtn = el.querySelector<HTMLButtonElement>('#invLockKey')!;
       const invLockKeyCountEl = el.querySelector<HTMLSpanElement>('#invLockKeyCount')!;
       this.modalOverlayEl = el.querySelector<HTMLDivElement>('#overlay')!;
       const hintCdEl = el.querySelector<HTMLDivElement>('#hintCd')!;
       this.livesOverlayEl = el.querySelector<HTMLDivElement>('#overlayLives')!;
       this.livesCdEl = el.querySelector<HTMLDivElement>('#livesCd')!;
       const comboEl = el.querySelector<HTMLDivElement>('#combo')!;
       const comboFillEl = el.querySelector<HTMLDivElement>('#comboFill')!;

              // ⭐ Star meter DOM
              this.starMeterEl = el.querySelector<HTMLDivElement>('#starMeter')!;
              this.starMeterFillEl = el.querySelector<HTMLDivElement>('#starMeterFill')!;
              this.starSlotsEls = Array.from(
                el.querySelectorAll<HTMLSpanElement>('.starSlot')
              );

              // Pre-level overlay
this.preLevelOverlayEl = el.querySelector<HTMLDivElement>('#overlayPreLevel')!;
this.preLevelTextEl = el.querySelector<HTMLDivElement>('#preLevelText')!;
this.preLevelStartBtnEl = el.querySelector<HTMLButtonElement>('#preLevelStart')!;

       
              // ⭐ Recap overlay DOM
              this.recapOverlayEl = el.querySelector<HTMLDivElement>('#overlayRecap')!;
              this.recapSummaryEl = el.querySelector<HTMLDivElement>('#recapSummary')!;
              // Create a separate line for the diamond icon (above the DIAMOND word)
this.recapDiamondEl = document.createElement("div");
this.recapDiamondEl.style.fontSize = "70px";
this.recapDiamondEl.style.lineHeight = "1";
this.recapDiamondEl.style.marginLeft = "65px";
this.recapDiamondEl.style.marginBottom = "6px";
this.recapDiamondEl.style.display = "none"; // hidden until needed
this.recapDiamondEl.textContent = "💎";


              this.recapStarsEl = el.querySelector<HTMLDivElement>('#recapStars')!;
              this.recapContinueBtnEl = el.querySelector<HTMLButtonElement>('#recapContinue')!;
       
              this.recapContinueBtnEl.onclick = (ev) => {
                ev.preventDefault();
                this.hideLevelRecap();
                this.returnToMapAfterRecap();
              };
       
       this.focusTrap = el.querySelector<HTMLInputElement>('#trap')!;
       this.levelIconEl = el.querySelector<HTMLDivElement>('#levelIcon')!;
       this.themeToggleEl = el.querySelector<HTMLButtonElement>('#themeToggle')!;
       const adminBtnEl = el.querySelector<HTMLButtonElement>('#adminBtn')!;
       const titleEl = el.querySelector<HTMLDivElement>('#gameTitle')!;
       const modeToggleEl = el.querySelector<HTMLButtonElement>('#modeToggle')!;
       this.livesEl = el.querySelector<HTMLDivElement>('#lives')!;
       


       
              // Hide dev-only HUD buttons when dev mode is off
              if (!GAME_CONFIG.dev.enabled || !GAME_CONFIG.dev.showHudAdminButtons) {
                this.themeToggleEl.style.display = 'none';
                modeToggleEl.style.display = 'none';
                adminBtnEl.style.display = 'none';
              }
       
       
       // Powerup "No Available Moves" overlay + buttons
       const powerupOverlayEl = el.querySelector<HTMLDivElement>('#overlayPowerup')!;
       this.powerupOverlayEl = powerupOverlayEl;
       const powerupUseBtnEl = el.querySelector<HTMLButtonElement>('#powerupUseBtn')!;
       const powerupSkipBtnEl = el.querySelector<HTMLButtonElement>('#powerupSkipBtn')!;

       // Inventory power bar (3 slots, all start visually empty)
       this.powerBarEl = el.querySelector<HTMLDivElement>('#powerBar')!;
       this.powerUpInventory = new PowerUpInventory({
         powerBarEl: this.powerBarEl,
         overlayEl: powerupOverlayEl,
         useButton: powerupUseBtnEl,
         skipButton: powerupSkipBtnEl,
         onSlotClick: () => this.useLockKeyFromInventoryClick(),
         onConfirmUse: (lockedIndex) => this.confirmUseLockKeyFromPrompt(lockedIndex),
         onSkipUse: () => this.triggerNoMovesFail(),
       });
       this.powerUpInventory.setLockKeyCount(this.lockKeyCount);


       this.invLockKeyBtn = invLockKeyBtn;
       this.invLockKeyCountEl = invLockKeyCountEl;

       this.comboBar = new ComboBar({ comboEl, comboFillEl });
       this.comboBar.setValue(this.initialComboValue, true);

       const modalCloseBtn = el.querySelector<HTMLButtonElement>('#modalClose')!;
       const modalNoThanksBtn = el.querySelector<HTMLButtonElement>('#hintNoThanks')!;
       const modalPlayBtn = el.querySelector<HTMLElement>('#modalPlay')!;
       this.hintSystem = new HintSystem({
         hintButton: hintBtnEl,
         hintBadge: hintBadgeEl,
         hintText: hintTextEl,
         modalOverlay: this.modalOverlayEl,
         modalCloseButton: modalCloseBtn,
         modalNoThanksButton: modalNoThanksBtn,
         modalPlayButton: modalPlayBtn,
         cooldownText: hintCdEl,
         cooldownMs: GameplayScene.HINT_COOLDOWN_MS,
         initialHintCount: 3,
         onRequestHint: () => {
           const cur = this.slots[this.currentSlotIndex];
           if (!cur) return null;
           return HINTS[cur.word] || 'short clue';
         },
         onAfterUse: () => {
           this.focusTrap.setAttribute('inputmode', 'none');
           this.focusTrap.focus({ preventScroll: true });
           setTimeout(() => this.updateCaret(true), 0);
         },
         onWatchAd: () => {
           this.focusTrap.focus({ preventScroll: true });
           setTimeout(() => this.updateCaret(true), 0);
         },
       });

   
       /* Title → Back to Title */
       titleEl.onclick = () => {
         this.cameras.main.fadeOut(200, 0, 0, 0);
         this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
           () => this.scene.start('TitleScreen'));
       };
   
       /* Safe-area layout + green outline */
       const SCR_W = this.scale.width;
       const SCR_H = this.scale.height;
       const safe = getSafeRect(SCR_W, SCR_H, 0.05);
       this.layoutDomIntoSafe(safe);
       this.applyLayoutPhaser(safe);
   
       const dbg = this.add.graphics().setDepth(9999).setScrollFactor(0);
       dbg.clear().lineStyle(2, 0x00ff88, 0.95).strokeRect(safe.x, safe.y, safe.w, safe.h);
       this.scale.off(Phaser.Scale.Events.RESIZE);
       this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: { width:number; height:number }) => {
         const safe2 = getSafeRect(gameSize.width, gameSize.height, 0.05);
         this.layoutDomIntoSafe(safe2);
         this.applyLayoutPhaser(safe2);
         dbg.clear().lineStyle(2, 0x00ff88, 0.95).strokeRect(safe2.x, safe2.y, safe2.w, safe2.h);
       });
   
       /* Level icon (no rays), now on hint row right */
       const renderLevelIcon = () => {
         this.levelIconEl.innerHTML = '';
         if (!this.isNight) {
           const sun = document.createElement('div'); sun.className = 'sun';
           const num = document.createElement('span'); num.className = 'num'; num.textContent = String(this.spec.level);
           this.levelIconEl.appendChild(sun); this.levelIconEl.appendChild(num);
         } else {
           const moon = document.createElement('div'); moon.className = 'moon';
           const inner = document.createElement('div'); inner.className = 'moonInnerLine';
           const num = document.createElement('span'); num.className = 'moonNum'; num.textContent = String(this.spec.level);
           this.levelIconEl.appendChild(moon); this.levelIconEl.appendChild(inner); this.levelIconEl.appendChild(num);
         }
       };
       renderLevelIcon();
       this.themeToggleEl.onclick = () => {
         this.isNight = !this.isNight; (window as any).__isNight__ = this.isNight;
         renderLevelIcon(); this.focusTrap.focus({ preventScroll:true }); setTimeout(() => this.updateCaret(true), 0);
       };
   
       /* Admin console */
       this.dataManager.featureFlag('admin_console_enabled').then(enabled => {
         if (enabled) {
           adminBtnEl.style.display = 'inline-block';
           adminBtnEl.onclick = () => this.scene.launch('AdminConsole');
         }
       });
   
       /* Mode toggle */
       modeToggleEl.onclick = () => {
         this.inputMode = (this.inputMode === 'keyboard') ? 'wheel' : 'keyboard';
         (window as any).__inputMode__ = this.inputMode;
         this.renderInputMode();
         this.focusTrap.focus({ preventScroll: true });
         setTimeout(() => this.updateCaret(true), 0);
       };
   
       /* Focus trap */
       const focusTrapFocus = () => { this.focusTrap.setAttribute('inputmode', 'none'); this.focusTrap.focus({ preventScroll: true }); };
       focusTrapFocus();
       setTimeout(() => { focusTrapFocus(); this.updateCaret(true); }, 0);
       this.events.on(Phaser.Scenes.Events.WAKE, () => setTimeout(() => { focusTrapFocus(); this.updateCaret(true); }, 0));

       // === Land visuals: set body data-land for CSS backgrounds ===
const meta = getLandMeta(this.spec.land);
document.body.dataset.land = String(meta.id);
// (Optional) You can also set the document title or a UI label somewhere,
// e.g. document.title = `${meta.name} – Level ${this.spec.level}`;

   
             /* Build rows & prefill first letter */

// All answer words (lowercased for TrapSystem + checks)
const answers = this.spec.words.slice(1).map(w => w.toLowerCase());

      // NEW: per-level trap + lock-key config
      const trapsEnabled      = this.spec.trapsEnabled ?? false;
      const isTutorialLevel   = this.spec.isTutorialLevel ?? false;
      const startingLockKeys  = this.spec.startingLockKeys ?? 0;
      const usesInventoryKeys = this.spec.usesInventoryKeys ?? !isTutorialLevel;

      // === Lock Key: decide how many you start this level with ===
      if (isTutorialLevel && startingLockKeys > 0) {
        // Tutorial 0-2: guarantee they *have at least* startingLockKeys,
        // but don't stack extra every time they replay.
        const fromInventory = this.gameData.getLockKeys();
        const effective = Math.max(fromInventory, startingLockKeys);
        this.lockKeyCount = effective;
        this.gameData.setLockKeys(effective);
      } else if (usesInventoryKeys) {
        // Main game / non-tutorial levels: whatever is in inventory
        this.lockKeyCount = this.gameData.getLockKeys();
      } else {
        // Levels that don't use keys at all
        this.lockKeyCount = 0;
      }

      // Reset play-key releases for this level
      this.releasedLocks.clear();

      // Only initialize TrapRuntime if this level actually uses traps
      if (trapsEnabled) {
        try {
          initTrapRuntime(answers, this.spec.level);
        } catch (err) {
          console.warn("[TRAP] initTrapRuntime error (ignored)", err);
        }
      }

      answers.forEach((w, i) => {

        const rowEl  = el.querySelector<HTMLDivElement>(`#row_${i}`)!;
        const boxEl  = el.querySelector<HTMLDivElement>(`#box_${i}`)!;
        const cellEls = Array.from(rowEl.querySelectorAll<HTMLSpanElement>('.cell'));
        const st: SlotState = { word: w, len: w.length, cur: Math.min(1, w.length - 1), cells: cellEls, rowEl, boxEl };
        const first = cellEls[0].querySelector<HTMLSpanElement>('.ch')!; first.textContent = w[0].toUpperCase();
        cellEls[0].classList.add('prefill');

   
         boxEl.addEventListener('pointerdown', (ev) => {
           ev.preventDefault(); focusTrapFocus();
           if (this.slots[this.currentSlotIndex]?.boxEl !== boxEl) return;
           const target = (ev.target as HTMLElement).closest('.cell') as HTMLSpanElement | null;
           if (target) {
             const colAttr = target.getAttribute('data-col');
             if (colAttr) { const idx = parseInt(colAttr, 10); if (!Number.isNaN(idx) && idx >= 1 && idx < st.len) st.cur = idx; }
           }
           this.updateCaret(true);
         });
   
         this.slots.push(st);
       });
   
       /* Hints */
       this.hintSystem?.reset(3);
   
       /* Hearts render */
       const svgFull = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="#ff375f" stroke="#a00" stroke-width="0.6"/></svg>`;
       const svgHalf = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><linearGradient id="halfFill" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="rgba(0,0,0,0)" /><stop offset="50%" stop-color="rgba(0,0,0,0)" /><stop offset="50%" stop-color="#ff375f" /><stop offset="100%" stop-color="#ff375f" /></linearGradient></defs><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="url(#halfFill)" stroke="#a00" stroke-width="0.6"/></svg>`;
       const svgEmpty = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="rgba(0,0,0,0)" stroke="#ffffffaa" stroke-width="1"/></svg>`;
       const renderHearts = () => {
         this.livesEl.innerHTML = '';
         const total = this.heartSlots; let halves = Math.max(0, Math.min(this.halfLives, total * 2));
         for (let i = 0; i < total; i++) {
           let icon = svgEmpty;
           if (halves >= 2) { icon = svgFull; halves -= 2; }
           else if (halves === 1) { icon = svgHalf; halves -= 1; }
           const wrap = document.createElement('span'); wrap.className = 'heartSvg'; wrap.innerHTML = icon;
           this.livesEl.appendChild(wrap);
         }
       };
       // ✅ Initial render based on this.halfLives loaded in init()
renderHearts();

       const loseHalfLife = () => {
  // If the out-of-hearts modal is already up, ignore further mistakes
  if (this.livesModalOpen) return;

  if (this.halfLives > 0) {
    this.halfLives -= 1;
    this.syncHeartsFromHalfLives();
  }

  if (this.halfLives <= 0) {
    this.openLivesModal();
    return; // stop further UI actions this tick
  }

  renderHearts();
  this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);
};

      
      

              // Initialize star meter as full (3-star potential)
              this.updateStarMeter(0);


              // Inventory power bar – wire Lock Key button click
              const powerBarEl = document.getElementById('inventoryBar') as HTMLDivElement | null;
              if (powerBarEl) {
                const lockBtnEl = powerBarEl.querySelector<HTMLButtonElement>('#invLockKeyBtn');
                if (lockBtnEl) {
                  lockBtnEl.onclick = (ev) => {
                    ev.preventDefault();
                    this.useLockKeyFromClick();
                  };
                }
              }
       
              // Initial visual state of the inventory bar
              this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);
       

       

       
       

   
       /* Keyboard */
       const kbR0 = el.querySelector<HTMLDivElement>('#kb_r0')!;
       const kbR1 = el.querySelector<HTMLDivElement>('#kb_r1')!;
       const kbR2 = el.querySelector<HTMLDivElement>('#kb_r2')!;
       [kbR0, kbR1, kbR2].forEach((row, ri) => {
         KEY_ROWS[ri].forEach(label => {
           const isSpecial = (label === '⌫' || label === '⏎');
           const btn = document.createElement('div');
           btn.className = `key ${isSpecial ? 'special' : ''} ${label==='⏎'?'enter':''} ${label==='⌫'?'back':''}`;
           btn.textContent = label;
           btn.addEventListener('click', () => { this.handleVirtualKey(label, loseHalfLife); this.focusTrap.focus({ preventScroll: true }); setTimeout(() => this.updateCaret(true), 0); });
           row.appendChild(btn);
         });
       });
       this.boundNativeKey = (e: KeyboardEvent) => this.handleNativeKey(e, loseHalfLife);
       window.addEventListener('keydown', this.boundNativeKey, { passive: false });
   
       /* Modals */

// Lives modal buttons
const livesCloseBtn = el.querySelector<HTMLButtonElement>('#livesClose')!;
livesCloseBtn.onclick = () => {
  // Close only. No penalties.
  this.closeLivesModal();
  void this.loseLifeAndReturnToMap();
  this.focusTrap.focus({ preventScroll: true });
};

const livesPlayBtn = el.querySelector<HTMLDivElement>('#livesPlay')! as any;
livesPlayBtn.onclick = () => {
  // Watch ad (stub for now): refill hearts & keep playing
  this.halfLives = this.heartSlots * 2;
  this.syncHeartsFromHalfLives();

  this.closeLivesModal();
  this.focusTrap.focus({ preventScroll: true });
};

const livesNoThanksBtn = el.querySelector<HTMLButtonElement>('#livesNoThanks')!;
livesNoThanksBtn.onclick = () => {
  // Explicitly accept losing a life and go back to map
  this.loseLifeAndReturnToMap();
};

// Optional: clicking outside closes only (no penalty)
this.livesOverlayEl.addEventListener('click', (ev) => {
  if (ev.target === this.livesOverlayEl) {
    this.closeLivesModal();
    this.focusTrap.focus({ preventScroll: true });
  }
});


   
       /* Timer – for non-tutorial levels, show pre-level panel before starting */
if (!isTutorialLevel) {
  this.showPreLevelPanel();
} else {
  this.startLevelClock();
}
document.addEventListener('visibilitychange', this.handleVisibility, false);
   
       /* Input mode */
       this.renderInputMode();
   
       /* Cleanup */
       this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
       this.events.once(Phaser.Scenes.Events.DESTROY,  () => this.teardown());
   
       this.updateCaret(true);
     }

     private createMenuButton(): void {
      const menuText = this.add.text(this.cameras.main.width - 16, 16, '≡', {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '24px',
      })
        .setOrigin(1, 0)
        .setScrollFactor(0) // stays in place when camera moves
        .setInteractive({ useHandCursor: true });
    
      menuText.on('pointerup', () => {
        this.openPauseMenu();
      });
    }
    
    private openPauseMenu(): void {
      if (this.menuDom) return;
    
      // ✅ Stop the clock while paused
      this.pauseLevelClock();
    
      // Overlay + panel so clicking outside closes it
      const html = `
        <div id="pause-overlay" style="
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.35);
          pointer-events:auto;
        ">
          <div id="pause-panel" style="
            background:rgba(15,23,42,0.92);
            padding:16px 20px;border-radius:12px;min-width:240px;
            box-shadow:0 12px 30px rgba(0,0,0,0.35);
          ">
            <h2 style="margin:0 0 12px 0;font-size:18px;">Paused</h2>
    
            <button id="btn-resume" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
              Resume
            </button>
    
            <button id="btn-exit-map" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
              Back to Map
            </button>
    
            <button id="btn-exit-title" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
              Back to Title
            </button>
    
            <button id="btn-settings" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
              Settings
            </button>
    
            <button id="btn-store" style="display:block;width:100%;padding:8px 12px;">
              Store
            </button>
          </div>
        </div>
      `;
    
      const { dom, el } = mountDom(this, html);
      this.applyLayoutTuning(el);

      this.menuDom = dom;
    
      const overlay = el.querySelector<HTMLDivElement>('#pause-overlay')!;
      const panel = el.querySelector<HTMLDivElement>('#pause-panel')!;
    
      const resumeBtn = el.querySelector<HTMLButtonElement>('#btn-resume')!;
      const exitMapBtn = el.querySelector<HTMLButtonElement>('#btn-exit-map')!;
      const exitTitleBtn = el.querySelector<HTMLButtonElement>('#btn-exit-title')!;
      const settingsBtn = el.querySelector<HTMLButtonElement>('#btn-settings')!;
      const storeBtn = el.querySelector<HTMLButtonElement>('#btn-store')!;
    
      const closeMenu = () => {
        this.menuDom?.destroy();
        this.menuDom = undefined;
    
        // ✅ Resume the clock exactly where it left off
        this.resumeLevelClock();
      };
    
      // Click outside closes
      overlay.onclick = () => closeMenu();
      // Click inside should NOT close
      panel.onclick = (ev) => ev.stopPropagation();
    
      const openStub = (title: string) => {
        const stubHtml = `
          <div id="stub-overlay" style="
            position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.35);pointer-events:auto;
          ">
            <div id="stub-panel" style="background:rgba(15,23,42,0.92);padding:16px 20px;border-radius:12px;min-width:240px;">
              <h2 style="margin:0 0 10px 0;font-size:18px;">${title}</h2>
              <div style="opacity:.85;margin:0 0 12px 0;">Coming soon.</div>
              <button id="stub-close" style="display:block;width:100%;padding:8px 12px;">Close</button>
            </div>
          </div>
        `;
        const stub = mountDom(this, stubHtml);
        const stubOverlay = stub.el.querySelector<HTMLDivElement>('#stub-overlay')!;
        const stubPanel = stub.el.querySelector<HTMLDivElement>('#stub-panel')!;
        const closeBtn = stub.el.querySelector<HTMLButtonElement>('#stub-close')!;
    
        stubOverlay.onclick = () => stub.dom.destroy();
        stubPanel.onclick = (ev) => ev.stopPropagation();
        closeBtn.onclick = () => stub.dom.destroy();
      };
    
      resumeBtn.onclick = () => closeMenu();
    
      exitMapBtn.onclick = () => {
        closeMenu();
        this.scene.start('WorldMapScene');
      };
    
      exitTitleBtn.onclick = () => {
        closeMenu();
        this.scene.start('TitleScreen');
      };
    
      settingsBtn.onclick = () => openStub('Settings');
      storeBtn.onclick = () => openStub('Store');
    
      // Safety: if scene shuts down while menu is open, remove it + resume clock
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeMenu());
    }
    
    
    private hardPauseGame(): void {
      if (this.isHardPaused) return;
      this.isHardPaused = true;
    
      // ✅ Stops time events (clock timers) + delayedCalls
      this.time.timeScale = 0;
    
      // ✅ Stops tweens (including any clock tween)
      this.tweens.pauseAll();
    
      // If you have physics in gameplay, also pause them:
      if (this.physics && (this.physics as any).world) {
        (this.physics as any).world.pause();
      }
    }
    
    private hardResumeGame(): void {
      if (!this.isHardPaused) return;
      this.isHardPaused = false;
    
      // ✅ Resume time events
      this.time.timeScale = 1;
    
      // ✅ Resume tweens
      this.tweens.resumeAll();
    
      // Resume physics if used
      if (this.physics && (this.physics as any).world) {
        (this.physics as any).world.resume();
      }
    }
    
    
    

     // ⭐ Show pre-level panel (only for non-tutorial levels)
private showPreLevelPanel() {
  if (!this.preLevelOverlayEl || !this.preLevelTextEl || !this.preLevelStartBtnEl) {
    // Fallback: if DOM is missing, just start timer
    this.startLevelClock();
    return;
  }

  // Format from the per-level star thresholds
  const t3 = this.formatMs(this.starThreeMs).slice(-5); // "MM:SS"
  const t2 = this.formatMs(this.starTwoMs).slice(-5);
  const t1 = this.formatMs(this.starOneMs).slice(-5);

  // Text: don't say "star challenge", just the rules
  this.preLevelTextEl.innerHTML =
  `Complete the level in ${t3} for`;


  this.preLevelOverlayEl.style.display = 'flex';
  this.preLevelOverlayEl.classList.add('show');
  this.preLevelOverlayEl.setAttribute('aria-hidden', 'false');

  // Only start the clock once the player taps "Play"
  this.preLevelStartBtnEl.onclick = (ev) => {
    ev.preventDefault();
    this.preLevelOverlayEl.classList.remove('show');
    this.preLevelOverlayEl.setAttribute('aria-hidden', 'true');
    this.preLevelOverlayEl.style.display = 'none';
    this.startLevelClock();
  };
}


       // ---------- Auto-contrast helpers ----------
  private isLightColor(rgbString: string | null): boolean {
    if (!rgbString) return false;
    const m = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return false;

    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);

    // Perceived luminance (rough WCAG-ish)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6; // > 0.6 = "light" background
  }

 
  
  
  
  private applyLayoutTuning() {
    // Apply vars globally so they always affect the DOM template CSS
    const rootStyle = document.documentElement.style;
  
    // Keep it responsive but never let it stretch wildly.
    // This is what makes the wordbox go back to “normal” instead of elongating.
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const sideGutter = 16; // keeps stage away from edges on small screens
  
    // Clamp max width so it’s stable across desktops but still fits phones
    const effectiveMax = Math.max(
      WORDBOX_MIN_W_PX,
      Math.min(WORDBOX_MAX_W_PX, vw - sideGutter * 2)
    );

    rootStyle.setProperty('--wr-banner-safe', `${BANNER_SAFE_PX}px`);
    rootStyle.setProperty('--wr-wordbox-max-w', `${effectiveMax}px`);
    rootStyle.setProperty('--wr-wordbox-min-w', `${Math.min(WORDBOX_MIN_W_PX, effectiveMax)}px`);
    rootStyle.setProperty('--wr-gameplay-lift', `${-GAMEPLAY_LIFT_PX}px`);

  
    // Independent paddings (your “per side” controls)
    rootStyle.setProperty('--wr-wordbox-pad-l', `${WORDBOX_PAD_L}px`);
    rootStyle.setProperty('--wr-wordbox-pad-r', `${WORDBOX_PAD_R}px`);
    rootStyle.setProperty('--wr-wordbox-pad-t', `${WORDBOX_PAD_T}px`);
    rootStyle.setProperty('--wr-wordbox-pad-b', `${WORDBOX_PAD_B}px`);
  
    // Ruut scale + offset (uniform scale, no squish)
    rootStyle.setProperty('--wr-ruut-scale', `${RUUT_SCALE}`);
    rootStyle.setProperty('--wr-ruut-x', `${RUUT_OFFSET_X}px`);
    rootStyle.setProperty('--wr-ruut-y', `${RUUT_OFFSET_Y}px`);
  
    // How much “reserved width” we add so the wordbox stays basically the same
    rootStyle.setProperty('--wr-ruut-reserved-w', `${RUUT_RESERVED_W}px`);
  
    // Proof log (leave it while tuning, remove later)
    console.log('[LAYOUT] applied', {
      vw,
      effectiveMax,
      WORDBOX_MAX_W_PX,
      WORDBOX_MIN_W_PX,
      WORDBOX_PAD_L,
      WORDBOX_PAD_R,
      WORDBOX_PAD_T,
      WORDBOX_PAD_B,
      RUUT_SCALE,
      RUUT_OFFSET_X,
      RUUT_OFFSET_Y,
      RUUT_RESERVED_W,
    });
  }
  
  

  private applyAutoContrast(rootEl: HTMLElement) {
    // Try to read the word-area background (#rows).
    const rowsEl = rootEl.querySelector<HTMLElement>('#rows');
    const clockRowEl = rootEl.querySelector<HTMLElement>('#clockRow');

    const bodyStyle = getComputedStyle(document.body);
    const fallbackBg = bodyStyle.backgroundColor || 'rgb(0,0,0)';

    const rowsBg = rowsEl
      ? getComputedStyle(rowsEl).backgroundColor || fallbackBg
      : fallbackBg;

    const clockBg = clockRowEl
      ? getComputedStyle(clockRowEl).backgroundColor || fallbackBg
      : rowsBg;

    const wordIsLight = this.isLightColor(rowsBg);
    const uiIsLight   = this.isLightColor(clockBg);

    const darkText  = '#111827'; // near-black
    const lightText = '#f9fafb'; // near-white

    const wordText = wordIsLight ? darkText : lightText;
    const uiText   = uiIsLight   ? darkText : lightText;

    // Update CSS variables on <html> so all our CSS picks it up.
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--ww-word-text', wordText);
    rootStyle.setProperty('--ww-ui-text', uiText);

    console.log('[AUTO-CONTRAST]', { rowsBg, clockBg, wordText, uiText });
    console.log("[GAMEPLAYSCENE] GameplayScene.ts is running (proof)");

  }

   
     /* ---------- Clock ---------- */
private startLevelClock() {
  this.levelStartMs = performance.now();
  this.pausedAccumMs = 0;
  this.pauseStartedAt = null;

  this.clockTickFn = () => {
    // If paused, do nothing (clock display frozen)
    if (this.pauseStartedAt) return;

    const now = performance.now();
    const elapsed = Math.max(0, now - this.levelStartMs - this.pausedAccumMs);
    this.clockEl.textContent = this.formatMs(elapsed);

    // ⭐ Keep star meter in sync with time
    this.updateStarMeter(elapsed);
  };

  // Run once immediately so UI shows correct value
  this.clockTickFn();

  // Then tick
  if (this.clockTick) window.clearInterval(this.clockTick);
  this.clockTick = window.setInterval(() => this.clockTickFn?.(), 250);
}

     private stopLevelClock() {
       if (this.clockTick) { window.clearInterval(this.clockTick); this.clockTick = undefined; }
       document.removeEventListener('visibilitychange', this.handleVisibility, false);
       this.pauseStartedAt = null;
     }
     private pauseLevelClock() {
      // If clock never started, do nothing
      if (!this.levelStartMs) return;
    
      // Mark pause start time once
      if (!this.pauseStartedAt) this.pauseStartedAt = performance.now();
    
      // ✅ Stop the interval so the DOM clock stops updating entirely
      if (this.clockTick) {
        window.clearInterval(this.clockTick);
        this.clockTick = undefined;
      }
    }
    
    private resumeLevelClock() {
      // If clock never started, do nothing
      if (!this.levelStartMs) return;
    
      // If we were paused, accumulate paused time and unpause
      if (this.pauseStartedAt) {
        this.pausedAccumMs += performance.now() - this.pauseStartedAt;
        this.pauseStartedAt = null;
      }
    
      // ✅ Restart the interval without resetting start time
      if (!this.clockTick) {
        this.clockTick = window.setInterval(() => this.clockTickFn?.(), 250);
      }
    
      // Update immediately on resume
      this.clockTickFn?.();
    }
    
     private handleVisibility = () => {
       if (document.hidden) { if (!this.pauseStartedAt) this.pauseStartedAt = performance.now(); }
       else { if (this.pauseStartedAt) { this.pausedAccumMs += performance.now() - this.pauseStartedAt; this.pauseStartedAt = null; } }
     };
     private formatMs(ms: number) {
       const s = Math.floor(ms / 1000), m = Math.floor(s / 60), ss = s % 60;
       return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
     }
   
     /* ---------- Hints/Lives ---------- */
     private openLivesModal() {
      this.livesModalOpen = true;
      this.livesOverlayEl.style.display = 'flex';
      this.livesOverlayEl.classList.add('show');
      this.livesOverlayEl.setAttribute('aria-hidden','false');
      if (!this.livesNextAt) this.livesNextAt = Date.now() + GameplayScene.LIVES_COOLDOWN_MS;
      clearInterval(this.livesCdTimer);
      this.livesCdTimer = window.setInterval(() => {
        const rem = this.livesNextAt! - Date.now();
        this.livesCdEl.textContent = rem > 0 ? `${this.formatMs(rem)} till next 🤍` : 'Life ready';
        if (rem <= 0) clearInterval(this.livesCdTimer);
      }, 1000);
    }
    
    private closeLivesModal() {
      this.livesModalOpen = false;
      this.livesOverlayEl.classList.remove('show');
      this.livesOverlayEl.setAttribute('aria-hidden','true');
      this.livesOverlayEl.style.display = 'none';
    }
    
          // ⭐ Helper: current elapsed ms using the same logic as the clock
          private getElapsedMs(): number {
            const now = performance.now();
            const pausedDelta = this.pauseStartedAt ? now - this.pauseStartedAt : 0;
            const effectiveNow = this.pauseStartedAt ? (now - pausedDelta) : now;
            return Math.max(0, effectiveNow - this.levelStartMs - this.pausedAccumMs);
          }
     
          // ⭐ Given elapsed time, how many stars should this run earn?
          private computeCurrentStarCount(elapsedMs: number): number {
            if (elapsedMs <= this.starThreeMs) return 3;
            if (elapsedMs <= this.starTwoMs)   return 2;
            if (elapsedMs <= this.starOneMs)   return 1;
            return 0;
          }
     
          // ⭐ Update star meter bar & star icons
          private updateStarMeter(elapsedMs: number) {
            if (!this.starMeterFillEl) return;
     
            const max = this.starOneMs; // after this you get 0 stars
            const clamped = Math.min(elapsedMs, max);
            const remaining = Math.max(0, max - clamped);
            const pct = (remaining / max) * 100;

// ✅ Compute fill width in PX against the inset track width
const meterW = this.starMeterEl?.clientWidth ?? 0;
const trackW = Math.max(0, meterW - 24); // 12px left + 12px right
const fillW = Math.max(0, Math.min(trackW, (pct / 100) * trackW));
this.starMeterFillEl.style.width = `${fillW}px`;

     
            const stars = this.computeCurrentStarCount(elapsedMs);
            this.starSlotsEls.forEach((el, idx) => {
              if (idx < stars) el.classList.remove('dim');
              else el.classList.add('dim');
            });
          }

          
     
   
     /* ---------- Combo (visuals only; math unchanged) ---------- */
     update() { if (this.isHardPaused) return;
      this.comboBar?.drainTick(); }

          // ---------- Inventory UI ----------
          private updateInventoryUI() {
            if (!this.invLockKeyBtn || !this.invLockKeyCountEl) return;
            this.invLockKeyCountEl.textContent = `x${this.lockKeyCount}`;
            const disabled = this.lockKeyCount <= 0;
            this.invLockKeyBtn.disabled = disabled;
            this.invLockKeyBtn.style.opacity = disabled ? '0.4' : '1';
          }
     
   
     /* ---------- Input handling ---------- */
     private updateCaret(scrollIntoView = false) {
       this.slots.forEach(s => s.cells.forEach(c => c.classList.remove('cursor')));
       const s = this.slots[this.currentSlotIndex]; if (!s) return;
       s.cells[s.cur]?.classList.add('cursor');
       if (scrollIntoView) {
         const rowRect = s.rowEl.getBoundingClientRect();
         const contRect = this.rowsScrollEl.getBoundingClientRect();
         if (rowRect.top < contRect.top + 8) this.rowsScrollEl.scrollBy({ top: rowRect.top - contRect.top - 8, behavior: 'smooth' });
         else if (rowRect.bottom > contRect.bottom - 8) this.rowsScrollEl.scrollBy({ top: rowRect.bottom - contRect.bottom + 8, behavior: 'smooth' });
       }
     }
     private isRowComplete(s: SlotState) {
       for (let i = 1; i < s.len; i++) {
         const t = s.cells[i].querySelector<HTMLSpanElement>('.ch')!.textContent || '';
         if (!t) return false;
       }
       return true;
     }
     private handleNativeKey(e: KeyboardEvent, loseHalfLife: () => void) {
      if (this.isBlockingModalOpen()) return;
       if (this.halfLives <= 0) { this.openLivesModal(); e.preventDefault(); return; }
       const s = this.slots[this.currentSlotIndex]; if (!s) return;
   
       if (e.key === 'Backspace') { e.preventDefault(); this.backspace(); return; }
       if (e.key === 'Enter') {
         e.preventDefault();
         if (this.isRowComplete(s)) this.trySubmitCurrent(loseHalfLife);
         else { this.flashConfirm('Type all letters', '#999'); this.updateCaret(true); }
         return;
       }
       if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); this.typeLetter(e.key.toLowerCase(), loseHalfLife); }
     }
     private handleVirtualKey(label: string, loseHalfLife: () => void) {
       if (this.halfLives <= 0) { this.openLivesModal(); return; }
       if (label === '⌫') { this.backspace(); return; }
       if (label === '⏎') {
         const s = this.slots[this.currentSlotIndex];
         if (s && this.isRowComplete(s)) this.trySubmitCurrent(loseHalfLife);
         else { this.flashConfirm('Type all letters', '#999'); this.updateCaret(true); }
         return;
       }
       if (/^[A-Z]$/.test(label)) this.typeLetter(label.toLowerCase(), loseHalfLife);
     }
     private typeLetter(letter: string, _loseHalfLife: () => void) {
      if (this.isBlockingModalOpen()) return;
       if (this.halfLives <= 0) { this.openLivesModal(); return; }
       const s = this.slots[this.currentSlotIndex]; if (!s) return;
   
       if (s.cur === 1) {
         const firstVisual = (s.cells[0].querySelector<HTMLSpanElement>('.ch')!.textContent || '').toLowerCase();
         const expectedSecond = s.word[1] || '';
         if (letter === firstVisual && letter !== expectedSecond) {
           s.cells[1].querySelector<HTMLSpanElement>('.ch')!.textContent = '';
           this.flashConfirm('Double letter', '#ffd54f');
           return;
         }
       }
       const cell = s.cells[s.cur];
       cell.querySelector<HTMLSpanElement>('.ch')!.textContent = letter;
       if (s.cur < s.len - 1) { s.cur++; this.updateCaret(true); }
       else { this.trySubmitCurrent(_loseHalfLife); }
     }
     private backspace() {
       if (this.halfLives <= 0) { this.openLivesModal(); return; }
       const s = this.slots[this.currentSlotIndex]; if (!s) return;
       if (s.cur >= 1) {
         const cell = s.cells[s.cur];
         const ch = cell.querySelector<HTMLSpanElement>('.ch')!;
         if (ch.textContent) ch.textContent = '';
         else if (s.cur > 1) { s.cur--; s.cells[s.cur].querySelector<HTMLSpanElement>('.ch')!.textContent = ''; }
         this.updateCaret(true);
       }
     }
   
     private addPoints(n: number) { this.points = Math.max(0, this.points + n); this.pointsEl.textContent = String(this.points); }

         


        

    // Player manually clicks the Lock Key in the inventory bar
    private useLockKeyFromClick() {
      if (this.lockKeyCount <= 0) {
        this.flashConfirm("No lock keys available", "#ffaa00");
        return;
      }
  
      // Find a locked row to free
      let lockedIndex: number | null = null;
      try {
        const state: any = getTrapStateSafe();
        if (state && state.lockedIndices && typeof state.lockedIndices.has === "function") {
          const arr = Array.from(state.lockedIndices as Set<number>);
          if (arr.length > 0) {
            lockedIndex = arr[0] as number;
          }
        }
      } catch (err) {
        console.warn("[TRAP] unable to inspect lock state in useLockKeyFromClick", err);
      }
  
      if (lockedIndex === null) {
        this.flashConfirm("Nothing to unlock", "#ffaa00");
        return;
      }
  
      // Consume one key
      this.lockKeyCount--;
      (window as any).__lockKeyCount__ = this.lockKeyCount;
      this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);
  
      this.releasedLocks.add(lockedIndex);
      this.refreshLockedFromTraps();
  
      // Move caret to the freed row
      this.currentSlotIndex = lockedIndex;
      this.updateCaret(true);
  
      this.flashConfirm("Lock key used!", "#88ff88");
      console.log("[TRAP] lock key used from inventory click", {
        releasedRow: lockedIndex,
        remainingKeys: this.lockKeyCount,
      });
    }
  


  

   
     private trySubmitCurrent(loseHalfLife: () => void) {
      if (this.isBlockingModalOpen()) return;
       if (this.halfLives <= 0) { this.openLivesModal(); return; }
       const s = this.slots[this.currentSlotIndex]; if (!s) return;
       // TRAPS: if this row is locked, don't allow submission – auto-skip to another row
  if (this.isSlotLocked(this.currentSlotIndex)) {
    const nextIndex = this.findNextUnlockedSlot(this.currentSlotIndex + 1);

    if (nextIndex === -1) {
      console.log("[TRAP] submit blocked – all rows locked");
      this.handleNoAvailableMoves();
    } else {
      // Skip this locked row and move caret to a playable one
      this.flashConfirm("Locked – try another word", "#ffaa00");
      this.currentSlotIndex = nextIndex;
      this.updateCaret(true);
      console.log("[TRAP] submit blocked – skipping to row", nextIndex);
    }
  

    return; // 🔴 IMPORTANT: don't proceed to guess-checking for a locked row
  }

   
       let guess = '';
       for (let i = 0; i < s.len; i++) {
         const t = s.cells[i].querySelector<HTMLSpanElement>('.ch')!.textContent || '';
         guess += t.toLowerCase();
       }
   
       if (guess === s.word) {
         s.cells.forEach(c => c.classList.remove('cursor'));
         const ok = document.getElementById(`ok_${this.currentSlotIndex + 1}`); if (ok) ok.textContent = '✓';
   
         // combo gain + points
         this.comboBar?.gain(0.35);
         let add = BASE_POINTS_PER_WORD;
         const tier = this.comboBar?.getTier() ?? 0;
         if (tier >= 3) add += BOOST_T3;
         else if (tier >= 2) add += BOOST_T2;
         else if (tier >= 1) add += BOOST_T1;
         this.addPoints(add);

                 // TRAPS: capture previous lock index for play-key logic,
      // but IGNORE rows we've already freed via inventory keys.
      let previousLockIndex: number | null = null;
      try {
        const prevState: any = getTrapStateSafe();
        if (
          prevState &&
          prevState.lockedIndices &&
          typeof prevState.lockedIndices.has === "function"
        ) {
          const arr = Array.from(prevState.lockedIndices as Set<number>).filter(
            (idx) => !this.releasedLocks.has(idx)
          );

          if (arr.length > 0) {
            previousLockIndex = arr[0] as number; // we currently lock 1 slot
          }
        }
      } catch (err) {
        console.warn("[TRAP] unable to read previous lock state", err);
      }
 


         // TRAPS: notify trap runtime (observer-only, safe)
if (this.spec.trapsEnabled) {
  try {
    onCorrectWord(this.currentSlotIndex);
  } catch (err) {
    console.warn("[TRAP] onCorrectWord error (ignored)", err);
  }
}



// PLAY-KEY: if we just solved the word AFTER a locked word, release that lock
let playKeyTarget: number | null = null;
if (previousLockIndex !== null && this.currentSlotIndex === previousLockIndex + 1) {
  this.releasedLocks.add(previousLockIndex);
  playKeyTarget = previousLockIndex;
  console.log("[TRAP] play-key released lock", {
    lockedIndex: previousLockIndex,
    solvedIndex: this.currentSlotIndex,
  });
}

// Repaint visual lock state (respecting releasedLocks)
this.refreshLockedFromTraps();

// Check if ALL rows are solved before completing the level
const allSolved = this.slots.every(slot => this.isRowComplete(slot));

// Safety: if we're on the last row and nothing is locked anymore,
// treat this as an end-of-level condition even if allSolved somehow glitches.
const isOnLastRow = this.currentSlotIndex === this.slots.length - 1;
const hasNoLocked = this.lockedSlots === 0;

if (allSolved || (isOnLastRow && hasNoLocked)) {
  // All words solved — NOW the level can end
  this.levelComplete();
} else {
  // Otherwise move to next target row (normal or play-key logic already above)
  let nextIndex: number;

  if (playKeyTarget !== null) {
    nextIndex = playKeyTarget;
  } else {
    nextIndex = this.findNextUnlockedSlot(this.currentSlotIndex + 1);
  }

  if (nextIndex === -1) {
    console.log("[TRAP] no unlocked rows after correct word");
    this.handleNoAvailableMoves();
  } else {
    this.currentSlotIndex = nextIndex;
    this.hintSystem?.clearHintText();
    this.updateCaret(true);
    console.log("[TRAP] caret moved to row", nextIndex);
  }
}

this.ruutCharacter?.setMood("happy");



   
       } else {
         // WRONG (keyboard): red + shake + clear
         s.boxEl.classList.add('wrong', 'shake');
         setTimeout(() => s.boxEl.classList.remove('shake'), 250);
         setTimeout(() => s.boxEl.classList.remove('wrong'), 1000);
         for (let i = 1; i < s.len; i++) s.cells[i].querySelector<HTMLSpanElement>('.ch')!.textContent = '';
         s.cur = Math.min(1, s.len - 1);
         this.flashConfirm('Wrong', '#ff6b6b');
         this.ruutCharacter?.setMood("sad");
         this.updateCaret(true);
         loseHalfLife();
         
       }

       

       
   
       if (this.inputMode === 'wheel' && this.currentSlotIndex < this.slots.length) {
         setTimeout(() => this.mountWheelForCurrentWord(), 100);
       }
     }


          // Try to use a Lock Key to free a locked row.
    // If preferredIndex is given, we try to free that row first.
    private tryUseLockKey(preferredIndex?: number): boolean {
      if (this.lockKeyCount <= 0) return false;

      let lockedIndex: number | null = null;

      try {
        const state: any = getTrapStateSafe();
        if (state && state.lockedIndices && typeof state.lockedIndices.has === "function") {
          const indices = Array.from(state.lockedIndices as Set<number>);
          if (indices.length > 0) {
            if (
              typeof preferredIndex === "number" &&
              indices.includes(preferredIndex)
            ) {
              lockedIndex = preferredIndex;
            } else {
              lockedIndex = indices[0] as number;
            }
          }
        }
      } catch (err) {
        console.warn("[TRAP] unable to inspect lock state in tryUseLockKey", err);
      }

      if (lockedIndex === null) {
        return false;
      }

      this.lockKeyCount--;
      this.releasedLocks.add(lockedIndex);
      this.refreshLockedFromTraps();
      this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);

      this.currentSlotIndex = lockedIndex;
      this.updateCaret(true);

      this.flashConfirm("Lock key used!", "#88ff88");
      console.log("[TRAP] lock key used", {
        releasedRow: lockedIndex,
        remainingKeys: this.lockKeyCount,
      });

      this.updateInventoryUI();
      return true;
    }

    private confirmUseLockKeyFromPrompt(lockedIndex: number) {
      if (this.lockKeyCount <= 0) {
        this.triggerNoMovesFail();
        return;
      }

      // Consume one key and free the row (same behavior as before, but now it's a choice)
      this.lockKeyCount--;
      (window as any).__lockKeyCount__ = this.lockKeyCount;
      this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);
  
      this.releasedLocks.add(lockedIndex);
      this.refreshLockedFromTraps();
  
      this.currentSlotIndex = lockedIndex;
      this.updateCaret(true);
  
      this.flashConfirm("Lock key used!", "#88ff88");
      console.log("[TRAP] lock key used via prompt", {
        releasedRow: lockedIndex,
        remainingKeys: this.lockKeyCount,
      });
    }
  
    private triggerNoMovesFail() {
      if (this.noMovesHandled) return;
      this.noMovesHandled = true;
    
      this.flashConfirm("No available moves", "#ffaa00");
      console.log("[TRAP] No available moves – triggering fail flow");
    
      // Stop the level timer so it doesn't keep ticking
      this.stopLevelClock();
    
      // Global (character) life lost
      this.gameData.loseLife();
      const livesRemaining = this.gameData.getLives();
      const currentLevelId = `land_${this.spec.land}_level_${this.spec.level}`;
    
      // For now: always return to the World Map with one life deducted.
      // (We can wire PenaltyBox / GameOverUI later.)
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("WorldMapScene", {
            fromLevelLabel: this.spec.level,
            autoAdvance: false,
            lastFailedLevelKey: currentLevelId,
            livesRemaining,
          });
        }
      );
    }
    
    

          // === Use Lock Key via Inventory Click (caret-safe & order-aware) ===
  private useLockKeyFromInventoryClick() {
    // no keys? do nothing
    if (this.lockKeyCount <= 0) {
      this.flashConfirm("No keys available", "#ffaa00");
      return;
    }

    // find any still-locked rows
    let lockedIndex: number | null = null;
    try {
      const state: any = getTrapStateSafe();
      if (state && state.lockedIndices && typeof state.lockedIndices.has === "function") {
        const candidates = Array.from(state.lockedIndices as Set<number>)
          .filter((idx) => !this.releasedLocks.has(idx));

        if (candidates.length > 0) {
          // prefer a lock that's ahead of our current row, otherwise the first
          const ahead = candidates.filter((idx) => idx > this.currentSlotIndex);
          lockedIndex = (ahead[0] ?? candidates[0]) as number;
        }
      }
    } catch (err) {
      console.warn("[TRAP] unable to inspect lock state in useLockKeyFromInventoryClick", err);
    }

    // no locked words at all → no movement, no key used
    if (lockedIndex === null) {
      this.flashConfirm("No locked words", "#ffaa00");
      return;
    }

    // consume one key
    this.lockKeyCount--;
    if (this.lockKeyCount < 0) this.lockKeyCount = 0;

    // mark that row as freed
    this.releasedLocks.add(lockedIndex);
    this.refreshLockedFromTraps();

    // NEW: pause the clock and show an open-lock icon briefly
    this.flashUnlockIcon(lockedIndex);

    // persist key count + redraw inventory bar
    this.gameData.setLockKeys(this.lockKeyCount);
    this.powerUpInventory?.setLockKeyCount(this.lockKeyCount);

    // decide whether to move the caret
    const cur = this.slots[this.currentSlotIndex];

    const currentRowStillPlayable =
      !!cur &&
      !this.isSlotLocked(this.currentSlotIndex) &&
      !this.isRowComplete(cur);

    const lockedIsBehind   = lockedIndex < this.currentSlotIndex;
    const lockedIsCurrent  = lockedIndex === this.currentSlotIndex;

    // We jump to the freed row when:
    //  - it's the current row (we just freed ourselves), OR
    //  - it's *behind* us (we've skipped over it and shouldn't leave a hole), OR
    //  - the current row is not playable anymore (locked or already complete)
    const shouldJump =
      lockedIsCurrent ||
      lockedIsBehind ||
      !currentRowStillPlayable;

    if (shouldJump) {
      this.currentSlotIndex = lockedIndex;
    }

    this.updateCaret(true);

    this.flashConfirm("Lock key used!", "#88ff88");
    console.log("[TRAP] lock key used via power bar click", {
      releasedRow: lockedIndex,
      remainingKeys: this.lockKeyCount,
      currentSlotIndex: this.currentSlotIndex,
    });
  }



  

          // ---------- FAIL FLOW: No Available Moves ----------
          private handleNoAvailableMoves() {
            // 1) See if there's a locked row at all
            let lockedIndex: number | null = null;
          
            try {
              const state: any = getTrapStateSafe();
              if (state && state.lockedIndices && typeof state.lockedIndices.has === "function") {
                const arr = Array.from(state.lockedIndices as Set<number>);
                if (arr.length > 0) {
                  // We currently only ever lock one row at a time,
                  // but we still treat it as a generic set.
                  lockedIndex = arr[0] as number;
                }
              }
            } catch (err) {
              console.warn("[TRAP] unable to inspect lock state in handleNoAvailableMoves", err);
            }
          
            // 2) If the player has a Lock Key and there is something to unlock,
            //    show the in-game powerup modal instead of a device confirm.
            if (this.lockKeyCount > 0 && lockedIndex !== null) {
              this.powerUpInventory?.openPrompt(lockedIndex);
              return;
            }
          
            // 3) No keys available OR no locked row → normal fail flow.
            this.triggerNoMovesFail();
          }
          


  
// ⭐ Compute how many stars this run earned based on this.spec.starConfig
private computeStarsForRun(): number {
  const cfg = this.spec.starConfig;
  if (!cfg) return 0;

  // Current run metrics
  const elapsedMs = performance.now() - this.levelStartMs - this.pausedAccumMs;
  const points = this.points;
  const combo = this.comboBar?.getValue() ?? COMBO_MIN;

  let value: number;

  switch (cfg.metric) {
    case 'time':
      value = elapsedMs;
      break;
    case 'points':
      value = points;
      break;
    case 'combo':
      value = combo;
      break;
    default:
      return 0;
  }

  const { thresholds, direction } = cfg;

  if (direction === 'lowerIsBetter') {
    if (value <= thresholds.three) return 3;
    if (value <= thresholds.two)   return 2;
    if (value <= thresholds.one)   return 1;
    return 0;
  } else {
    // higherIsBetter
    if (value >= thresholds.three) return 3;
    if (value >= thresholds.two)   return 2;
    if (value >= thresholds.one)   return 1;
    return 0;
  }
}

   
private async levelComplete() {
  // prevent double-firing if something calls this twice
  if (this.levelCompleted) return;
  this.levelCompleted = true;

  this.flashConfirm('Level Complete!', '#2ee86c');
  this.stopLevelClock();
  this.comboBar?.persist();

  // 🔐 Persist leftover Lock Keys so they carry into the next level
  this.gameData.setLockKeys(this.lockKeyCount);

  // ⭐ Compute elapsed time & stars for this run
  const elapsedMs   = this.getElapsedMs();
  const starsEarned = this.computeCurrentStarCount(elapsedMs);
  // 💎 Diamond clear: extraordinary solve = 3 stars AND <= 50% of the 3-star time requirement
  const diamondEarned = (starsEarned >= 3) && (elapsedMs <= (this.starThreeMs * 0.5));


  // 🔑 Get the proper level key string, e.g. "land_0_level_1"
  const levelKey = this.gameData.getLevelKey(this.spec.land, this.spec.level);

  // ✅ Use the real API from GameDataManager (cast to avoid TS errors if signature isn't updated yet)
  (this.gameData as any).updateLevelResult(
    levelKey,
    starsEarned,
    this.points,
    elapsedMs,
    diamondEarned
  );


  // Decide whether we should auto-advance on the map later
  const maxLevel = Math.max(...DEMO_LEVELS.map(s => s.level));
  const hasNextLevel = this.spec.level < maxLevel;
  this.recapHasNextLevel = hasNextLevel;

  // Show recap overlay instead of immediately bouncing to map
  this.showLevelRecap(starsEarned, this.points, elapsedMs, diamondEarned);

}



    // ⭐ Show end-of-level recap overlay
    private showLevelRecap(stars: number, score: number, timeMs: number, diamond: boolean = false) {

        // Ensure recapStarsEl exists before we try to place anything relative to it
  if (!this.recapStarsEl) return;

  // Create diamond element once
  if (!this.recapDiamondEl) {
    this.recapDiamondEl = document.createElement("div");
    this.recapDiamondEl.textContent = "💎";
    this.recapDiamondEl.style.fontSize = "26px";
    this.recapDiamondEl.style.lineHeight = "1";
    this.recapDiamondEl.style.marginBottom = "6px";
    this.recapDiamondEl.style.display = "none";
    this.recapDiamondEl.style.textAlign = "center";
    this.recapDiamondEl.style.userSelect = "none";
  }

  // Make sure it's attached DIRECTLY ABOVE the text line (DIAMOND / stars)
  // This fixes cases where prepend() puts it somewhere you don't actually see.
  const parent = this.recapStarsEl.parentElement;
  if (parent && this.recapDiamondEl.parentElement !== parent) {
    parent.insertBefore(this.recapDiamondEl, this.recapStarsEl);
  } else if (!parent && this.recapDiamondEl.parentElement !== this.recapOverlayEl) {
    // fallback: if recapStarsEl has no parent for some reason
    this.recapOverlayEl.prepend(this.recapDiamondEl);
  }



      const seconds = Math.floor(timeMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const remSec = seconds % 60;

      const starText =
        stars > 0
          ? '★'.repeat(stars) + '☆'.repeat(3 - stars)
          : '☆☆☆';

      this.recapSummaryEl.textContent =
        `Score: ${score.toLocaleString()} · Time: ${String(minutes).padStart(2,'0')}:${String(remSec).padStart(2,'0')}`;
        // If Diamond is earned, we do NOT show stars.
// We show a single "DIAMOND" badge in icy blue, with spaced letters.
if (diamond) {
  // show diamond icon above the DIAMOND word
  this.recapDiamondEl.style.display = "block";

  // show DIAMOND (no stars)
  this.recapStarsEl.textContent = "DIAMOND";
  (this.recapStarsEl as any).style.color = "#7dd3fc";
  (this.recapStarsEl as any).style.letterSpacing = "0.22em";
  (this.recapStarsEl as any).style.fontWeight = "900";
  (this.recapStarsEl as any).style.textTransform = "uppercase";
  (this.recapStarsEl as any).style.marginTop = "0px";
} else {
  // hide diamond icon
  this.recapDiamondEl.style.display = "none";

  // normal stars
  this.recapStarsEl.textContent = starText;
  (this.recapStarsEl as any).style.color = "#facc15";
  (this.recapStarsEl as any).style.letterSpacing = "0em";
  (this.recapStarsEl as any).style.fontWeight = "800";
  (this.recapStarsEl as any).style.textTransform = "none";
  (this.recapStarsEl as any).style.marginTop = "0px";
}






      this.recapOverlayEl.style.display = 'flex';
      this.recapOverlayEl.classList.add('show');
      this.recapOverlayEl.setAttribute('aria-hidden', 'false');
    }

    private hideLevelRecap() {
      if (!this.recapOverlayEl) return;
      this.recapOverlayEl.classList.remove('show');
      this.recapOverlayEl.setAttribute('aria-hidden', 'true');
      this.recapOverlayEl.style.display = 'none';
    }

        // ⭐ After recap, always return to the map and ask it to auto-advance
        private returnToMapAfterRecap() {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
              this.scene.start("WorldMapScene", {
                fromLevelLabel: this.spec.level, // "1", "2", "3", ...
                autoAdvance: true,               // let WorldMapScene handle clamping
              });
            }
          );
        }
    



    
  
   
     /* ---------- Input mode toggle / wheel mount ---------- */
     private renderInputMode() {
       const kbWrap = document.getElementById('kb')?.parentElement as HTMLElement;
       const wheelWrap = document.getElementById('wheelWrap') as HTMLElement;
       if (this.inputMode === 'keyboard') {
         if (kbWrap) kbWrap.style.display = '';
         if (wheelWrap) wheelWrap.style.display = 'none';
       } else {
         if (kbWrap) kbWrap.style.display = 'none';
         if (wheelWrap) wheelWrap.style.display = '';
         this.mountWheelForCurrentWord();
       }
     }

     private calibrateEdgeOffsetFromPixels(px: number, py: number) {
      const wheel = document.getElementById('wheel') as HTMLElement | null;
      if (!wheel) return;
    
      const w = Math.max(1, wheel.clientWidth);
      const h = Math.max(1, wheel.clientHeight);
    
      this.wheelEdgeOffsetXPct = px / w;
      this.wheelEdgeOffsetYPct = py / h;
    
      // Optional quick console confirmation
      console.log('[WHEEL EDGE CAL]', {
        px, py, w, h,
        xPct: this.wheelEdgeOffsetXPct,
        yPct: this.wheelEdgeOffsetYPct
      });
    }
    
   
    private recomputeWheelCenters() {
      const wheel = document.getElementById('wheel') as HTMLElement;
      if (!wheel || this.wheelNodes.length === 0) return;
    
      // Keep SVG units matched to wheel-local pixels
      if (this.wheelSvg) {
        this.wheelSvg.setAttribute('viewBox', `0 0 ${wheel.clientWidth} ${wheel.clientHeight}`);
        this.wheelSvg.setAttribute('preserveAspectRatio', 'none');
      }
    
      const wr = wheel.getBoundingClientRect();
    
      // ✅ Convert screen-pixels → wheel-local pixels
      const sx = wheel.clientWidth / Math.max(1, wr.width);
      const sy = wheel.clientHeight / Math.max(1, wr.height);
    
      const arr: { x: number; y: number }[] = [];
    
      for (const n of this.wheelNodes) {
        if (!n || !n.isConnected) continue;
        const r = n.getBoundingClientRect();
    
        const cxScreen = r.left + r.width / 2;
        const cyScreen = r.top + r.height / 2;
    
        arr.push({
          x: (cxScreen - wr.left) * sx,
          y: (cyScreen - wr.top) * sy,
        });
      }
    
      this.wheelCenters = arr;
    }
    
    
    
   
     private mountWheelForCurrentWord() {
           // ============================================================
    // WHEEL TUNING (manual nudges + radius scale)
    // ------------------------------------------------------------
    // 1) Nudge: moves the entire wheel (letters + finger-trace) in px
    // 2) Radius scale: grows/shrinks distance from center to letters
    // 3) Lock: recenters wheel using the wheel container’s true center
    //
    // ✅ "Undo" = set these to 0 / 1 and leave everything else.
    // ============================================================
    const WHEEL_LOCK_TO_CONTAINER_CENTER = true;

    // Manual nudge (px): +x right, -x left, +y down, -y up
    const WHEEL_NUDGE_X = 0;
    const WHEEL_NUDGE_Y = 0;

    // Radius scale: 1 = normal, 0.9 smaller, 1.1 bigger
    const WHEEL_RADIUS_SCALE = 1.0;

    // Optional: fine tune radius in px after scaling (usually leave 0)
    const WHEEL_RADIUS_ADD_PX = 0;

       const wheel = document.getElementById('wheel') as HTMLElement;
       const confirm = document.getElementById('wheelConfirm') as HTMLElement;
   
       cancelAnimationFrame(this.wheelRAF);
       if (this.wheelResizeObserver) this.wheelResizeObserver.disconnect();
   
       wheel.innerHTML = ''; this.wheelNodes = []; this.wheelPath = [];
       confirm.textContent = '';
       confirm.style.background = 'rgba(255,255,255,.10)';
   
       const cur = this.slots[this.currentSlotIndex]; if (!cur) return;
       const target = cur.word.toUpperCase().split('');
   
       const cx = wheel.clientWidth / 2, cy = wheel.clientHeight / 2;
       const r = Math.min(cx, cy) - 28;
       const N = Math.max(target.length, 5);
   
       for (let i = 0; i < N; i++) {
         const ch = target[i % target.length];
         const a = (i / N) * Math.PI * 2 - Math.PI / 2;
         const x = cx + r * Math.cos(a) - 22;
         const y = cy + r * Math.sin(a) - 22;
         const node = document.createElement('div'); node.className = 'wl';
         node.style.left = `${x}px`; node.style.top = `${y}px`;
         node.textContent = ch;
         wheel.appendChild(node);
         this.wheelNodes.push(node);
       }
   
       const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('id', 'wheelSvg');
svg.setAttribute('width', '100%');
svg.setAttribute('height', '100%');

// ✅ CRITICAL: make SVG coordinates match wheel pixels (prevents drift on resize/aspect change)
svg.setAttribute('viewBox', `0 0 ${wheel.clientWidth} ${wheel.clientHeight}`);
svg.setAttribute('preserveAspectRatio', 'none');

const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
poly.setAttribute('class', 'trace');
poly.setAttribute('stroke', '#4ade80');
poly.setAttribute('stroke-width', '6');
poly.setAttribute('fill', 'none');
poly.setAttribute('stroke-linecap', 'round');
poly.setAttribute('stroke-linejoin', 'round');

svg.appendChild(poly);
wheel.appendChild(svg);

this.wheelSvg = svg;
this.wheelPolyline = poly;

       // ✅ required nudge: x +28, y +20
       //this.wheelEdgeOffsetX = 28;
       //this.wheelEdgeOffsetY = 20;


       // ✅ One-time calibration using your known-good preview alignment.
// After this works across resize, you can remove this line and keep only the stored pct values.
this.wheelEdgeOffsetXPct = 0.0833;
this.wheelEdgeOffsetYPct = 0.0606;

   
   
       this.recomputeWheelCenters();
       this.wheelResizeObserver = new ResizeObserver(() => this.recomputeWheelCenters());
       this.wheelResizeObserver.observe(wheel);
       this.ensureWheelEdgeTuningHotkeys();

   
       import('../gameplay/WheelGesture').then(({ WheelGesture }) => {
         import('../gameplay/Rules').then(({ evaluateWheelSubmission }) => {
           const R = r;
   
           const wheelGesture = new WheelGesture(
             (pLocal, tol) => {
               let best = -1, bestD = 1e9;
               for (let i = 0; i < this.wheelCenters.length; i++) {
                 const c = this.wheelCenters[i];
                 const d = Math.sqrt((pLocal.x - c.x) ** 2 + (pLocal.y - c.y) ** 2);
                 if (d < bestD) { bestD = d; best = i; }
               }
               return bestD <= tol ? best : null;
             },
             () => Math.max(12, Math.min(0.16 * R, 28)) * this.wheelEdgeScale

           );
   
           const setPolyline = (includePointer = false) => {
             if (!this.wheelPolyline) return;
             const pts: string[] = [];
             for (const i of this.wheelPath) {
               const c = this.wheelCenters[i];
               pts.push(`${c.x},${c.y}`);
             }
             if (includePointer && (this.ptrX !== 0 || this.ptrY !== 0)) {
              pts.push(`${this.ptrX},${this.ptrY}`);
            }
            
             this.wheelPolyline.setAttribute('points', pts.join(' '));
           };
   
           const toLocal = (ev: PointerEvent) => {
            const wr = wheel.getBoundingClientRect();
          
            // ✅ Convert screen-pixels → wheel-local pixels (same as centers)
            const sx = wheel.clientWidth / Math.max(1, wr.width);
            const sy = wheel.clientHeight / Math.max(1, wr.height);
          
            this.ptrX = (ev.clientX - wr.left) * sx;
            this.ptrY = (ev.clientY - wr.top) * sy;
          
            return { x: this.ptrX, y: this.ptrY };
          };
          
          
   
           const begin = (ev: PointerEvent) => {
             const p = toLocal(ev);
             wheelGesture.start(new Phaser.Math.Vector2(p.x, p.y));
             this.wheelPath = wheelGesture.getPath();
             this.wheelNodes.forEach(n => n.classList.remove('sel'));
             this.wheelPath.forEach(i => this.wheelNodes[i]?.classList.add('sel'));
             try { (ev.target as Element).setPointerCapture?.(ev.pointerId); } catch {}
             setPolyline(true);
             confirm.textContent = '';
             confirm.style.background = 'rgba(255,255,255,.10)';
           };
           const move  = (ev: PointerEvent) => {
             const p = toLocal(ev);
             wheelGesture.move(new Phaser.Math.Vector2(p.x, p.y));
             this.wheelPath = wheelGesture.getPath();
             this.wheelNodes.forEach(n => n.classList.remove('sel'));
             this.wheelPath.forEach(i => this.wheelNodes[i]?.classList.add('sel'));
             setPolyline(true);
             const s = this.wheelPath.map(i => this.wheelNodes[i].textContent || '').join('');
             confirm.textContent = s;
           };
           const end   = (ev: PointerEvent) => {
             const p = toLocal(ev);
             const res = wheelGesture.end(new Phaser.Math.Vector2(p.x, p.y));
             try { (ev.target as Element).releasePointerCapture?.(ev.pointerId); } catch {}
             if (!res.submitted) { this.clearWheelLine(); return; }
             this.handleWheelSubmission(res.nodeOrder, evaluateWheelSubmission, confirm, wheel);
           };
   
           wheel.onpointerdown = (e) => { e.preventDefault(); begin(e); };
           wheel.onpointermove = (e) => { e.preventDefault(); move(e); };
           wheel.onpointerup   = (e) => { e.preventDefault(); end(e); };
           wheel.onpointerleave= (e) => { e.preventDefault(); end(e); };
         });
       });
   
       this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
         cancelAnimationFrame(this.wheelRAF);
         if (this.wheelResizeObserver) { this.wheelResizeObserver.disconnect(); this.wheelResizeObserver = undefined; }
       });
     }

     private toEdgeSpace(p: {x:number; y:number}) {
      // Transform wheel-local pointer into edge-space to match transformed centers
      const cx = this.wheelNodeCenter.x;
      const cy = this.wheelNodeCenter.y;
    
      const sx = (p.x - cx) * this.wheelEdgeScale + cx + this.wheelEdgeOffsetX;
      const sy = (p.y - cy) * this.wheelEdgeScale + cy + this.wheelEdgeOffsetY;
    
      return { x: sx, y: sy };
    }
    
    private ensureWheelEdgeTuningHotkeys() {
      if (this.boundWheelTuneKey) return;
    
      this.boundWheelTuneKey = (e: KeyboardEvent) => {
        // Only active while the wheel exists
        const wheel = document.getElementById('wheel');
        if (!wheel || !wheel.isConnected) return;
    
        // Require SHIFT so you don’t accidentally tune while typing
        if (!e.shiftKey) return;
    
        // Bigger steps when holding ALT too
        const step = e.altKey ? 8 : 2;
    
        let changed = false;
    
        // Nudge edges space (SVG trace) without moving nodes
        if (e.key === 'ArrowLeft')  { this.wheelEdgeOffsetX -= step; changed = true; }
        if (e.key === 'ArrowRight') { this.wheelEdgeOffsetX += step; changed = true; }
        if (e.key === 'ArrowUp')    { this.wheelEdgeOffsetY -= step; changed = true; }
        if (e.key === 'ArrowDown')  { this.wheelEdgeOffsetY += step; changed = true; }
    
        // Radius/scale control: SHIFT + (= or +) grows, SHIFT + (-) shrinks
        // Works with both "=" and "+" depending on keyboard
        if (e.key === '=' || e.key === '+') {
          this.wheelEdgeScale = Math.min(1.6, +(this.wheelEdgeScale + 0.02).toFixed(3));
          changed = true;
        }
        if (e.key === '-' || e.key === '_') {
          this.wheelEdgeScale = Math.max(0.6, +(this.wheelEdgeScale - 0.02).toFixed(3));
          changed = true;
        }
    
        // LOCK/RESET: SHIFT + 0 (zero)
        if (e.key === '0') {
          this.wheelEdgeOffsetX = 0;
          this.wheelEdgeOffsetY = 0;
          this.wheelEdgeScale = 1;
          changed = true;
        }
    
        if (!changed) return;
    
        e.preventDefault();

        
    
        // Recompute transformed centers + redraw current polyline
        this.recomputeWheelCenters();
        if (this.wheelPolyline) {
          const pts: string[] = [];
          for (const i of this.wheelPath) {
            const c = this.wheelCenters[i];
            if (c) pts.push(`${c.x},${c.y}`);
          }
          // include pointer if mid-gesture
          const wheelW = Math.max(1, wheel.clientWidth);
const wheelH = Math.max(1, wheel.clientHeight);
const offX = this.wheelEdgeOffsetXPct * wheelW;
const offY = this.wheelEdgeOffsetYPct * wheelH;
pts.push(`${this.ptrX + offX},${this.ptrY + offY}`);

          this.wheelPolyline.setAttribute('points', pts.join(' '));
        }
    
        // Tiny on-screen confirmation (uses wheelConfirm)
        const confirm = document.getElementById('wheelConfirm') as HTMLElement;
        if (confirm) {
          confirm.textContent = `EDGE TUNE  x:${this.wheelEdgeOffsetX}  y:${this.wheelEdgeOffsetY}  r:${this.wheelEdgeScale.toFixed(2)}  (SHIFT+0 resets)`;
          confirm.style.background = 'rgba(255,255,255,.12)';
          window.clearTimeout((confirm as any).__tuneTO);
          (confirm as any).__tuneTO = window.setTimeout(() => {
            // don’t wipe legit submit text; just dim it back
            confirm.style.background = 'rgba(255,255,255,.10)';
          }, 900);
        }
      };
    
      window.addEventListener('keydown', this.boundWheelTuneKey);
    
      // Auto-unbind on scene shutdown (no spaghetti)
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        if (this.boundWheelTuneKey) {
          window.removeEventListener('keydown', this.boundWheelTuneKey);
          this.boundWheelTuneKey = undefined;
        }
      });
    }
    
   
     private clearWheelLine() {
       this.wheelNodes.forEach(n => n.classList.remove('sel'));
       this.wheelPath = [];
       if (this.wheelPolyline) this.wheelPolyline.setAttribute('points', '');
       const confirm = document.getElementById('wheelConfirm') as HTMLElement;
       if (confirm) { confirm.style.background = 'rgba(255,255,255,.10)'; }
     }
   
     /* ---------- Wheel submission with WRONG animation fixed ---------- */
     private handleWheelSubmission(nodes: number[], evaluateWheelSubmission: any, confirmEl: HTMLElement, wheelEl: HTMLElement) {
       const cur = this.slots[this.currentSlotIndex];
       if (!cur) return;
   
       const pathLetters = nodes.map(i => this.wheelNodes[i].textContent || '');
       const guess = pathLetters.join('').toLowerCase();
       const targetFull = cur.word;
       const targetSkipFirst = targetFull.slice(1);
   
       LogBus.log('Wheel', 'submit', { letters: pathLetters, word: guess });
   
       const validWords = new Set([targetFull, targetSkipFirst]);
       const anyTargetStartsWith = (prefix: string) =>
         targetFull.startsWith(prefix) || targetSkipFirst.startsWith(prefix);
   
       const evaluation = evaluateWheelSubmission(
         pathLetters.map(l => l.toLowerCase()),
         validWords,
         anyTargetStartsWith,
         { forgiveShortTwoLetter: true, minWordLen: 2 }
       );
   
       if (evaluation.ok) {
         for (let i = 1; i < cur.len; i++) {
           cur.cells[i].querySelector<HTMLSpanElement>('.ch')!.textContent = cur.word[i];
         }
         confirmEl.textContent = guess.toUpperCase();
         confirmEl.style.background = 'rgba(46,232,108,.25)';
         this.trySubmitCurrent(() => {});
         // clear immediately after success so we don’t leave residue
         setTimeout(() => this.clearWheelLine(), 120);
       } else {
         // Show WRONG clearly, then defer clearing so shake is visible.
         confirmEl.textContent = (guess || '✖').toUpperCase();
         confirmEl.style.background = 'rgba(255,107,107,.25)';
   
         // Shake wheel element
         wheelEl.style.transform = 'translateX(6px)';
         setTimeout(() => wheelEl.style.transform = 'translateX(-6px)', 50);
         setTimeout(() => wheelEl.style.transform = 'translateX(6px)', 100);
         setTimeout(() => wheelEl.style.transform = 'translateX(-6px)', 150);
         setTimeout(() => wheelEl.style.transform = '', 200);
   
         // Life penalty visual stays consistent with keyboard path
         if (this.halfLives > 0) {
           this.halfLives -= 1;
           this.livesEl.innerHTML = '';
           const total = this.heartSlots;
           let halves = Math.max(0, Math.min(this.halfLives, total * 2));
           for (let i = 0; i < total; i++) {
             const left = Math.max(0, Math.min(2, halves)); halves -= left;
             const icon = left >= 2
               ? `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="#ff375f" stroke="#a00" stroke-width="0.6"/></svg>`
               : left === 1
               ? `<svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="halfFill" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="rgba(0,0,0,0)" /><stop offset="50%" stop-color="rgba(0,0,0,0)" /><stop offset="50%" stop-color="#ff375f" /><stop offset="100%" stop-color="#ff375f" /></linearGradient></defs><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="url(#halfFill)" stroke="#a00" stroke-width="0.6"/></svg>`
               : `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21s-6.7-4.35-9.5-8.03C-0.7 9.55 1.2 5.5 4.8 5.1c2.1-.24 3.7.86 4.7 2.2 1-1.34 2.6-2.44 4.7-2.2 3.6.4 5.5 4.45 2.3 7.87C18.7 16.65 12 21 12 21z" fill="rgba(0,0,0,0)" stroke="#ffffffaa" stroke-width="1"/></svg>`;
             const wrap = document.createElement('span'); wrap.className = 'heartSvg'; wrap.innerHTML = icon;
             this.livesEl.appendChild(wrap);
           }
         }
   
         // DEFER line/pill clearing so the red state is visible
         setTimeout(() => this.clearWheelLine(), 450);
       }
     }
   
     /* ---------- Pill helper ---------- */
     private flashConfirm(text: string, color: string) {
       const pill = document.getElementById('wheelConfirm') as HTMLElement | null;
       if (!pill) return;
       pill.textContent = text;
       pill.style.background = color === '#ff6b6b'
         ? 'rgba(255,107,107,.25)'
         : color === '#2ee86c'
         ? 'rgba(46,232,108,.25)'
         : 'rgba(255,255,255,.18)';
     }
   
     /* ---------- Teardown ---------- */
     private teardown() {
      window.removeEventListener('resize', this.onLayoutResize);

      this.ruutCharacter?.shutdown();
       if (this.boundNativeKey) { window.removeEventListener('keydown', this.boundNativeKey as any); this.boundNativeKey = undefined; }
       this.hintSystem?.shutdown();
       this.powerUpInventory?.shutdown();
       this.comboBar?.shutdown();
       clearInterval(this.livesCdTimer);
       this.stopLevelClock();
       document.removeEventListener('visibilitychange', this.handleVisibility, false);
     }
   }
  
