import Phaser from 'phaser'

export type NodeIdx = number
export type GestureState = 'idle'|'drawing'

export interface GestureResult {
  submitted: boolean
  nodeOrder: NodeIdx[]
}

export class WheelGesture {
  private state: GestureState = 'idle'
  private order: NodeIdx[] = []

  constructor(
    private hitNodeAtLocal: (p: Phaser.Math.Vector2, tol:number)=>NodeIdx|null,
    private tolProvider: ()=>number  // returns scaled tolerance
  ){}

  start(pLocal: Phaser.Math.Vector2) {
    this.state = 'drawing'
    this.order = []
    const n = this.hitNodeAtLocal(pLocal, this.tolProvider())
    if (n!==null) this.order.push(n)
  }

  move(pLocal: Phaser.Math.Vector2) {
    if (this.state !== 'drawing') return
    const n = this.hitNodeAtLocal(pLocal, this.tolProvider())
    if (n===null) return
    const last = this.order[this.order.length-1]
    const prev = this.order[this.order.length-2]
    if (this.order.length && n===last) return
    // backtrack: if moving onto previous, pop
    if (prev!==undefined && n===prev) { this.order.pop(); return }
    // Append if not already in path
    if (!this.order.includes(n)) this.order.push(n)
  }

  end(pLocal: Phaser.Math.Vector2): GestureResult {
    if (this.state !== 'drawing') return { submitted:false, nodeOrder:[] }
    this.move(pLocal)
    const out = { submitted: this.order.length >= 2, nodeOrder: [...this.order] }
    this.state='idle'
    this.order=[]
    return out
  }

  cancel(): GestureResult {
    const out = { submitted:false, nodeOrder:[] }
    this.state='idle'
    this.order=[]
    return out
  }

  /** For drawing: return local-space polyline, snapping to node centers */
  polylineLocal(nodeCentersLocal: Phaser.Math.Vector2[], lastLocal: Phaser.Math.Vector2): Phaser.Math.Vector2[] {
    const pts: Phaser.Math.Vector2[] = []
    for (let i=0;i<this.order.length;i++) pts.push(nodeCentersLocal[this.order[i]].clone())
    // extend to finger (snapped if within tol)
    const tol = this.tolProvider()
    let best=-1, bestD=1e9
    for (let i=0;i<nodeCentersLocal.length;i++){
      const c=nodeCentersLocal[i]; const d=Phaser.Math.Distance.Between(c.x,c.y,lastLocal.x,lastLocal.y)
      if (d<bestD){bestD=d;best=i}
    }
    if (best>=0 && bestD<=tol) pts.push(nodeCentersLocal[best].clone())
    else pts.push(lastLocal.clone())
    return pts
  }

  getPath() { return [...this.order] }
}