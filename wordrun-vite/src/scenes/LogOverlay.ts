import Phaser from 'phaser'
import { LogPanel } from '../dev/LogPanel'
import { LogBus } from '../dev/LogBus'

export class LogOverlay extends Phaser.Scene {
  private panel?: LogPanel
  constructor(){ super({ key:'LogOverlay', active:false, visible:true }) }

  create(){
    // No background; this scene only draws the panel
    this.panel = new LogPanel(this)
    this.panel.mount('bottom-left')

    // Keep panel positioned on resize
    this.scale.on('resize', () => {
      // Recreate to reposition (simple and safe)
      this.cameras.main.setScroll(0,0)
      this.children.removeAll(true)
      this.panel = new LogPanel(this)
      this.panel.mount('bottom-left')
    })

    // Note that overlay is alive
    LogBus.log('LogOverlay','mounted')
  }
}
export default LogOverlay