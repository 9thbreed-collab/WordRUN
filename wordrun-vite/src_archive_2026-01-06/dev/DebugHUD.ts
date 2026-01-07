import Phaser from 'phaser'

export class DebugHUD {
  private text?: Phaser.GameObjects.Text
  private lines: string[] = []
  private lastStarts: string[] = []
  enabled = false

  init(scene: Phaser.Scene) {
    if (!this.enabled) return
    this.text = scene.add.text(8, 8, '', { fontSize: '12px', color: '#9ee6ff' })
    this.text.setScrollFactor(0).setDepth(10000)
  }

  set(key: string, value: string | number | boolean) {
    this.lines.push(`${key}: ${value}`)
  }

  pushSceneStart(sceneKey: string, fromKey: string) {
    this.lastStarts.unshift(`${fromKey} → ${sceneKey}`)
    if (this.lastStarts.length > 5) this.lastStarts.pop()
  }

  flush() {
    if (!this.text) return
    const out = [
      ...this.lines,
      this.lastStarts.length ? ('recent starts: ' + this.lastStarts.join('  |  ')) : ''
    ].filter(Boolean).join('\n')
    this.text.setText(out)
    this.lines = []
  }
}

export const DebugBus = {
  hud: new DebugHUD(),
  noteStart(fromKey: string, toKey: string) {
    try { DebugBus.hud.pushSceneStart(toKey, fromKey) } catch {}
    // console marker
    try { console.warn('[SCENE.START]', fromKey, '→', toKey) } catch {}
  }
}