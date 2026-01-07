/* =================================================================
   FILE: src/scenes/ResultsScene.ts
   PURPOSE: Results screen showing level performance and next actions
   ================================================================= */
import Phaser from 'phaser';
import { GameDataManager } from '../GameDataManager';
import { LevelManager } from '../LevelManager';
import * as utils from '../utils';

interface ResultsData {
  land: number;
  level: number;
  score: number;
  time: number; // in seconds
  accuracy: number; // percentage
  hintsUsed: number;
  wrongCount: number;
  failed?: boolean;
}

export class ResultsScene extends Phaser.Scene {
  private gdm!: GameDataManager;
  private results!: ResultsData;
  private uiContainer!: Phaser.GameObjects.DOMElement;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: ResultsData) {
    this.gdm = GameDataManager.getInstance();
    this.results = data;
  }

  create() {
    this.createUI();
    this.setupEventListeners();
  }

  private createUI() {
    const isSuccess = !this.results.failed;
    // Use legacy method for now (could be enhanced with async later)
    const isLastLevel = LevelManager.isLastLevelLegacy(`Level${this.results.level}Scene`);
    
    const html = `
      <div class="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900 to-indigo-900 text-white font-mono"
           style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; touch-action: manipulation;">
        
        <!-- Results Container -->
        <div class="flex flex-col items-center justify-center h-full px-4">
          
          <!-- Result Title -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}">
              ${isSuccess ? '🎉 Level Complete!' : '💔 Level Failed'}
            </h1>
            <div class="text-lg text-purple-200">
              Land ${this.results.land} • Level ${this.results.level}
            </div>
          </div>

          <!-- Stats Display -->
          <div class="game-3d-container-[#2a1f3d] p-6 mb-8 w-full max-w-sm">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <!-- Score -->
              <div class="text-center">
                <div class="text-purple-300 mb-1">Score</div>
                <div class="text-2xl font-bold text-yellow-400">${this.results.score.toLocaleString()}</div>
              </div>
              
              <!-- Time -->
              <div class="text-center">
                <div class="text-purple-300 mb-1">Time</div>
                <div class="text-2xl font-bold text-blue-400">${this.formatTime(this.results.time)}</div>
              </div>
              
              <!-- Accuracy -->
              <div class="text-center">
                <div class="text-purple-300 mb-1">Accuracy</div>
                <div class="text-2xl font-bold text-green-400">${this.results.accuracy}%</div>
              </div>
              
              <!-- Hints Used -->
              <div class="text-center">
                <div class="text-purple-300 mb-1">Hints</div>
                <div class="text-2xl font-bold text-gray-400">${this.results.hintsUsed}</div>
              </div>
            </div>
            
            <!-- Wrong Count -->
            <div class="mt-4 pt-4 border-t border-purple-500 text-center">
              <div class="text-purple-300 mb-1">Wrong Attempts</div>
              <div class="text-xl font-bold text-red-400">${this.results.wrongCount}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3 w-full max-w-sm">
            ${this.createActionButtons(isSuccess, isLastLevel)}
          </div>

          <!-- Lives Display -->
          <div class="mt-6 text-center text-sm text-purple-300">
            Lives Remaining: <span class="text-red-400 font-bold">❤️ ${this.gdm.getLives()}</span>
          </div>
        </div>
      </div>
    `;

    this.uiContainer = utils.initUIDom(this, html);
  }

  private createActionButtons(isSuccess: boolean, isLastLevel: boolean): string {
    if (isSuccess) {
      // Level completed - show Next Level button that immediately starts next level
      return `
        <button id="next-level-btn" 
                class="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded"
                role="button" 
                tabindex="0">
          ➡️ Next Level
        </button>
      `;
    } else {
      // Failed level
      const hasLives = this.gdm.getLives() > 0;
      
      if (hasLives) {
        return `
          <button id="retry-btn" 
                  class="w-full py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded"
                  role="button" 
                  tabindex="0">
            🔄 Retry Level
          </button>
        `;
      } else {
        return `
          <button id="title-btn" 
                  class="w-full py-4 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded"
                  role="button" 
                  tabindex="0">
            💔 No Lives Left - Back to Title
          </button>
        `;
      }
    }
  }

  private setupEventListeners() {
    const root = this.uiContainer.node as HTMLElement;

    // Next Level button
    root.querySelector('#next-level-btn')?.addEventListener('click', () => {
      this.startNextLevel();
    });

    // Continue button removed in simplified UI

    // Retry button
    root.querySelector('#retry-btn')?.addEventListener('click', () => {
      this.retryLevel();
    });

    // Title button
    root.querySelector('#title-btn')?.addEventListener('click', () => {
      this.scene.start('TitleScreen');
    });
  }

  private startNextLevel() {
    const nextLevel = this.results.level + 1;
    const currentLand = this.results.land;
    
    // For demo, just increment level number
    // Update save data
    this.gdm.setProgress(currentLand, nextLevel);
    
    // Start next level immediately
    this.scene.start('GameplayScene', {
      mode: 'story',
      land: currentLand,
      level: nextLevel
    });
  }

  private retryLevel() {
    // Retry current level
    this.scene.start('GameplayScene', {
      mode: 'story',
      land: this.results.land,
      level: this.results.level
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }
}