import Phaser from 'phaser'

export const VIRTUAL_W = 1080
export const VIRTUAL_H = 1920

/** Configure Phaser scale so we 'contain' to device safely (no crop), then drive all UI from anchors. */
export function configureScale(game: Phaser.Game) {
  const scale = game.scale
  scale.scaleMode = Phaser.Scale.FIT
}

/** Safe-area padding (could be read from CSS env if embedded in app shell) */
export function getSafeArea() {
  return { top: 24, right: 24, bottom: 24, left: 24 }
}

type Anchor =
 | 'top-left'|'top'|'top-right'
 | 'left'|'center'|'right'
 | 'bottom-left'|'bottom'|'bottom-right'

/** Anchor any display object to a screen position with optional offsets. */
export function anchor(obj: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform, key: Anchor, xOff=0, yOff=0) {
  const cam = (obj.scene as Phaser.Scene).cameras.main
  const { width:w, height:h } = cam
  const s = getSafeArea()
  let x=0, y=0
  switch (key) {
    case 'top-left':    x=s.left;         y=s.top;               break
    case 'top':         x=w/2;            y=s.top;               break
    case 'top-right':   x=w-s.right;      y=s.top;               break
    case 'left':        x=s.left;         y=h/2;                 break
    case 'center':      x=w/2;            y=h/2;                 break
    case 'right':       x=w-s.right;      y=h/2;                 break
    case 'bottom-left': x=s.left;         y=h-s.bottom;          break
    case 'bottom':      x=w/2;            y=h-s.bottom;          break
    case 'bottom-right':x=w-s.right;      y=h-s.bottom;          break
  }
  obj.setPosition(x + xOff, y + yOff)
}

/** Text helper: scale font size by viewport height for readability. */
export function vh(scene: Phaser.Scene, pct: number) {
  return Math.max(12, Math.round(scene.cameras.main.height * pct / 100))
}

/** Call this after creating/resizing UI to re-anchor elements. */
export function onResize(scene: Phaser.Scene, cb: () => void) {
  scene.scale.on('resize', () => cb())
}