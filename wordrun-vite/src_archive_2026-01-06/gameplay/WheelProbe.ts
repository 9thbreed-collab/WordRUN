import Phaser from 'phaser'
import { DebugBus } from '../dev/DebugHUD'

export function probeWheelPointer(
  scene: Phaser.Scene,
  wheelContainer: Phaser.GameObjects.Container,
  pointer: Phaser.Input.Pointer,
  nodeCentersLocal: Phaser.Math.Vector2[],
  tol = 18
) {
  const m = wheelContainer.getWorldTransformMatrix()
  const inv = m.invert()
  const world = new Phaser.Math.Vector2(pointer.x, pointer.y)
  const local = world.clone()
  inv.transformPoint(local.x, local.y, local)

  // Nearest node
  let idx = -1, best = 1e9
  for (let i = 0; i < nodeCentersLocal.length; i++) {
    const c = nodeCentersLocal[i]
    const d = Phaser.Math.Distance.Between(local.x, local.y, c.x, c.y)
    if (d < best) { best = d; idx = i }
  }

  DebugBus.hud.set('wheel.world', `${Math.round(world.x)},${Math.round(world.y)}`)
  DebugBus.hud.set('wheel.local', `${Math.round(local.x)},${Math.round(local.y)}`)
  DebugBus.hud.set('wheel.nearest', idx >= 0 ? `#${idx} @ ${Math.round(best)}px` : 'none')
  DebugBus.hud.set('wheel.tol', tol)
}