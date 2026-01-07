/* =================================================================
   FILE: src/scenes/LevelCompleteUIScene.ts
   PURPOSE: Level completion celebration and progression UI
   ================================================================= */

import Phaser from 'phaser';
import type { ScoreBreakdown } from '../ScoreManager';
import { AdManager } from '../AdManager';
import type { GameMode } from '../GameModes';
import { goToNextLevel } from '../services/Router';
import * as utils from '../utils';

interface LevelCompleteData {
  scoreBreakdown: ScoreBreakdown;
  currentLand: number;
  currentLevel: number;
  nextLand: number;
  nextLevel: number;
  mode: GameMode;
}

export class LevelCompleteUIScene extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.DOMElement;
  private adManager!: AdManager;
  private levelData!: LevelCompleteData;

  constructor() {
    super({ key: 'LevelCompleteUIScene' });
  }

  init(data: LevelCompleteData) {
    this.levelData = data;
    this.adManager = AdManager.getInstance();
  }

  create() {
    this.createUI();
    this.setupEventListeners();
    this.showCelebration();
    this.requestInterstitialAd();
  }

  private createUI() {
    const score = this.levelData.scoreBreakdown;
    const isNewLand = this.levelData.nextLevel === 1 && this.levelData.nextLand > this.levelData.currentLand;
    
    const uiHTML = `
      <div class="fixed inset-0 bg-gradient-to-br from-green-600 to-emerald-800 text-white font-mono flex items-center justify-center">
        <!-- Celebration Particles Background -->
        <div id="celebration-bg" class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="confetti-container"></div>
        </div>

        <!-- Main Content -->
        <div class="relative z-10 max-w-md w-full mx-4">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-yellow-300 mb-2">🎉 LEVEL COMPLETE! 🎉</h1>
            <div class="text-lg">
              Land ${this.levelData.currentLand} • Level ${this.levelData.currentLevel}
            </div>
            <div class="text-sm text-green-200 mt-1">
              Mode: ${this.levelData.mode}
            </div>
          </div>

          <!-- Score Breakdown -->
          <div class="game-3d-container-[#1a5d1a] p-4 mb-6 space-y-2">
            <h2 class="text-lg font-bold text-center mb-3">Score Breakdown</h2>
            
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between">
                <span>Base Points:</span>
                <span class="text-green-300">+${score.basePoints}</span>
              </div>
              
              <div class="flex justify-between">
                <span>Bonus Points:</span>
                <span class="text-blue-300">+${score.bonusPoints}</span>
              </div>
              
              <div class="flex justify-between">
                <span>Penalties:</span>
                <span class="text-red-300">-${score.penaltyPoints}</span>
              </div>
              
              <div class="flex justify-between">
                <span>Speed Bonus:</span>
                <span class="text-yellow-300">×${score.speedMultiplier.toFixed(1)}</span>
              </div>
              
              <div class="flex justify-between">
                <span>Accuracy:</span>
                <span class="text-purple-300">+${Math.round(score.accuracyBonus * 100)}%</span>
              </div>
              
              <div class="flex justify-between">
                <span>Streak Bonus:</span>
                <span class="text-orange-300">+${score.streakBonus}</span>
              </div>
            </div>
            
            <hr class="border-green-400 my-3">
            
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">
                Final Score: ${score.finalScore}
              </div>
            </div>
          </div>

          <!-- Progress Indicator -->
          ${isNewLand ? `
            <div class="game-3d-container-[#4a1a5d] p-4 mb-6 text-center">
              <h2 class="text-xl font-bold text-purple-300 mb-2">🎊 NEW LAND UNLOCKED! 🎊</h2>
              <div class="text-lg">
                Welcome to Land ${this.levelData.nextLand}
              </div>
              <div class="text-sm text-purple-200 mt-1">
                Fresh challenges await!
              </div>
            </div>
          ` : `
            <div class="game-3d-container-blue-600 p-4 mb-6 text-center">
              <h2 class="text-lg font-bold mb-2">Next Challenge</h2>
              <div class="text-base">
                Land ${this.levelData.nextLand} • Level ${this.levelData.nextLevel}
              </div>
            </div>
          `}

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button id="continue-btn" class="game-3d-container-clickable-green-500 w-full py-3 text-lg font-bold text-center">
              Continue to Next Level
            </button>
            
            <div class="grid grid-cols-2 gap-3">
              <button id="retry-btn" class="game-3d-container-clickable-blue-500 py-2 text-sm">
                🔄 Retry Level
              </button>
              <button id="menu-btn" class="game-3d-container-clickable-gray-600 py-2 text-sm">
                🏠 Main Menu
              </button>
            </div>
          </div>

          <!-- Ad Banner Placeholder -->
          <div id="ad-banner" class="mt-6 text-center hidden">
            <div class="game-3d-container-gray-700 p-3">
              <div class="text-xs text-gray-300 mb-2">Advertisement</div>
              <div id="ad-content" class="bg-gray-600 h-16 flex items-center justify-center text-xs">
                Loading...
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
          <div class="text-white text-lg">Loading next level...</div>
        </div>
      </div>

      <style>
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #ffd700;
          animation: confetti-fall 3s linear infinite;
        }
        
        .confetti:nth-child(2n) { background: #ff6b6b; animation-delay: 0.5s; }
        .confetti:nth-child(3n) { background: #4ecdc4; animation-delay: 1s; }
        .confetti:nth-child(4n) { background: #45b7d1; animation-delay: 1.5s; }
        .confetti:nth-child(5n) { background: #96ceb4; animation-delay: 2s; }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes celebration-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .celebration-pulse {
          animation: celebration-pulse 2s ease-in-out infinite;
        }
      </style>
    `;

    this.uiContainer = utils.initUIDom(this, uiHTML);
  }

  private setupEventListeners() {
    const continueBtn = this.uiContainer.getChildByID('continue-btn') as HTMLButtonElement;
    const retryBtn = this.uiContainer.getChildByID('retry-btn') as HTMLButtonElement;
    const menuBtn = this.uiContainer.getChildByID('menu-btn') as HTMLButtonElement;

    continueBtn?.addEventListener('click', () => this.continueToNextLevel());
    retryBtn?.addEventListener('click', () => this.retryLevel());
    menuBtn?.addEventListener('click', () => this.goToMainMenu());
  }

  private showCelebration() {
    // Create confetti particles
    this.createConfetti();
    
    // Celebration sound (if available)
    try {
      const celebrationSound = this.sound.add('level_complete', { volume: 0.4 });
      celebrationSound.play();
    } catch (e) {
      // Sound not available, continue silently
    }

    // Add celebration pulse to score
    const scoreElement = this.uiContainer.node?.querySelector('.text-2xl.font-bold.text-yellow-400');
    if (scoreElement) {
      scoreElement.classList.add('celebration-pulse');
    }
  }

  private createConfetti() {
    const container = this.uiContainer.getChildByID('celebration-bg')?.querySelector('.confetti-container') as HTMLElement;
    if (!container) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(confetti);
    }

    // Clean up confetti after 5 seconds
    this.time.delayedCall(5000, () => {
      container.innerHTML = '';
    });
  }

  private async requestInterstitialAd() {
    try {
      const adResponse = await this.adManager.requestAd({
        slot: 'interstitial_level_end',
        land: this.levelData.currentLand,
        level: this.levelData.currentLevel,
        geo: 'US', // Would get from user's location
        device: 'mobile',
        language: 'en'
      });

      if (adResponse.success && adResponse.config) {
        this.showInterstitialAd(adResponse.config);
      }
    } catch (error) {
      console.log('Ad request failed:', error);
    }
  }

  private showInterstitialAd(adConfig: any) {
    // For demo purposes, show a banner ad instead
    const adBanner = this.uiContainer.getChildByID('ad-banner') as HTMLElement;
    const adContent = this.uiContainer.getChildByID('ad-content') as HTMLElement;
    
    if (adBanner && adContent && adConfig.creative) {
      adContent.innerHTML = `
        <img src="${adConfig.creative.url}" alt="Ad" class="max-w-full max-h-full object-contain" />
      `;
      adBanner.classList.remove('hidden');
    }
  }

  private async continueToNextLevel() {
    this.showLoading();
    
    this.time.delayedCall(1000, async () => {
      try {
        const currentLevelId = `land_${this.levelData.currentLand}_level_${this.levelData.currentLevel}`;
        const nextLevelId = `land_${this.levelData.nextLand}_level_${this.levelData.nextLevel}`;
        
        this.scene.stop();
        this.scene.resume('WordChainGameScene');
        await goToNextLevel(this, currentLevelId, nextLevelId);
      } catch (error) {
        console.error('Failed to navigate to next level:', error);
        // Fallback to direct scene start
        this.scene.start('WordChainGameScene', {
          mode: this.levelData.mode,
          land: this.levelData.nextLand,
          level: this.levelData.nextLevel
        });
      }
    });
  }

  private retryLevel() {
    this.showLoading();
    
    this.time.delayedCall(500, () => {
      this.scene.stop();
      this.scene.resume('WordChainGameScene');
      this.scene.start('WordChainGameScene', {
        mode: this.levelData.mode,
        land: this.levelData.currentLand,
        level: this.levelData.currentLevel
      });
    });
  }

  private goToMainMenu() {
    this.showLoading();
    
    this.time.delayedCall(500, () => {
      this.scene.stop();
      this.scene.stop('WordChainGameScene');
      this.scene.start('TitleScreen');
    });
  }

  private showLoading() {
    const loadingOverlay = this.uiContainer.getChildByID('loading-overlay') as HTMLElement;
    loadingOverlay?.classList.remove('hidden');
  }
}