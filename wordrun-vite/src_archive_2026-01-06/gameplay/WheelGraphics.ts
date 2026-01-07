import Phaser from 'phaser'

/** A graphics object that lives INSIDE the wheelContainer (local space) */
export function makeWheelGraphics(container: Phaser.GameObjects.Container) {
  const g = container.scene.add.graphics()
  container.add(g) // <— key: child of the same container
  g.setDepth(999)
  return g
}