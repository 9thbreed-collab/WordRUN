/* =================================================================
   FILE: src/scenes/Preloader.ts
   PURPOSE: Data-driven preloader scene for WordRun!
   ================================================================= */
import Phaser from 'phaser';
import * as utils from '../utils';
import { DataManager } from '../DataManager';
import { AssetLoader } from '../AssetLoader';

export class Preloader extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.DOMElement;
  private dataManager!: DataManager;
  private assetLoader!: AssetLoader;

  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    this.preloadAsync();
  }

  private async preloadAsync() {
    this.createLoadingUI();
    
    // Initialize DataManager
    this.dataManager = DataManager.getInstance();
    this.assetLoader = new AssetLoader(this);
    
    // Update progress for initialization
    this.updateProgress(10, 'Connecting to database...');
    
    try {
      await this.dataManager.initialize();
      this.updateProgress(30, 'Loading asset configuration...');
      
      // Load essential assets
      await this.assetLoader.loadGameAssets();
      this.updateProgress(60, 'Loading game assets...');
      
      // Set up asset loading progress
      this.load.on('progress', (value: number) => {
        const totalProgress = 60 + (value * 30); // 60-90% for asset loading
        this.updateProgress(Math.floor(totalProgress), 'Loading assets...');
      });

      this.load.on('complete', () => {
        this.updateProgress(100, 'Ready!');
        // Small delay to show completed loading
        this.time.delayedCall(500, () => {
          this.scene.start('TitleScreen');
        });
      });

      // Start asset loading
      this.load.start();
      
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      this.updateProgress(100, 'Error - Starting in offline mode');
      
      // Fallback to title screen even if initialization fails
      this.time.delayedCall(1000, () => {
        this.scene.start('TitleScreen');
      });
    }
  }

  private createLoadingUI() {
    const html = `
      <div class="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white font-mono flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text mb-8">
            HappyNeyon: WordRun!
          </h1>
          <div class="text-lg text-purple-200 mb-8">Loading...</div>
          <div class="w-64 bg-purple-800 rounded-full h-4 mb-4">
            <div id="progress-bar" class="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <div id="progress-text" class="text-purple-300">0%</div>
        </div>
      </div>
    `;

    this.uiContainer = utils.initUIDom(this, html);
  }

  private updateProgress(percentage: number, message: string = 'Loading...') {
    const root = this.uiContainer.node as HTMLElement;
    const progressBar = root.querySelector('#progress-bar') as HTMLElement;
    const progressText = root.querySelector('#progress-text') as HTMLElement;
    const loadingMessage = root.querySelector('.text-lg') as HTMLElement;
    
    if (progressBar && progressText) {
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }
}