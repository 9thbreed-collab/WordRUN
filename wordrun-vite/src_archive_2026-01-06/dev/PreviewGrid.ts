import Phaser from 'phaser'

export class PreviewGrid extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene)
    const { width, height } = scene.scale

    // vertical & horizontal safe-area lines (approx 5% padding)
    const grid = scene.add.graphics()
    grid.lineStyle(1, 0x00ff88, 0.3)

    // draw margin box
    const padX = width * 0.05
    const padY = height * 0.05
    grid.strokeRect(padX, padY, width - padX * 2, height - padY * 2)

    // center cross
    grid.lineStyle(1, 0x00ffff, 0.4)
    grid.moveTo(width / 2, 0)
    grid.lineTo(width / 2, height)
    grid.moveTo(0, height / 2)
    grid.lineTo(width, height / 2)
    grid.strokePath()

    // corner dots
    const dot = scene.add.circle(0, 0, 3, 0xffffff, 0.5)
    for (let i = 0; i < 4; i++) {
      const clone = dot.clone()
      const x = i % 2 ? width - padX : padX
      const y = i < 2 ? padY : height - padY
      clone.setPosition(x, y)
      this.add(clone)
    }

    this.add(grid)
    this.setScrollFactor(0)
    this.setDepth(9999)
  }
}
