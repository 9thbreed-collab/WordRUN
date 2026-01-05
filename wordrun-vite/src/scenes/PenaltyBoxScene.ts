/* =========================================================
   FILE: src/scenes/PenaltyBoxScene.ts
   PURPOSE: Penalty Box with escalated wait tiers & purchase options
   ========================================================= */
import Phaser from 'phaser';
import { GameDataManager } from '../GameDataManager';
import * as utils from '../utils';

export class PenaltyBoxScene extends Phaser.Scene {
  private gdm!: GameDataManager;
  private timer?: number;
  private uiContainer!: Phaser.GameObjects.DOMElement;

  constructor() { 
    super('PenaltyBoxScene'); 
  }

  create() {
    this.gdm = GameDataManager.getInstance();
    
    // DEV: Check if penalty should be bypassed
    if (!this.gdm.isInPenaltyBox()) {
      console.log('DEV: Bypassing penalty box - returning to title');
      this.scene.start('TitleScreen');
      return;
    }
    
    this.createUI();
    this.setupEventListeners();
    this.startTimer();
  }

  private createUI() {
    const html = `
      <div class="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-red-900 to-purple-900 text-white font-mono"
           style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; touch-action: manipulation;">
        
        <!-- Penalty Box Container -->
        <div class="flex flex-col items-center justify-center h-full px-4">
          
          <!-- Title -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold mb-2 text-red-400">
              ⚠️ Penalty Box
            </h1>
            <div class="text-lg text-red-200">
              Out of Lives - Wait or Get More
            </div>
          </div>

          <!-- Timer Display -->
          <div class="game-3d-container-[#4a1a1a] p-6 mb-8 w-full max-w-sm text-center">
            <div class="text-red-300 mb-2">Time Remaining</div>
            <div id="time-remaining" class="text-3xl font-bold text-yellow-400">
              Loading...
            </div>
            <div class="text-xs text-red-400 mt-2">
              Wait times escalate: 15m → 60m → 4h → 16h
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3 w-full max-w-sm">
            <button id="watch-ad-btn" 
                    class="game-3d-container-clickable-green-600 w-full py-4 text-lg font-bold"
                    role="button" 
                    tabindex="0">
              📺 Watch Ad (+1 Life)
            </button>
            
            <button id="buy-refill-btn" 
                    class="game-3d-container-clickable-blue-600 w-full py-4 text-lg font-bold"
                    role="button" 
                    tabindex="0">
              💎 Buy Life Refill
            </button>
            
            <button id="buy-capacity-btn" 
                    class="game-3d-container-clickable-purple-600 w-full py-4 text-lg font-bold"
                    role="button" 
                    tabindex="0">
              ⚡ Buy Capacity Boost
            </button>
          </div>

          <!-- Info -->
          <div class="mt-6 text-center text-sm text-red-300 max-w-sm">
            <div class="mb-2">Current Lives: <span class="text-red-400 font-bold">❤️ ${this.gdm.getLives()}</span></div>
            <div class="text-xs text-gray-400">
              Purchase options will restore your lives and let you continue playing immediately.
            </div>
          </div>
        </div>
      </div>
    `;

    this.uiContainer = utils.initUIDom(this, html);
  }

  private setupEventListeners() {
    const root = this.uiContainer.node as HTMLElement;

    // Watch Ad button
    root.querySelector('#watch-ad-btn')?.addEventListener('click', () => {
      this.watchAd();
    });

    // Buy Refill button  
    root.querySelector('#buy-refill-btn')?.addEventListener('click', () => {
      this.buyRefill();
    });

    // Buy Capacity button
    root.querySelector('#buy-capacity-btn')?.addEventListener('click', () => {
      this.buyCapacity();
    });
  }

  private startTimer() {
    const timeDisplay = this.uiContainer.node?.querySelector('#time-remaining') as HTMLElement;
    
    this.timer = window.setInterval(() => {
      const end = this.gdm.getPenaltyBoxEnd() ?? Date.now();
      const remain = Math.max(0, end - Date.now());
      
      if (remain <= 0) {
        timeDisplay.textContent = 'Ready!';
        window.clearInterval(this.timer);
        this.gdm.exitPenaltyBox();
        this.scene.start('TitleScreen');
        return;
      }

      // Format remaining time
      const hours = Math.floor(remain / (1000 * 60 * 60));
      const minutes = Math.floor((remain % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remain % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        timeDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeDisplay.textContent = `${minutes}m ${seconds}s`;
      } else {
        timeDisplay.textContent = `${seconds}s`;
      }
    }, 1000);
  }

  private watchAd() {
    // Simulate ad watching (in production, integrate with ad provider)
    this.showMessage('Watching ad... Please wait!', 2000);
    
    this.time.delayedCall(2000, () => {
      // Grant +1 life (or full refill for simplicity)
      this.gdm.refillLives();
      this.gdm.exitPenaltyBox();
      this.showMessage('Lives restored! Returning to menu...', 1000);
      
      this.time.delayedCall(1000, () => {
        this.scene.start('TitleScreen');
      });
    });
  }

  private buyRefill() {
    // Simulate purchase (in production, integrate with payment provider)
    this.showMessage('Processing purchase...', 1500);
    
    this.time.delayedCall(1500, () => {
      this.gdm.refillLives();
      this.gdm.exitPenaltyBox();
      this.showMessage('Lives refilled! Returning to menu...', 1000);
      
      this.time.delayedCall(1000, () => {
        this.scene.start('TitleScreen');
      });
    });
  }

  private buyCapacity() {
    // Simulate capacity boost purchase
    this.showMessage('Processing purchase...', 1500);
    
    this.time.delayedCall(1500, () => {
      // Apply capacity boost entitlement (not persisted in this demo)
      this.gdm.refillLives();
      this.gdm.exitPenaltyBox();
      this.showMessage('Capacity boosted! Returning to menu...', 1000);
      
      this.time.delayedCall(1000, () => {
        this.scene.start('TitleScreen');
      });
    });
  }

  private showMessage(text: string, duration: number) {
    const root = this.uiContainer.node as HTMLElement;
    
    // Create temporary message overlay
    const messageEl = document.createElement('div');
    messageEl.className = 'fixed top-1/2 left-4 right-4 text-center text-lg bg-black bg-opacity-75 p-4 rounded transform -translate-y-1/2 text-yellow-400 font-bold';
    messageEl.textContent = text;
    
    root.appendChild(messageEl);
    
    this.time.delayedCall(duration, () => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    });
  }

  shutdown() {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }
}