import './index.css';
import Phaser from 'phaser';
import GameplayScene from './scenes/GameplayScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  scene: [GameplayScene],
  dom: {
    createContainer: true
  }
};

new Phaser.Game(config);
