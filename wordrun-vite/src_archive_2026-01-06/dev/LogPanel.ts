import Phaser from 'phaser'
import { LogBus, type LogEntry } from './LogBus'

export class LogPanel {
  private bg!: Phaser.GameObjects.Rectangle
  private text!: Phaser.GameObjects.Text
  private header!: Phaser.GameObjects.Text
  private btnPause!: Phaser.GameObjects.Text
  private btnClear!: Phaser.GameObjects.Text
  private btnCopy!: Phaser.GameObjects.Text
  private container!: Phaser.GameObjects.Container
  private lines: string[] = []
  private visible = false

  constructor(private scene: Phaser.Scene){}

  mount(anchor:'bottom-left'|'bottom-right'='bottom-left'){
    const cam = this.scene.cameras.main
    const w = Math.max(280, Math.floor(cam.width * 0.5))
    const h = Math.max(160, Math.floor(cam.height * 0.28))
    const pad = 8

    this.bg = this.scene.add.rectangle(0,0,w,h,0x000000,0.65).setOrigin(0,0)
    this.bg.setStrokeStyle(1, 0x88aacc, 0.7)

    this.header = this.scene.add.text(pad, pad, 'LOG', { fontFamily:'monospace', fontSize:'12px', color:'#aee2ff' })
    this.btnPause = this.scene.add.text(w-150, pad, '[Pause]', { fontFamily:'monospace', fontSize:'12px', color:'#ffffff' }).setInteractive({ useHandCursor:true })
    this.btnClear = this.scene.add.text(w-90, pad, '[Clear]', { fontFamily:'monospace', fontSize:'12px', color:'#ffffff' }).setInteractive({ useHandCursor:true })
    this.btnCopy  = this.scene.add.text(w-38, pad, '[Copy]',  { fontFamily:'monospace', fontSize:'12px', color:'#ffffff' }).setInteractive({ useHandCursor:true })

    this.text = this.scene.add.text(pad, 22, '', { fontFamily:'monospace', fontSize:'11px', color:'#d9f2ff', wordWrap:{ width: w - pad*2 } })

    this.container = this.scene.add.container(0,0,[this.bg, this.header, this.btnPause, this.btnClear, this.btnCopy, this.text])
    this.container.setDepth(10000)

    if (anchor==='bottom-left'){
      this.container.x = 8
      this.container.y = cam.height - h - 8
    } else {
      this.container.x = cam.width - w - 8
      this.container.y = cam.height - h - 8
    }

    this.btnPause.on('pointerdown', ()=> {
      LogBus.paused = !LogBus.paused
      this.btnPause.setText(LogBus.paused ? '[Resume]' : '[Pause]')
    })
    this.btnClear.on('pointerdown', ()=> { LogBus.clear(); this.lines=[]; this.render() })
    this.btnCopy.on('pointerdown', ()=> this.copyAll())

    // Toggle show/hide with double tap anywhere in panel
    this.bg.setInteractive().on('pointerdown', (p:Phaser.Input.Pointer)=> {
      if (p.getDuration() < 250 && p.downTime && p.upTime && (p.upTime - p.downTime) < 250) {
        // single quick click; do nothing
      }
    })
    this.header.setInteractive().on('pointerdown', ()=>{
      this.visible = !this.visible
      this.text.setVisible(this.visible)
    })

    LogBus.on((e)=> this.append(e))
    // flush existing
    for (const e of LogBus.all()) this.append(e)
  }

  private append(e: LogEntry){
    const time = new Date(e.t).toISOString().split('T')[1].replace('Z','')
    const lvl = e.lvl.toUpperCase().padEnd(5,' ')
    const tag = e.tag.padEnd(12,' ')
    const base = `${time} ${lvl} ${tag} ${e.msg}`
    if (e.data !== undefined) {
      this.lines.push(base + ' ' + safeJSON(e.data))
    } else {
      this.lines.push(base)
    }
    if (this.lines.length > 400) this.lines.shift()
    this.render()
  }

  private render(){
    this.text.setText(this.lines.join('\n'))
  }

  private copyAll(){
    const blob = new Blob([this.lines.join('\n')], {type:'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game-log.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
}

function safeJSON(o:any){
  try { return JSON.stringify(o) } catch { return '[unserializable]' }
}