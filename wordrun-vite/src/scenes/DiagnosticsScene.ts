import Phaser from 'phaser'
import { DebugBus } from '../dev/DebugHUD'

export class DiagnosticsScene extends Phaser.Scene {
  constructor(){super('Diagnostics')}
  create(){
    DebugBus.hud.init(this)
    const scenes = Object.keys(this.game.scene.keys)
    DebugBus.hud.set('registeredScenes', scenes.length)
    DebugBus.hud.set('has.MapTransition', String(!!this.game.scene.keys['MapTransition']))
    DebugBus.hud.flush()
    // press anywhere to go to MapTransition test if present
    this.input.once('pointerdown', ()=>{
      if (this.game.scene.keys['MapTransition']) {
        this.scene.start('MapTransition', { currentLevelId: 'level_001', nextLevelId: 'level_002' })
      }
    })
  }
}