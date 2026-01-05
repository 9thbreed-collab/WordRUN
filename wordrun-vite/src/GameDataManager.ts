/* =================================================================
   FILE: src/GameDataManager.ts
   PURPOSE: Single source of truth for lives, penalty, progression
   ================================================================= */
   import { GAME_CONFIG } from './config';

   type SaveState = {
     land: number;
     level: number;
     lives: number;
     penaltyBoxEnd?: number; // epoch millis
     penaltyEntryCountInLand: number; // escalates wait tier
     aggregateWrongsInLand: number;
   };
   
   const LS_KEY = 'wordrun_save_v1';
   const LS_STARS_KEY = 'wordrun_stars_v1';
   
   // ⭐ Per-level progress stored by levelKey ("land_0_level_1", etc.)
   type LevelProgress = {
     bestStars: number;
     /** If true, this level has been completed with a Diamond (extraordinary) clear at least once. */
     bestDiamond: boolean;
     bestScore: number;
     bestTimeMs: number;
   };
   
   type StarsSave = {
     levelProgress: Record<string, LevelProgress>;
     totalStars: number;
   };
   
   export class GameDataManager {
     private static _inst: GameDataManager;
     private state: SaveState;
   
     // ⭐ NEW: level → progress, and global star currency
     private levelProgress: Record<string, LevelProgress> = {};
     private totalStars: number = 0;
   
     // Turn (land, level) into a stable key
     public getLevelKey(land: number, level: number): string {
       return `land_${land}_level_${level}`;
     }
   
     public getLevelProgress(levelKey: string): LevelProgress {
       if (!this.levelProgress[levelKey]) {
         this.levelProgress[levelKey] = {
           bestStars: 0,
           bestDiamond: false,
           bestScore: 0,
           bestTimeMs: Number.POSITIVE_INFINITY,
         };
       }
       return this.levelProgress[levelKey];
     }
   
     public getLevelStars(levelKey: string): number {
       return this.getLevelProgress(levelKey).bestStars;
     }
   
     public getLevelDiamond(levelKey: string): boolean {
       return this.getLevelProgress(levelKey).bestDiamond;
     }
   
     public updateLevelResult(
       levelKey: string,
       stars: number,
       score: number,
       timeMs: number,
       diamondEarned: boolean = false
     ) {
       const prev = this.getLevelProgress(levelKey);
       const prevStars = prev.bestStars;
   
       const newBestStars = Math.max(prev.bestStars, stars);
   
       // Diamond is only meaningful on a 3-star (or better) clear.
       const eligibleDiamond = stars >= 3 && diamondEarned;
       const newBestDiamond = prev.bestDiamond || eligibleDiamond;
   
       this.levelProgress[levelKey] = {
         bestStars: newBestStars,
         bestDiamond: newBestDiamond,
         bestScore: Math.max(prev.bestScore, score),
         bestTimeMs: Math.min(prev.bestTimeMs, timeMs),
       };
   
       // If we improved our best star count, add the difference to total stars
       if (newBestStars > prevStars) {
         const gained = newBestStars - prevStars;
         this.totalStars += gained;
       }
   
       // Persist levelProgress + totalStars
       this.flushStars();
     }
   
     public getTotalStars(): number {
       return this.totalStars;
     }
   
     public canAffordStars(cost: number): boolean {
       return this.totalStars >= cost;
     }
   
     public spendStars(cost: number): boolean {
       if (this.totalStars < cost) return false;
       this.totalStars -= cost;
       this.flushStars();
       return true;
     }
   
     resetAllProgress(): void {
       localStorage.removeItem('wordrun_save_v1');
       localStorage.removeItem(LS_STARS_KEY);
       this.resetState();
     }
   
     private lockKeys = 0;
   
     // --- Lock Key inventory ---
     getLockKeys(): number {
       return this.lockKeys;
     }
   
     setLockKeys(n: number) {
       const val = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
       this.lockKeys = val;
     }
   
     addLockKeys(delta: number) {
       this.setLockKeys(this.lockKeys + delta);
     }
   
     static getInstance(): GameDataManager {
       if (!this._inst) this._inst = new GameDataManager();
       return this._inst;
     }
   
     private constructor() {
       const raw = localStorage.getItem(LS_KEY);
       if (raw) {
         this.state = JSON.parse(raw);
       } else {
         this.state = {
           land: 1,
           level: 1,
           lives: GAME_CONFIG.livesPerLand,
           penaltyEntryCountInLand: 0,
           aggregateWrongsInLand: 0,
         };
         this.flush();
       }
   
       // ⭐ Load star/diamond progress (separate key so we can evolve save formats safely)
       try {
         const starsRaw = localStorage.getItem(LS_STARS_KEY);
         if (starsRaw) {
           const parsed = JSON.parse(starsRaw) as Partial<StarsSave>;
           if (parsed && typeof parsed === 'object') {
             if (parsed.levelProgress && typeof parsed.levelProgress === 'object') {
               this.levelProgress = parsed.levelProgress as Record<string, LevelProgress>;
             }
             if (typeof parsed.totalStars === 'number' && Number.isFinite(parsed.totalStars)) {
               this.totalStars = Math.max(0, Math.floor(parsed.totalStars));
             }
           }
         }
       } catch (err) {
         console.warn('[GameDataManager] Failed to load star progress; starting fresh.', err);
         this.levelProgress = {};
         this.totalStars = 0;
       }
   
       // Dev QoL
       if (GAME_CONFIG.dev.clearPenaltyOnStartup) {
         delete this.state.penaltyBoxEnd;
         this.state.penaltyEntryCountInLand = 0;
         this.flush();
       }
     }
   
     private flush() {
       localStorage.setItem(LS_KEY, JSON.stringify(this.state));
     }
   
     private flushStars() {
       const payload: StarsSave = {
         levelProgress: this.levelProgress,
         totalStars: this.totalStars,
       };
       localStorage.setItem(LS_STARS_KEY, JSON.stringify(payload));
     }
   
     getLand() { return this.state.land; }
     getLevel() { return this.state.level; }
     getLives() { return this.state.lives; }
   
     setProgress(land: number, level: number) {
       this.state.land = land;
       this.state.level = level;
       this.flush();
     }
   
     loseLife() {
       this.state.lives = Math.max(0, this.state.lives - 1);
       this.flush();
     }
   
     refillLives() {
       this.state.lives = GAME_CONFIG.livesPerLand;
       this.flush();
     }
   
     addAggregateWrong() {
       this.state.aggregateWrongsInLand += 1;
       this.flush();
     }
   
     resetAggregateWrong() {
       this.state.aggregateWrongsInLand = 0;
       this.flush();
     }
   
     nextLand() {
       this.state.land += 1;
       this.state.lives = GAME_CONFIG.livesPerLand;
       this.state.penaltyEntryCountInLand = 0;
       this.state.aggregateWrongsInLand = 0;
       this.flush();
     }
   
     getPenaltyBoxEnd(): number | undefined {
       return this.state.penaltyBoxEnd;
     }
   
     isInPenaltyBox(now = Date.now()): boolean {
       if (!this.state.penaltyBoxEnd) return false;
       return now < this.state.penaltyBoxEnd;
     }
   
     enterPenaltyBox(now = Date.now()) {
       // escalate tier within the same land
       const idx = Math.min(
         this.state.penaltyEntryCountInLand,
         GAME_CONFIG.penaltyWaitTiersMinutes.length - 1
       );
       const waitMin = GAME_CONFIG.penaltyWaitTiersMinutes[idx];
       const end = now + waitMin * 60 * 1000;
   
       this.state.penaltyBoxEnd = end;
       this.state.penaltyEntryCountInLand += 1;
       this.flush();
     }
   
     exitPenaltyBox() {
       delete this.state.penaltyBoxEnd;
       this.flush();
     }
   
     resetProgress() {
       this.state = {
         land: 1,
         level: 1,
         lives: GAME_CONFIG.livesPerLand,
         penaltyEntryCountInLand: 0,
         aggregateWrongsInLand: 0,
       };
       this.flush();
   
       // Reset star + diamond progress too
       this.levelProgress = {};
       this.totalStars = 0;
       this.flushStars();
     }
   
     private resetState() {
       this.state = {
         land: 1,
         level: 1,
         lives: GAME_CONFIG.livesPerLand,
         penaltyEntryCountInLand: 0,
         aggregateWrongsInLand: 0,
       };
       this.flush();
   
       this.levelProgress = {};
       this.totalStars = 0;
       this.flushStars();
     }
   }
   