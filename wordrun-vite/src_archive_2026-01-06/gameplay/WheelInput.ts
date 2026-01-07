import Phaser from 'phaser'

/** pointer world -> local coords of wheelContainer */
export function pointerToLocal(container: Phaser.GameObjects.Container, pointer: Phaser.Input.Pointer) {
  const m = container.getWorldTransformMatrix()
  const inv = m.invert()
  const out = new Phaser.Math.Vector2(pointer.x, pointer.y)
  inv.transformPoint(out.x, out.y, out)
  return out
}

/** Auto-scale tolerance by container scale */
export function scaledTolerance(container: Phaser.GameObjects.Container, base=18) {
  const sx = container.scaleX || 1
  const sy = container.scaleY || 1
  return Math.max(base * Math.max(sx, sy), 8)
}