/* =========================================
   FILE: src/main.ts
   PURPOSE: Phaser bootstrap with data-driven initialization
   ========================================= */
   
import './style.css';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { TitleScreen } from './scenes/TitleScreen';
import { GameplayScene } from './scenes/GameplayScene';
import { MapScene } from './scenes/MapScene';
import { MapTransition } from './scenes/MapTransition';
import { TestLevel } from './scenes/TestLevel';
import { AdminConsole } from './scenes/AdminConsole';
import { DiagnosticsScene } from './scenes/DiagnosticsScene';
import { GAME_CONFIG } from './config';
import { DataManager } from './DataManager';
import { configureScale } from './ui/Layout';
import { DebugBus } from './dev/DebugHUD';
import { LogBus } from './dev/LogBus';
import { LogOverlay } from './scenes/LogOverlay';
import { WorldMapScene } from "./scenes/WorldMapScene";
import { WordChainGameScene } from './scenes/WordChainGameScene';





// Initialize DataManager instance early
DataManager.getInstance();


// Build scene list, with dev-only scenes behind a flag
const SCENES: Phaser.Types.Core.GameConfig['scene'] = [
  Preloader,
  TitleScreen,
  MapScene,
  WorldMapScene,
  GameplayScene,
  WordChainGameScene,   // ← 1v1 / alternate game mode scene
  MapTransition,
];

if (GAME_CONFIG.dev.enabled) {
  SCENES.push(TestLevel, AdminConsole, DiagnosticsScene);
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0e0e12',
  // Virtual design resolution
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    expandParent: true,
  },
    dom: { createContainer: true },
  scene: SCENES,
});

// Configure responsive scale
configureScale(game);


// Launch LogOverlay once and keep it on top
// @ts-ignore
//game.scene.add('LogOverlay', LogOverlay, true); // 'true' launches immediately

// Add scene start logging for debugging
const _sceneStart = Phaser.Scenes.ScenePlugin.prototype.start
// @ts-ignore
Phaser.Scenes.ScenePlugin.prototype.start = function(key: string, data?: any) {
  try { 
    DebugBus.noteStart(this.scene.key, key)
    LogBus.log('scene.start', `from=${this.scene.key} to=${key}`, data)
  } catch {}
  const r = _sceneStart.call(this, key, data)
  try { this.game.scene.bringToTop('LogOverlay') } catch {}
  return r
}

// Also keep on top after launches/awaken
const _sceneLaunch = Phaser.Scenes.ScenePlugin.prototype.launch
// @ts-ignore
Phaser.Scenes.ScenePlugin.prototype.launch = function(key: string, data?: any) {
  const r = _sceneLaunch.call(this, key, data)
  try { this.game.scene.bringToTop('LogOverlay') } catch {}
  return r
}
