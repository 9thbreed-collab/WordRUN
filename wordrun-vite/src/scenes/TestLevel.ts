import Phaser from 'phaser';
import { goToNextLevel } from '../services/Router';
import * as utils from '../utils';

/**
 * Simple test level to demonstrate MapTransition functionality
 */
export class TestLevel extends Phaser.Scene {
  private currentLevelId: string;
  private uiContainer?: Phaser.GameObjects.DOMElement;
  private enterKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'TestLevel' });
    this.currentLevelId = 'L001'; // Default to first level
  }

  init(data: { levelId?: string }) {
    this.currentLevelId = data.levelId || 'L001';
  }

  create(): void {
    console.log(`TestLevel created: ${this.currentLevelId}`);

    // Create simple background
    this.add.rectangle(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2, 
      this.scale.gameSize.width, this.scale.gameSize.height, 0x2E3440);

    // Create test UI
    this.createTestUI();

    // Setup inputs
    this.setupInputs();

    // Auto-complete after 3 seconds for quick testing
    this.time.delayedCall(3000, () => {
      this.completeLevel();
    });
  }

  private createTestUI(): void {
    const uiHTML = `
      <div id="test-level-container" class="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000] font-retro flex flex-col justify-center items-center">
        <!-- Level Info -->
        <div class="text-white font-bold text-center pointer-events-none mb-8">
          <div class="text-6xl mb-4">Test Level</div>
          <div class="text-2xl mb-2">Level ID: ${this.currentLevelId}</div>
          <div class="text-xl text-yellow-400">Auto-completing in 3 seconds...</div>
        </div>

        <!-- Manual Complete Button -->
        <button id="complete-btn" class="game-pixel-container-clickable-green-500 px-6 py-3 pointer-events-auto">
          <span class="text-white font-bold text-lg">Complete Level Now</span>
        </button>

        <!-- Instructions -->
        <div class="text-white text-center mt-8 pointer-events-none">
          <div class="text-sm">Press ENTER to complete level</div>
          <div class="text-sm">Watch for MapTransition animation</div>
        </div>
      </div>
    `;

    this.uiContainer = utils.initUIDom(this, uiHTML);

    // Add click handler for complete button
    const completeBtn = document.getElementById('complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeLevel());
    }
  }

  private setupInputs(): void {
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterKey?.on('down', () => this.completeLevel());
  }

  private async completeLevel(): Promise<void> {
    console.log(`Completing test level: ${this.currentLevelId}`);

    try {
      // Use Router for centralized level navigation with MapTransition
      // For test levels, provide fallback hint but let Router check Supabase first
      const nextLevelMap: Record<string, string> = {
        'L001': 'L002',
        'L002': 'L003',
        'L003': 'L001' // Cycle back to start
      };
      
      const fallbackNextId = nextLevelMap[this.currentLevelId] || 'L001';
      await goToNextLevel(this, this.currentLevelId, fallbackNextId);
    } catch (error) {
      console.error('Failed to navigate to next level:', error);
      
      // Fallback: direct scene start
      const nextLevelMap: Record<string, string> = {
        'L001': 'L002',
        'L002': 'L003',
        'L003': 'L001'
      };
      
      const nextLevelId = nextLevelMap[this.currentLevelId] || 'L001';
      this.scene.start('TestLevel', { levelId: nextLevelId });
    }
  }

  update(): void {
    // No special update logic needed for test level
  }
}