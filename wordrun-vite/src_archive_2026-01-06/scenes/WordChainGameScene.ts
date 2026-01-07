/* =================================================================
   FILE: src/scenes/WordChainGameScene.ts
   PURPOSE: Main gameplay scene for LINKED MINDS word chain puzzle
   ================================================================= */

   import Phaser from 'phaser';
   import { GameDataManager } from '../GameDataManager';
   import { PuzzleLoader } from '../PuzzleData';
   import type { PuzzleData, WordChainState } from '../PuzzleData';
   import { TypingEngine } from '../TypingEngine';
   import type { TypingResult } from '../TypingEngine';
   import { ScoreManager } from '../ScoreManager';
   import { TrapSystem } from '../TrapSystem';
   import { GameModeManager } from '../GameModes';
   import type { GameMode } from '../GameModes';
   import { AdManager } from '../AdManager';
   import * as utils from '../utils';
   
   export class WordChainGameScene extends Phaser.Scene {
     private gameData!: GameDataManager;
     private puzzle!: PuzzleData;
     private wordChain!: WordChainState;
     private typingEngine!: TypingEngine;
     private scoreManager!: ScoreManager;
     private trapSystem!: TrapSystem;
     private gameModeManager!: GameModeManager;
     private adManager!: AdManager;
   
     // UI Elements
     private uiContainer!: Phaser.GameObjects.DOMElement;
     private inputField!: HTMLInputElement;
     private chainProgress!: HTMLElement;
     private statsDisplay!: HTMLElement;
     private messageDisplay!: HTMLElement;
   
     // Word Box elements (both modes)
     private wordPrevEl?: HTMLElement;
     private wordCurrentEl?: HTMLElement;
     private wordNextEl?: HTMLElement;
   
     // Game State
     private isActive: boolean = false;
     private currentWordStartTime: number = 0;
     private levelStartTime: number = 0;
     private hintsUsedThisWord: number = 0;
     private skipsRemaining: number = 3;
     private undoAvailable: boolean = true;
     private lastInput: string = '';
     private lastInputTime: number = 0;
   
     // To prevent “same word, same index” being treated as a new solve
     private lastCorrectIndex: number | null = null;
     private lastCorrectWord: string | null = null;
   
     // Story mode timer
     private timeLimit: number = 0;
     private timeRemaining: number = 0;
   
     // Power-ups and tokens (story mode)
     private hintTokens: number = 5;
     private skipTokens: number = 3;
     private surgeTokens: number = 1;
     private freezeTokens: number = 1;
   
     // Modes
     private mode: 'story' | 'versus' = 'story';
     private isVersus: boolean = false;
   
     // Versus state
     private playerTurn: 0 | 1 = 0;
     private playerScores = [0, 0];
     private playerTimes = [120, 120]; // seconds per player
   
     // Versus per-player hints
     private playerHintTokens = [3, 3]; // P1 & P2 hints for Versus only
   
     // Versus UI references
     private p1TimeEl?: HTMLElement;
     private p2TimeEl?: HTMLElement;
     private p1HeartEl?: HTMLElement;
     private p2HeartEl?: HTMLElement;
   
     // Versus flow
     private turnOverlayEl?: HTMLElement;
     private readyButtonEl?: HTMLElement;
     private versusTimerEvent?: Phaser.Time.TimerEvent;
     private isVersusTurnActive: boolean = false;
     private versusMatchOver: boolean = false;
     private versusLastRealTime: number = 0;
   
     private updateVersusHintLabel() {
       if (!this.isVersus) return;
       const hintBtn = this.uiContainer.getChildByID('hint-btn') as
         | HTMLButtonElement
         | null;
       if (!hintBtn) return;
       hintBtn.textContent = `💡 Hint (${this.playerHintTokens[this.playerTurn]})`;
     }
   
     constructor() {
       super({ key: 'WordChainGameScene' });
     }
   
     init(data: { mode?: GameMode | 'versus'; land?: number; level?: number }) {
       this.gameData = GameDataManager.getInstance();
       this.adManager = AdManager.getInstance();
   
       // Core managers
       this.typingEngine = new TypingEngine();
       this.scoreManager = new ScoreManager();
       this.trapSystem = new TrapSystem(this.onTrapTriggered.bind(this));
   
       // For GameModeManager, we never pass "versus" (it only knows story modes)
       const initialMode: GameMode = (data.mode === 'versus'
         ? 'story'
         : data.mode || 'story') as GameMode;
       this.gameModeManager = new GameModeManager(initialMode);
   
       // Scene-level mode flag
       this.mode = data.mode === 'versus' ? 'versus' : 'story';
       this.isVersus = this.mode === 'versus';
   
       // Reset story tokens to defaults first
       this.hintTokens = 5;
       this.skipTokens = 3;
       this.surgeTokens = 1;
       this.freezeTokens = 1;
   
       if (this.isVersus) {
         console.log('[VERSUS] WordChain scene initialized in versus mode');
   
         // Versus basics
         this.playerTurn = 0;
         this.playerScores = [0, 0];
         this.playerTimes = [120, 120]; // 2:00 per player
   
         // Per-player hint pools for Versus
         this.playerHintTokens = [3, 3];
   
         // Story tokens are not used in Versus
         this.hintTokens = 0;
         this.skipTokens = 0;
         this.surgeTokens = 0;
         this.freezeTokens = 0;
       }
   
       // Use provided land/level or get from save data
       const land = data.land || this.gameData.getLand();
       const level = data.level || this.gameData.getLevel();
   
       this.loadPuzzle(land, level);
     }
   
     async create() {
       this.isActive = true;
       this.levelStartTime = Date.now();
       this.currentWordStartTime = this.levelStartTime;
   
       // Ensure puzzle is loaded before we touch this.puzzle.land
       if (!this.puzzle) {
         const land = this.gameData.getLand();
         const level = this.gameData.getLevel();
         await this.loadPuzzle(land, level);
       }
   
       this.createUI();
       this.setupInput();
       this.updateDisplay();
       this.startCurrentWord();
   
       // Story mode timer
       if (
         !this.isVersus &&
         this.puzzle.time_limit_seconds &&
         this.puzzle.time_limit_seconds > 0
       ) {
         this.timeLimit = this.gameModeManager.calculateTimeLimit(
           this.puzzle.time_limit_seconds * 1000
         );
         this.timeRemaining = this.timeLimit;
         this.startTimer();
       }
   
       // First level helper (story only)
       if (!this.isVersus && this.gameData.getLevel() === 1) {
         this.showMessage(
           'Type the next word in the chain! Use "?" for hints, "/skip" to skip.',
           5000
         );
       }
   
       // Versus: starter word counted as completed, start on word index 1
       if (this.isVersus && this.wordChain && this.wordChain.words.length > 1) {
         this.wordChain.completedIndices.add(0);
         this.wordChain.currentIndex = 1;
       }
     }
   
     private async loadPuzzle(land: number, level: number) {
       const puzzleData = await PuzzleLoader.loadPuzzle(land, level);
       if (!puzzleData) {
         throw new Error(`Failed to load puzzle for Land ${land}, Level ${level}`);
       }
   
       this.puzzle = puzzleData;
       this.wordChain = PuzzleLoader.createWordChainState(this.puzzle);
   
       // Initialize trap system with puzzle data (story mode only)
       if (
         !this.isVersus &&
         this.puzzle.locked_indices &&
         this.puzzle.locked_indices.length > 0
       ) {
         this.trapSystem.triggerLockdown(
           this.puzzle.words,
           -1,
           this.puzzle.locked_indices.length
         );
       }
     }
   
     private createUI() {
       const bgUrl =
         'https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/gameplay-screens/background_sunny_trail.svg';
   
       const uiHTML = `
         <style>
           #wrap_root {
             position: absolute;
             inset: 0;
             margin: 0;
             padding: 0;
             display: flex;
             flex-direction: column;
             color: #f9fafb;
             font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
             background-color: #0b1827;
             background-image: url('${bgUrl}');
             background-size: cover;
             background-position: center;
           }
   
           .wrapInner {
             position: relative;
             flex: 1;
             display: flex;
             flex-direction: column;
             padding: 12px 10px;
             backdrop-filter: blur(2px);
             background: linear-gradient(
               to bottom,
               rgba(0, 0, 0, 0.45),
               rgba(0, 0, 0, 0.8)
             );
           }
   
           .wc-header {
             border-bottom: 1px solid rgba(255, 255, 255, 0.15);
             padding-bottom: 6px;
             margin-bottom: 6px;
           }
   
           .wc-title-row {
             display: flex;
             align-items: center;
             justify-content: space-between;
             gap: 8px;
           }
   
           .wc-title {
             font-size: 15px;
             font-weight: 700;
             letter-spacing: 0.08em;
             text-transform: uppercase;
           }
   
           .wc-level-meta {
             font-size: 11px;
             opacity: 0.9;
             white-space: nowrap;
           }
   
           .wc-stats {
             margin-top: 4px;
             font-size: 11px;
             display: grid;
             grid-template-columns: repeat(4, minmax(0, 1fr));
             gap: 6px;
           }
   
           .wc-chain {
             flex: 1;
             display: flex;
             flex-direction: column;
             align-items: center;
             padding: 8px 0;
             overflow-y: hidden;
           }
   
           .wc-current-box {
             background: rgba(15, 23, 42, 0.92);
             border-radius: 20px;
             padding: 16px 16px;
             margin: 0 auto 10px auto;
             width: 92%;
             max-width: 420px;
             height: 55vh;
             display: flex;
             flex-direction: column;
             justify-content: center;
             align-items: center;
             border: 1px solid rgba(148, 163, 184, 0.8);
             box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
             box-sizing: border-box;
             text-align: center;
           }
   
           .wc-current-word {
             font-weight: 800;
             letter-spacing: 0.05em;
             text-transform: uppercase;
           }
   
           /* Main big word */
           #wc-word-current {
             font-size: clamp(28px, 5.5vh, 40px);
             color: #fde68a;
             margin: 6px 0;
           }
   
           /* Smaller top / bottom words */
           .wc-current-word.subtle {
             font-size: clamp(16px, 3vh, 22px);
             color: #e5e7eb;
             opacity: 0.9;
           }
   
           .wc-current-help {
             font-size: 12px;
             color: #d1d5db;
             margin-top: 8px;
           }
   
           .wc-input-row {
             margin-top: 10px;
             width: 100%;
             max-width: 420px;
           }
   
           .wc-input {
             width: 100%;
             padding: 10px 12px;
             font-size: 16px;
             background: rgba(15, 23, 42, 0.95);
             border-radius: 999px;
             border: 1px solid rgba(148, 163, 184, 0.9);
             color: #f9fafb;
             outline: none;
             text-align: center;
           }
   
           .wc-input:focus {
             border-color: #60a5fa;
             box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.4);
           }
   
           @keyframes wc-pill-wrong {
             0% { transform: translateX(0); }
             25% { transform: translateX(-4px); }
             50% { transform: translateX(4px); }
             75% { transform: translateX(-3px); }
             100% { transform: translateX(0); }
           }
   
           .wc-input.wrong {
             animation: wc-pill-wrong 0.25s ease;
             border-color: #f97373 !important;
           }
   
           #input-suggestions {
             margin-top: 2px;
             font-size: 11px;
             color: #e5e7eb;
           }
   
           .wc-powerups {
             margin-top: 8px;
             display: grid;
             grid-template-columns: repeat(4, minmax(0, 1fr));
             gap: 6px;
             font-size: 11px;
             width: 100%;
             max-width: 420px;
           }
   
           .wc-kb-row {
             margin-top: 8px;
             display: flex;
             flex-wrap: wrap;
             justify-content: center;
             gap: 4px;
             width: 100%;
             max-width: 420px;
           }
   
           .wc-key-key {
             min-width: 28px;
             padding: 6px 8px;
             border-radius: 6px;
             border: none;
             background: rgba(15, 23, 42, 0.95);
             color: #e5e7eb;
             font-size: 12px;
             cursor: pointer;
             box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
           }
   
           .wc-key-key:active {
             transform: translateY(1px);
             box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
           }
   
           #message-display {
             position: absolute;
             left: 12px;
             right: 12px;
             bottom: 12px;
             font-size: 12px;
             text-align: center;
             padding: 6px 10px;
             border-radius: 999px;
             background: rgba(15, 23, 42, 0.95);
             color: #e5e7eb;
           }
   
           #loading-overlay {
             position: absolute;
             inset: 0;
             display: none;
             align-items: center;
             justify-content: center;
             background: rgba(0, 0, 0, 0.75);
           }
   
           /* End-of-match popup */
           #wc-end-popup-backdrop {
             position: fixed;
             inset: 0;
             background: rgba(0, 0, 0, 0.75);
             display: flex;
             align-items: center;
             justify-content: center;
             z-index: 9999;
           }
   
           #wc-end-popup-card {
             background: rgba(15, 23, 42, 0.98);
             border-radius: 16px;
             padding: 18px 16px;
             width: 80%;
             max-width: 360px;
             box-shadow: 0 12px 24px rgba(0, 0, 0, 0.7);
             color: #e5e7eb;
             text-align: center;
             border: 1px solid rgba(148, 163, 184, 0.8);
           }
   
           #wc-end-popup-card h2 {
             font-size: 18px;
             margin-bottom: 8px;
             font-weight: 700;
           }
   
           #wc-end-popup-message {
             white-space: pre-line;
             font-size: 14px;
             margin-bottom: 14px;
           }
   
           #wc-end-popup-ok {
             padding: 8px 16px;
             border-radius: 999px;
             border: none;
             background: #4ade80;
             color: #111827;
             font-weight: 600;
             font-size: 14px;
             cursor: pointer;
           }
   
           #wc-end-popup-ok:active {
             transform: translateY(1px);
           }
         </style>
   
         <div id="wrap_root">
           <div class="wrapInner">
             <!-- Header -->
             <div class="wc-header">
               <div class="wc-title-row">
                 <div class="wc-title">LINKED MINDS</div>
                 <div class="wc-level-meta">
                   <span id="land-level">Land ${this.puzzle.land} • Level ${this.puzzle.level}</span>
                   <span id="timer" class="ml-2 hidden"></span>
                 </div>
               </div>
   
               <!-- Stats Bar (gets replaced in Versus) -->
               <div id="stats-display" class="wc-stats">
                 <div>Lives: <span id="lives-count">${this.gameData.getLives()}</span></div>
                 <div>Streak: <span id="streak-count">0</span></div>
                 <div>Score: <span id="score-count">0</span></div>
                 <div>Mode: <span id="mode-display">${this.gameModeManager.getCurrentMode()}</span></div>
               </div>
             </div>
   
             <!-- Main Area -->
             <div class="wc-chain">
               <!-- Answer key turned off (hidden) -->
               <div id="chain-progress" style="display:none;"></div>
   
               <!-- Big Word Box -->
               <div class="wc-current-box">
                 <div id="wc-word-prev" class="wc-current-word subtle"></div>
                 <div id="wc-word-current" class="wc-current-word"></div>
                 <div id="wc-word-next" class="wc-current-word subtle"></div>
                 <div class="wc-current-help">
                   Type the next word in the chain
                 </div>
               </div>
   
               <!-- Input Area -->
               <div class="wc-input-row">
                 <input
                   id="word-input"
                   type="text"
                   placeholder="Type your answer..."
                   class="wc-input"
                   autocomplete="off"
                   autocapitalize="off"
                   spellcheck="false"
                 />
                 <div id="input-suggestions" class="hidden"></div>
               </div>
   
               <!-- Power-ups row -->
               <div class="wc-powerups">
                 <button id="hint-btn" class="game-3d-container-clickable-blue-500 p-2 rounded">
                   💡 Hint (${this.hintTokens})
                 </button>
                 <button id="skip-btn" class="game-3d-container-clickable-yellow-500 p-2 rounded">
                   ⏭️ Skip (${this.skipTokens})
                 </button>
                 <button id="surge-btn" class="game-3d-container-clickable-green-500 p-2 rounded">
                   ⚡ Surge (${this.surgeTokens})
                 </button>
                 <button id="freeze-btn" class="game-3d-container-clickable-purple-500 p-2 rounded">
                   ❄️ Freeze (${this.freezeTokens})
                 </button>
               </div>
   
               <!-- On-screen keyboard -->
               <div id="on-screen-keyboard" class="wc-kb-row"></div>
             </div>
   
             <!-- Message + Loading -->
             <div id="message-display" class="hidden"></div>
   
             <div id="loading-overlay" class="hidden">
               <div class="text-white text-sm">Loading...</div>
             </div>
           </div>
         </div>
       `;
   
       this.uiContainer = utils.initUIDom(this, uiHTML);
   
       // Element references
       this.inputField = this.uiContainer.getChildByID(
         'word-input'
       ) as HTMLInputElement;
       this.chainProgress = this.uiContainer.getChildByID(
         'chain-progress'
       ) as HTMLElement;
       this.statsDisplay = this.uiContainer.getChildByID(
         'stats-display'
       ) as HTMLElement;
       this.messageDisplay = this.uiContainer.getChildByID(
         'message-display'
       ) as HTMLElement;
       this.wordPrevEl = this.uiContainer.getChildByID(
         'wc-word-prev'
       ) as HTMLElement;
       this.wordCurrentEl = this.uiContainer.getChildByID(
         'wc-word-current'
       ) as HTMLElement;
       this.wordNextEl = this.uiContainer.getChildByID(
         'wc-word-next'
       ) as HTMLElement;
   
       if (this.isVersus) {
         this.setupVersusUI();
         this.showVersusTurnOverlay();
       }
     }
   
     private setupInput() {
       if (this.inputField) {
         this.inputField.focus();
         this.inputField.addEventListener('keydown', (event) => {
           if (event.key === 'Enter') {
             this.handleSubmission(this.inputField.value);
           } else if (event.key === 'Escape') {
             this.inputField.value = '';
           }
         });
       }
   
       this.setupPowerUpButtons();
   
       const kbContainer = this.uiContainer.getChildByID(
         'on-screen-keyboard'
       ) as HTMLElement | null;
   
       if (kbContainer && this.inputField) {
         const keys = 'QWERTYUIOPASDFGHJKLZXCVBNM';
   
         // Letter keys
         keys.split('').forEach((ch) => {
           const btn = document.createElement('button');
           btn.type = 'button';
           btn.className = 'wc-key-key';
           btn.textContent = ch;
           btn.addEventListener('click', () => {
             this.inputField.value += ch.toLowerCase();
             this.inputField.focus();
           });
           kbContainer.appendChild(btn);
         });
   
         // Backspace
         const backspace = document.createElement('button');
         backspace.type = 'button';
         backspace.className = 'wc-key-key';
         backspace.textContent = '⌫';
         backspace.addEventListener('click', () => {
           const v = this.inputField.value;
           this.inputField.value = v.slice(0, Math.max(0, v.length - 1));
           this.inputField.focus();
         });
         kbContainer.appendChild(backspace);
   
         // Enter
         const enter = document.createElement('button');
         enter.type = 'button';
         enter.className = 'wc-key-key';
         enter.textContent = '⏎';
         enter.addEventListener('click', () => {
           this.handleSubmission(this.inputField.value);
         });
         kbContainer.appendChild(enter);
       }
       // 🔹 Keep caret on the main input even after clicks
const root = this.uiContainer.getChildByID('wrap_root') as HTMLElement | null;
if (root && this.inputField) {
  root.addEventListener('mousedown', (evt) => {
    // If they clicked directly into the input, do nothing
    if (evt.target === this.inputField) return;

    // Otherwise, immediately refocus the main input
    setTimeout(() => {
      if (!this.isActive) return;
      this.inputField.focus();
    }, 0);
  });
}

     }
   
     private setupPowerUpButtons() {
       const hintBtn = this.uiContainer.getChildByID(
         'hint-btn'
       ) as HTMLButtonElement;
       const skipBtn = this.uiContainer.getChildByID(
         'skip-btn'
       ) as HTMLButtonElement;
       const surgeBtn = this.uiContainer.getChildByID(
         'surge-btn'
       ) as HTMLButtonElement;
       const freezeBtn = this.uiContainer.getChildByID(
         'freeze-btn'
       ) as HTMLButtonElement;
   
       hintBtn?.addEventListener('click', () => this.useHint());
       skipBtn?.addEventListener('click', () => this.useSkip());
       surgeBtn?.addEventListener('click', () => this.useSurge());
       freezeBtn?.addEventListener('click', () => this.useFreeze());
   
       // Versus: only Hint is active
       if (this.isVersus) {
         [skipBtn, surgeBtn, freezeBtn].forEach((btn) => {
           if (!btn) return;
           btn.disabled = true;
           btn.classList.add('opacity-40', 'cursor-not-allowed');
         });
       }
     }
   
     private handleSubmission(input: string) {
      if (!this.isActive || !input.trim()) return;
    
      const result = this.typingEngine.processInput(input);
      const timeElapsed = Date.now() - this.currentWordStartTime;
    
      let shouldClearInput = true;
    
      switch (result.type) {
        case 'command':
          this.handleCommand(result.content);
          break;
    
        case 'word': {
          // 🔹 returns true if the word was actually correct
          const wasCorrect = this.handleWordSubmission(result, timeElapsed);
          shouldClearInput = wasCorrect;
          break;
        }
    
        default:
          this.showMessage('Invalid input. Try again.', 2000);
          break;
      }
    
      if (shouldClearInput && this.inputField) {
        this.inputField.value = '';
      }
    }
    
   
     private handleCommand(command: string) {
       switch (command) {
         case 'hint':
           this.useHint();
           break;
         case 'skip':
           if (!this.isVersus) {
             this.useSkip();
           } else {
             this.showMessage('Skip is not available in Versus yet.', 2000);
           }
           break;
         case 'surge':
           if (this.isVersus) {
             this.showMessage('This power-up is not available in Versus.', 2000);
           } else {
             this.useSurge();
           }
           break;
         case 'freeze':
           if (this.isVersus) {
             this.showMessage('This power-up is not available in Versus.', 2000);
           } else {
             this.useFreeze();
           }
           break;
         case 'clean':
           this.useClean();
           break;
         case 'undo':
           this.useUndo();
           break;
       }
     }
   
     private handleWordSubmission(result: TypingResult, timeElapsed: number): boolean {
      const currentIndex = this.wordChain.currentIndex;
    
      if (
        currentIndex < 0 ||
        !this.wordChain.words ||
        currentIndex >= this.wordChain.words.length
      ) {
        console.warn(
          '[WORDCHAIN] submission with out-of-range index',
          currentIndex,
          this.wordChain.words?.length
        );
        return false;
      }
    
      const targetWord = this.wordChain.words[currentIndex];
    
      if (this.trapSystem.isLocked(currentIndex) && !this.isVersus) {
        this.showMessage('Locked—continue forward', 1500);
        this.triggerHaptic('error');
        return false;
      }
    
      if (
        result.isCorrect ||
        targetWord.toLowerCase() === result.content.toLowerCase()
      ) {
        this.handleCorrectWord(timeElapsed, result.suggestion);
        this.lastInput = result.content;
        this.lastInputTime = Date.now();
        return true; // 🔹 correct
      } else {
        this.handleIncorrectWord(result.content);
        this.lastInput = result.content;
        this.lastInputTime = Date.now();
        return false; // 🔹 incorrect → don't clear input
      }
    }
    
   
     private handleCorrectWord(timeElapsed: number, suggestion?: string) {
       const currentIndex = this.wordChain.currentIndex;
       const solvedWord = this.wordChain.words[currentIndex]?.toLowerCase() ?? '';
   
       // If we somehow process the *same* index + word twice in a row, just push forward
       if (
         this.lastCorrectIndex === currentIndex &&
         this.lastCorrectWord === solvedWord
       ) {
         this.wordChain.currentIndex++;
   
         if (this.isLevelComplete()) {
           this.completeLevel();
         } else {
           this.startNextWord();
         }
   
         this.updateDisplay();
         return;
       }
   
       // Record latest real solve
       this.lastCorrectIndex = currentIndex;
       this.lastCorrectWord = solvedWord;
   
       // Versus: award a solve to current player
       if (this.isVersus) {
         this.playerScores[this.playerTurn] += 1;
       }
   
       // Record submission
       this.scoreManager.addSubmission(
         this.wordChain.words[currentIndex],
         true,
         timeElapsed,
         this.hintsUsedThisWord
       );
   
       // Mark as completed
       this.wordChain.completedIndices.add(currentIndex);
       this.wordChain.currentIndex++;
   
       // Traps/bonuses
       this.checkForTraps();
       this.checkForBonuses(timeElapsed);
   
       // Feedback
       this.triggerHaptic('success');
       if (suggestion) {
         this.showMessage(`Correct! (Auto-corrected to "${suggestion}")`, 1500);
       } else {
         this.showMessage('Correct!', 1000);
       }
   
       // Completion
       if (this.isLevelComplete()) {
         this.completeLevel();
       } else {
         this.startNextWord();
       }
   
       this.updateDisplay();
   
       // Versus: end this player's turn and hand off
       if (this.isVersus && !this.versusMatchOver) {
         this.isVersusTurnActive = false;
         this.playerTurn = this.playerTurn === 0 ? 1 : 0;
         this.updateVersusScoresAndTurn();
         this.updateActiveHeart();
         this.updateVersusHintLabel();
         this.showVersusTurnOverlay();
       }
     }
   
     private handleIncorrectWord(word: string) {
      // 🔹 Shake + temporary red border on the input
      if (this.inputField) {
        this.inputField.classList.remove('wrong');
        // force reflow so animation restarts
        void this.inputField.offsetWidth;
        this.inputField.classList.add('wrong');
    
        // 🔹 Remove the red border 1 second after the animation starts
        this.time.delayedCall(1000, () => {
          this.inputField.classList.remove('wrong');
        });
      }
    
      this.wordChain.wrongCount++;
      this.scoreManager.addSubmission(
        word,
        false,
        Date.now() - this.currentWordStartTime
      );
    
      this.triggerHaptic('error');
      this.showMessage(`"${word}" is not correct. Try again!`, 2000);
    
      // 🔹 Story mode: restore the hinted prefix in the input after a wrong guess
      if (!this.isVersus && this.hintsUsedThisWord > 0) {
        const idx = this.wordChain.currentIndex;
        if (idx >= 0 && idx < this.wordChain.words.length && this.inputField) {
          const targetWord = this.wordChain.words[idx];
          this.inputField.value = targetWord.substring(0, this.hintsUsedThisWord);
          this.inputField.focus();
        }
      }
    
      if (!this.isVersus && this.wordChain.wrongCount >= 4) {
        this.failLevel();
        return;
      }
    
      this.gameData.addAggregateWrong();
      this.updateDisplay();
    }
    
   
     private checkForTraps() {
       if (this.isVersus) return;
   
       const currentIndex = this.wordChain.currentIndex;
       const level = this.puzzle.level;
   
       if (
         this.trapSystem.shouldTriggerLockdown(
           currentIndex,
           this.wordChain.words.length,
           level
         )
       ) {
         const lockCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
         if (
           this.trapSystem.triggerLockdown(
             this.wordChain.words,
             currentIndex,
             lockCount
           )
         ) {
           this.showMessage(
             `LOCKDOWN! ${lockCount} words ahead are locked!`,
             3000
           );
         }
       }
   
       const targetWord = this.wordChain.words[currentIndex + 1];
       const hasDecoyData =
         this.puzzle.decoy_candidates &&
         this.puzzle.decoy_candidates[targetWord];
       if (
         hasDecoyData &&
         this.trapSystem.shouldTriggerDecoy(currentIndex, true)
       ) {
         this.trapSystem.triggerDecoy(
           targetWord,
           this.puzzle.decoy_candidates![targetWord]
         );
         this.showMessage(
           'DECOY TRAP! Use "!clean" to disable auto-complete.',
           3000
         );
       }
   
       if (
         this.trapSystem.shouldTriggerVoidBreak(
           this.scoreManager.getCurrentStreak()
         )
       ) {
         this.trapSystem.triggerVoidBreak();
         this.scoreManager.triggerVoidBreak();
         this.showMessage('VOID BREAK! Streak reset!', 2000);
       }
     }
   
     private checkForBonuses(timeElapsed: number) {
       // No bonuses / auto-solve logic in Versus mode
       if (this.isVersus) return;
   
       // Speed combo check
       if (this.scoreManager.isSpeedComboActive()) {
         this.showMessage('SPEED COMBO! 1.5x multiplier active!', 2000);
       }
   
       // Chain reaction check (5 correct with avg ≤8s)
       const recentSubmissions = this.scoreManager['submissions'].slice(-5);
       if (
         recentSubmissions.length === 5 &&
         recentSubmissions.every((s) => s.correct)
       ) {
         const avgTime =
           recentSubmissions.reduce((sum, s) => sum + s.timeMs, 0) / 5;
         if (avgTime <= 8000) {
           this.showMessage('CHAIN REACTION! Next 2 words auto-solved!', 3000);
           this.autoSolveNext(2);
         }
       }
   
       // Precision streak check
       if (this.scoreManager.getPrecisionStreak() === 10) {
         this.showMessage('PRECISION STREAK! +500 bonus points!', 2000);
       }
     }
   
     private autoSolveNext(count: number) {
       // Never auto-solve in Versus, even if something calls this
       if (this.isVersus) return;
   
       let solved = 0;
       let index = this.wordChain.currentIndex;
   
       while (solved < count && index < this.wordChain.words.length) {
         if (!this.trapSystem.isLocked(index)) {
           this.wordChain.completedIndices.add(index);
           solved++;
           this.showLightningEffect();
         }
         index++;
       }
   
       this.wordChain.currentIndex = index;
       this.updateDisplay();
     }
   
     private showLightningEffect() {
       const effect = this.add.text(
         this.scale.gameSize.width / 2,
         this.scale.gameSize.height / 2,
         '⚡',
         { fontSize: '48px' }
       );
       effect.setOrigin(0.5);
   
       this.tweens.add({
         targets: effect,
         scaleX: 2,
         scaleY: 2,
         alpha: 0,
         duration: 1000,
         onComplete: () => effect.destroy(),
       });
     }
   
     private isLevelComplete(): boolean {
       let requiredCompletions = this.puzzle.base_length;
   
       const lockedCount = this.isVersus
         ? 0
         : this.trapSystem.getLockedIndices().length;
       requiredCompletions += lockedCount;
   
       return this.wordChain.completedIndices.size >= requiredCompletions;
     }
   
     private startNextWord() {
       while (
         this.wordChain.currentIndex < this.wordChain.words.length &&
         this.trapSystem.isLocked(this.wordChain.currentIndex) &&
         !this.isVersus
       ) {
         this.wordChain.currentIndex++;
       }
   
       this.startCurrentWord();
     }
   
     private startCurrentWord() {
       this.currentWordStartTime = Date.now();
       this.hintsUsedThisWord = 0;
       this.undoAvailable = true;
   
       if (this.wordChain.currentIndex < this.wordChain.words.length) {
         const targetWord = this.wordChain.words[this.wordChain.currentIndex];
         this.typingEngine.setTarget(targetWord);
       }
   
       this.updateDisplay();
     }
   
     // Power-ups
     private useHint() {
      const currentIndex = this.wordChain.currentIndex;
      if (currentIndex >= this.wordChain.words.length) return;
    
      const targetWord = this.wordChain.words[currentIndex];
    
      // 🔹 VERSUS MODE: per-player hints, letters revealed in the word box
      if (this.isVersus) {
        const idx = this.playerTurn;
    
        if (this.playerHintTokens[idx] <= 0) {
          this.showMessage('No hints remaining for your side!', 2000);
          return;
        }
    
        const maxLetters = targetWord.length;
        // what is currently *allowed* to be visible: first letter + hints used so far
        const currentlyVisible = 1 + this.hintsUsedThisWord;
    
        if (currentlyVisible >= maxLetters) {
          // nothing more to reveal; don't consume a token
          this.showMessage('No more letters to reveal.', 2000);
          return;
        }
    
        // consume one hint and increase visible letters by 1
        this.playerHintTokens[idx]--;
        this.hintsUsedThisWord++;
    
        const revealCount = 1 + this.hintsUsedThisWord; // first letter + hints
        const completed = this.wordChain.completedIndices;
        const starterOnlyCompleted =
          completed.size === 0 || (completed.size === 1 && completed.has(0));
    
        const masked = this.maskWordWithReveals(targetWord, revealCount);
    
        // At very beginning of the chain in Versus:
        //  - starter word (words[0]) is in the middle
        //  - the *first guess* (currentIndex=1) is in the bottom slot
        if (starterOnlyCompleted && this.wordNextEl) {
          this.wordNextEl.textContent = masked;
        } else if (this.wordCurrentEl) {
          // After that, the active word is the middle line
          this.wordCurrentEl.textContent = masked;
        }
    
        // update button label for that player
        this.updateVersusHintLabel();
        return;
      }
    
      // 🔹 STORY MODE: original behavior (message + input autofill)
      if (this.hintTokens <= 0) {
        this.showMessage('No hint tokens remaining!', 2000);
        return;
      }
    
      const revealed = this.hintsUsedThisWord;
    
      if (revealed < targetWord.length) {
        this.hintTokens--;
        this.hintsUsedThisWord++;
    
        const nextLetter = targetWord[revealed];
        this.showMessage(`Next letter: "${nextLetter}"`, 3000);
    
        this.inputField.value = targetWord.substring(0, revealed + 1);
        this.inputField.focus();
      }
    
      this.updateDisplay();
    }
    
   
     private useSkip() {
       if (this.isVersus) {
         this.showMessage('Skip is not available in Versus yet.', 2000);
         return;
       }
   
       if (this.skipTokens <= 0) {
         this.showMessage('No skip tokens remaining!', 2000);
         return;
       }
   
       const currentIndex = this.wordChain.currentIndex;
       if (this.trapSystem.isLocked(currentIndex)) {
         this.showMessage('Cannot skip locked words!', 2000);
         return;
       }
   
       this.skipTokens--;
       this.scoreManager.addSkip();
   
       this.wordChain.completedIndices.add(currentIndex);
       this.wordChain.currentIndex++;
   
       this.showMessage('Word skipped!', 1500);
   
       if (this.isLevelComplete()) {
         this.completeLevel();
       } else {
         this.startNextWord();
       }
   
       this.updateDisplay();
     }
   
     private useSurge() {
       if (this.isVersus) {
         this.showMessage('Surge is not available in Versus.', 2000);
         return;
       }
   
       if (this.surgeTokens <= 0) {
         this.showMessage('No surge tokens remaining!', 2000);
         return;
       }
   
       this.surgeTokens--;
       this.autoSolveNext(3);
       this.showMessage('SURGE! Next 3 words auto-solved!', 2000);
   
       if (this.isLevelComplete()) {
         this.completeLevel();
       } else {
         this.startNextWord();
       }
     }
   
     private useFreeze() {
       if (this.isVersus) {
         this.showMessage('Freeze is not available in Versus.', 2000);
         return;
       }
   
       if (this.freezeTokens <= 0 || this.timeLimit === 0) {
         this.showMessage('Freeze not available!', 2000);
         return;
       }
   
       this.freezeTokens--;
       this.timeRemaining += 10000;
       this.showMessage('TIME FREEZE! +10 seconds added!', 2000);
       this.updateDisplay();
     }
   
     private useClean() {
       if (!this.trapSystem.isDecoyActive()) {
         this.showMessage('No decoy trap active!', 2000);
         return;
       }
   
       this.trapSystem.cleanDecoy();
       this.showMessage('Decoy trap cleaned! Auto-complete restored.', 2000);
     }
   
     private useUndo() {
       if (!this.undoAvailable || Date.now() - this.lastInputTime > 2000) {
         this.showMessage('Undo not available!', 2000);
         return;
       }
   
       this.undoAvailable = false;
       this.inputField.value = this.lastInput;
       this.showMessage('Last input restored!', 1500);
     }
   
     // Story completion/failure
     private completeLevel() {
       // Versus: treat chain completion as match end
       if (this.isVersus) {
         if (this.versusMatchOver) return;
         this.versusMatchOver = true;
         this.isActive = false;
         this.isVersusTurnActive = false;
   
         const p1 = this.playerScores[0];
         const p2 = this.playerScores[1];
   
         let message: string;
         if (p1 > p2) {
           message = `Chain complete!\nPlayer 1 wins ${p1} to ${p2}.`;
         } else if (p2 > p1) {
           message = `Chain complete!\nPlayer 2 wins ${p2} to ${p1}.`;
         } else {
           message = `Chain complete!\nIt's a tie: ${p1} to ${p2}.`;
         }
   
         this.showEndOfMatchPopup(message, () => {
           this.scene.start('TitleScreen');
         });
         return;
       }
   
       this.isActive = false;
   
       const solvedLocked = this.trapSystem.autoSolveLockedWords(
         this.wordChain.words
       );
       if (solvedLocked.length > 0) {
         this.showMessage(
           `Auto-solved locked words: ${solvedLocked.join(', ')}`,
           3000
         );
       }
   
       const scoreBreakdown = this.scoreManager.calculateScore();
   
       const currentLand = this.gameData.getLand();
       const currentLevel = this.gameData.getLevel();
       const nextLevel = currentLevel + 1;
       const nextLand = nextLevel > 25 ? currentLand + 1 : currentLand;
   
       if (nextLevel > 25) {
         this.gameData.nextLand();
       } else {
         this.gameData.setProgress(currentLand, nextLevel);
       }
   
       this.scene.pause();
       this.scene.launch('LevelCompleteUIScene', {
         scoreBreakdown,
         currentLand,
         currentLevel,
         nextLand: nextLevel > 25 ? nextLand : currentLand,
         nextLevel: nextLevel > 25 ? 1 : nextLevel,
         mode: this.gameModeManager.getCurrentMode(),
       });
     }
   
     private failLevel() {
       this.isActive = false;
       this.gameData.loseLife();
   
       const livesRemaining = this.gameData.getLives();
   
       if (livesRemaining <= 0) {
         this.gameData.enterPenaltyBox();
         this.scene.start('PenaltyBoxScene');
       } else {
         this.scene.pause();
         this.scene.launch('GameOverUIScene', {
           reason: 'too_many_wrong',
           livesRemaining,
           mode: this.gameModeManager.getCurrentMode(),
         });
       }
     }
   
     // Story timer
     private startTimer() {
       this.time.addEvent({
         delay: 100,
         callback: this.updateTimer,
         callbackScope: this,
         loop: true,
       });
     }
   
     private updateTimer() {
       if (!this.isActive || this.timeLimit === 0) return;
   
       this.timeRemaining -= 100;
   
       if (this.timeRemaining <= 0) {
         this.timeRemaining = 0;
         this.failLevel();
       }
   
       this.updateTimerDisplay();
     }
   
     private updateTimerDisplay() {
       const timerElement = this.uiContainer.getChildByID(
         'timer'
       ) as HTMLElement;
       if (timerElement && this.timeLimit > 0) {
         const seconds = Math.ceil(this.timeRemaining / 1000);
         timerElement.textContent = `⏱️ ${seconds}s`;
         timerElement.classList.remove('hidden');
   
         if (seconds <= 30) {
           timerElement.classList.add('text-red-400');
         }
       }
     }
   
     // Display updates
     private updateDisplay() {
       // answer key is visually hidden, but we keep logic safe
       this.updateChainProgress();
       this.updateStats();
       this.updateCurrentWord();
     }
   
     private updateChainProgress() {
       if (!this.chainProgress) return;
       // visually disabled – leave innerHTML empty
       this.chainProgress.innerHTML = '';
     }
   
     private updateStats() {
       if (this.isVersus) return;
   
       const livesElement = this.uiContainer.getChildByID(
         'lives-count'
       ) as HTMLElement;
       const streakElement = this.uiContainer.getChildByID(
         'streak-count'
       ) as HTMLElement;
       const scoreElement = this.uiContainer.getChildByID(
         'score-count'
       ) as HTMLElement;
   
       if (livesElement)
         livesElement.textContent = this.gameData.getLives().toString();
       if (streakElement)
         streakElement.textContent = this.scoreManager
           .getCurrentStreak()
           .toString();
       if (scoreElement) {
         const score = this.scoreManager.calculateScore();
         scoreElement.textContent = score.finalScore.toString();
       }
     }
   
     // Unified Word Box (with special case for starting word in Versus)
     private updateCurrentWord() {
       const idx = this.wordChain.currentIndex;
       const words = this.wordChain.words;
   
       // === VERSUS MODE ==========================================
       if (this.isVersus) {
         if (!this.wordPrevEl || !this.wordCurrentEl || !this.wordNextEl) return;
         if (!words || words.length === 0) {
           this.wordPrevEl.textContent = '';
           this.wordCurrentEl.textContent = '';
           this.wordNextEl.textContent = '';
           return;
         }
   
         const completed = this.wordChain.completedIndices;
         const starterOnlyCompleted =
           completed.size === 0 || (completed.size === 1 && completed.has(0));
   
         if (starterOnlyCompleted) {
           // FIRST VIEW:
           //  - Big middle line = full starter word (no blanks)
           //  - Bottom line = first guess masked
           this.wordPrevEl.textContent = '';
           this.wordCurrentEl.textContent = words[0] ?? '';
   
           if (words.length > 1) {
             this.wordNextEl.textContent = this.maskWordFirstLetter(words[1]);
           } else {
             this.wordNextEl.textContent = '';
           }
   
           return;
         }
   
         // Normal turns after we’ve moved past the starter
         const safeIdx = Math.min(Math.max(idx, 1), words.length - 1);
   
         // Top line: last solved word (starter or later)
         this.wordPrevEl.textContent = words[safeIdx - 1] ?? '';
   
         // Middle: current target, masked (first letter + blanks)
         this.wordCurrentEl.textContent = this.maskWordFirstLetter(words[safeIdx]);
   
         // Bottom: next target masked, if any
         if (safeIdx + 1 < words.length) {
           this.wordNextEl.textContent = this.maskWordFirstLetter(
             words[safeIdx + 1]
           );
         } else {
           this.wordNextEl.textContent = '';
         }
   
         return;
       }
   
       // === STORY MODE ===========================================
       if (!this.wordCurrentEl) return;
   
       // For story, keep legacy behavior:
       //  Big middle line shows "previous word" as you move forward.
       //  We ignore prev/next lines for now (they can be used later if desired).
       if (idx > 0 && idx <= words.length) {
         const previousWord = words[idx - 1];
         this.wordCurrentEl.textContent = previousWord;
       } else if (idx === 0) {
         this.wordCurrentEl.textContent = 'START';
       } else {
         this.wordCurrentEl.textContent = 'COMPLETE';
       }
   
       if (this.wordPrevEl) this.wordPrevEl.textContent = '';
       if (this.wordNextEl) this.wordNextEl.textContent = '';
     }
   
     private maskWordFirstLetter(word: string): string {
       if (!word || word.length === 0) return '';
       if (word.length === 1) return word.toUpperCase();
   
       const first = word[0].toUpperCase();
       const rest = word
         .slice(1)
         .split('')
         .map(() => '_')
         .join(' ');
   
       return `${first} ${rest}`;
     }

     private maskWordWithReveals(word: string, revealCount: number): string {
      if (!word) return '';
    
      const upper = word.toUpperCase();
      const clamped = Math.max(1, Math.min(upper.length, revealCount));
    
      const chars = upper.split('').map((ch, i) => (i < clamped ? ch : '_'));
      return chars.join(' ');
    }
    
   
     private showMessage(text: string, duration: number = 3000) {
       if (!this.messageDisplay) return;
   
       this.messageDisplay.textContent = text;
       this.messageDisplay.classList.remove('hidden');
   
       this.time.delayedCall(duration, () => {
         this.messageDisplay.classList.add('hidden');
       });
     }
   
     private triggerHaptic(type: 'success' | 'error' | 'streak') {
       if ('vibrate' in navigator) {
         switch (type) {
           case 'success':
             navigator.vibrate(50);
             break;
           case 'error':
             navigator.vibrate([100, 50, 100]);
             break;
           case 'streak':
             navigator.vibrate(200);
             break;
         }
       }
     }
   
     private onTrapTriggered(type: string, data?: any) {
       console.log(`Trap triggered: ${type}`, data);
   
       if (this.isVersus) {
         return;
       }
   
       switch (type) {
         case 'lockdown':
           this.updateDisplay();
           break;
         case 'decoy':
           if (data && Array.isArray(data.decoyWords)) {
             this.showDecoySuggestions(data.decoyWords);
           }
           break;
         case 'voidBreak':
           this.updateDisplay();
           break;
       }
     }
   
     private showDecoySuggestions(decoyWords: string[]) {
       const suggestionsElement = this.uiContainer.getChildByID(
         'input-suggestions'
       ) as HTMLElement;
   
       if (suggestionsElement) {
         suggestionsElement.textContent = `Suggestions: ${decoyWords.join(', ')}`;
         suggestionsElement.classList.remove('hidden');
       }
     }
   
     // ========= Versus UI =========
   
     private setupVersusUI() {
       if (this.statsDisplay) {
         this.statsDisplay.innerHTML = `
           <div>
             P1 ⏱️ <span id="p1-time-label">02:00</span>
             <span id="p1-heart" style="margin-left:4px;color:#f97373;">♥</span>
           </div>
           <div>
             P2 ⏱️ <span id="p2-time-label">02:00</span>
             <span id="p2-heart" style="margin-left:4px;color:#f97373;"></span>
           </div>
           <div></div>
           <div>Mode: <span id="mode-display">versus</span></div>
         `;
       }
   
       this.p1TimeEl = this.statsDisplay?.querySelector(
         '#p1-time-label'
       ) as HTMLElement | undefined;
       this.p2TimeEl = this.statsDisplay?.querySelector(
         '#p2-time-label'
       ) as HTMLElement | undefined;
       this.p1HeartEl = this.statsDisplay?.querySelector(
         '#p1-heart'
       ) as HTMLElement | undefined;
       this.p2HeartEl = this.statsDisplay?.querySelector(
         '#p2-heart'
       ) as HTMLElement | undefined;
   
       this.updateActiveHeart();
   
       const hintBtn = this.uiContainer.getChildByID('hint-btn') as
         | HTMLButtonElement
         | null;
       const skipBtn = this.uiContainer.getChildByID('skip-btn') as
         | HTMLButtonElement
         | null;
       const surgeBtn = this.uiContainer.getChildByID('surge-btn') as
         | HTMLButtonElement
         | null;
       const freezeBtn = this.uiContainer.getChildByID('freeze-btn') as
         | HTMLButtonElement
         | null;
   
       if (hintBtn) {
         hintBtn.textContent = `💡 Hint (${this.playerHintTokens[this.playerTurn]})`;
       }
   
       [skipBtn, surgeBtn, freezeBtn].forEach((btn) => {
         if (!btn) return;
         btn.disabled = true;
         btn.classList.add('opacity-40', 'cursor-not-allowed');
       });
     }
   
     private updateVersusScoresAndTurn() {
       this.updateActiveHeart();
     }
   
     private updateActiveHeart() {
       if (!this.isVersus) return;
   
       if (this.p1HeartEl) {
         this.p1HeartEl.textContent = this.playerTurn === 0 ? '♥' : '';
       }
       if (this.p2HeartEl) {
         this.p2HeartEl.textContent = this.playerTurn === 1 ? '♥' : '';
       }
     }
   
     private showVersusTurnOverlay() {
       if (!this.isVersus || this.versusMatchOver) return;
   
       const remaining = this.playerTimes[this.playerTurn];
       const mm = Math.floor(remaining / 60)
         .toString()
         .padStart(2, '0');
       const ss = Math.floor(remaining % 60)
         .toString()
         .padStart(2, '0');
       const timeLabel = `${mm}:${ss}`;
   
       const overlay = document.createElement('div');
       overlay.id = 'versus-turn-overlay';
       overlay.style.position = 'fixed';
       overlay.style.top = '0';
       overlay.style.left = '0';
       overlay.style.width = '100%';
       overlay.style.height = '100%';
       overlay.style.background = 'rgba(0,0,0,0.8)';
       overlay.style.display = 'flex';
       overlay.style.flexDirection = 'column';
       overlay.style.alignItems = 'center';
       overlay.style.justifyContent = 'center';
       overlay.style.color = 'white';
       overlay.style.zIndex = '9999';
   
       overlay.innerHTML = `
         <div id="versus-overlay-text" style="font-size:24px;margin-bottom:20px;">
           Player ${this.playerTurn + 1}, ready?
         </div>
         <button id="versus-ready-btn"
                 style="padding:12px 24px;background:#4ade80;color:black;
                        font-size:18px;border-radius:8px;">
           Ready
         </button>
         <div style="margin-top:12px;font-size:12px;opacity:0.8;">
           Your remaining ${timeLabel} starts when you tap Ready.
         </div>
       `;
   
       document.body.appendChild(overlay);
       this.turnOverlayEl = overlay;
       this.readyButtonEl = overlay.querySelector(
         '#versus-ready-btn'
       ) as HTMLElement;
   
       this.readyButtonEl.addEventListener('click', () => {
         this.startVersusTurn();
       });
     }
   
     private startVersusTurn() {
       if (!this.isVersus || this.versusMatchOver) return;
   
       if (this.turnOverlayEl) {
         this.turnOverlayEl.remove();
         this.turnOverlayEl = undefined;
         this.readyButtonEl = undefined;
       }
   
       this.isVersusTurnActive = true;
       this.versusLastRealTime = Date.now();
   
       if (this.inputField) {
         this.inputField.value = '';
         this.inputField.focus();
       }
   
       if (!this.versusTimerEvent) {
         this.versusTimerEvent = this.time.addEvent({
           delay: 1000,
           loop: true,
           callback: this.tickVersusTimer,
           callbackScope: this,
         });
       }
     }
   
     private tickVersusTimer() {
       if (!this.isVersus || !this.isVersusTurnActive || this.versusMatchOver) {
         return;
       }
   
       const now = Date.now();
       const elapsedSec = (now - this.versusLastRealTime) / 1000;
       this.versusLastRealTime = now;
   
       const idx = this.playerTurn;
       this.playerTimes[idx] = Math.max(0, this.playerTimes[idx] - elapsedSec);
   
       const t = Math.max(0, Math.floor(this.playerTimes[idx]));
       const mm = Math.floor(t / 60)
         .toString()
         .padStart(2, '0');
       const ss = (t % 60).toString().padStart(2, '0');
       const label = `${mm}:${ss}`;
   
       if (idx === 0 && this.p1TimeEl) {
         this.p1TimeEl.textContent = label;
       } else if (idx === 1 && this.p2TimeEl) {
         this.p2TimeEl.textContent = label;
       }
   
       if (this.playerTimes[idx] <= 0) {
         this.handleVersusTimeout(idx as 0 | 1);
       }
     }
   
     private handleVersusTimeout(loserIndex: 0 | 1) {
       if (this.versusMatchOver) return;
       this.versusMatchOver = true;
       this.isActive = false;
       this.isVersusTurnActive = false;
   
       const winnerIndex: 0 | 1 = loserIndex === 0 ? 1 : 0;
       const winnerSolves = this.playerScores[winnerIndex];
   
       const message =
         `Player ${loserIndex + 1} ran out of time.\n` +
         `Player ${winnerIndex + 1} wins with ${winnerSolves} solves!`;
   
       this.showEndOfMatchPopup(message, () => {
         this.scene.start('TitleScreen');
       });
     }
   
     // ========= In-game popup (replaces alert) =========
     private showEndOfMatchPopup(message: string, onOk?: () => void) {
       const existing = document.getElementById('wc-end-popup-backdrop');
       if (existing) existing.remove();
   
       const backdrop = document.createElement('div');
       backdrop.id = 'wc-end-popup-backdrop';
   
       const card = document.createElement('div');
       card.id = 'wc-end-popup-card';
   
       const title = document.createElement('h2');
       title.textContent = 'Match Result';
   
       const msg = document.createElement('div');
       msg.id = 'wc-end-popup-message';
       msg.textContent = message;
   
       const okBtn = document.createElement('button');
       okBtn.id = 'wc-end-popup-ok';
       okBtn.textContent = 'OK';
   
       okBtn.addEventListener('click', () => {
         backdrop.remove();
         if (onOk) onOk();
       });
   
       card.appendChild(title);
       card.appendChild(msg);
       card.appendChild(okBtn);
       backdrop.appendChild(card);
       document.body.appendChild(backdrop);
     }
   
     update(time: number, delta: number) {
       // Reserved for animations / effects
     }
   }
   