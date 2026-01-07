import Phaser from 'phaser';
import JuiceScene from './JuiceScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game-container',
  backgroundColor: '#1a1d2a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [JuiceScene],
};

export default new Phaser.Game(config);
