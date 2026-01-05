/* ================================================================
   FILE: src/scenes/MapTransition.ts
   PURPOSE: Map transition using Supabase map graph
            + Ruut walk cycle instead of yellow dot
   ================================================================ */

   import Phaser from 'phaser'
   import { supabase } from '../supabase'
   import { LogBus } from '../dev/LogBus'
   import { parseLevelId, goToGameplay } from '../services/LevelRouter'
   import { getTheme, getMapGraph } from '../data/adapter'
   
   type LevelRow = {
     level_id: string;
     map_node_id: string | null;
     next_level_id_on_win: string | null;
   }
   
   type NodeRow = {
     map_node_id: string;
     x_pct: number;
     y_pct: number;
     world_id: string;
   }
   
   type EdgeRow = {
     edge_id: string;
     from_node_id: string;
     to_node_id: string;
     path_style: string | null;
     walk_duration_ms: number | null;
     world_id: string;
   }
   
   export class MapTransition extends Phaser.Scene {
     private currentLevelId = ''
     private nextLevelId    = ''
     private durationMs     = 1200
     private debugOverlay   = true
   
     // --- Ruut -------------------------------------------------------
     private ruut?: Phaser.GameObjects.Sprite;
   
     constructor () {
       super('MapTransition')
     }
   
     init (data: { currentLevelId: string; nextLevelId: string }) {
       this.currentLevelId = data.currentLevelId
       this.nextLevelId    = data.nextLevelId
     }
   
     async create () {
       LogBus.log('MapTransition', 'enter', {
         current: this.currentLevelId,
         next: this.nextLevelId
       })
   
       const cam = this.cameras.main
       const { width, height } = cam
   
       const theme = await getTheme()
       const map   = await getMapGraph()
   
       // --- feature flags --------------------------------------------
       try {
         const { data } = await supabase
           .from('feature_flags')
           .select('flag_key, default')
           .in('flag_key', ['transition_debug', 'use_map_transition'])
   
         const get = (k: string) => data?.find(d => d.flag_key === k)?.default
   
         if (get('use_map_transition') === false) {
           this.scene.start(this.nextLevelId || this.currentLevelId)
           return
         }
         if (get('transition_debug') !== undefined) {
           this.debugOverlay = !!get('transition_debug')
         }
       } catch {
         // ignore feature flag errors; fall back to default behavior
       }
   
       const { from, to, edge, issues } = await this.resolveTravel()
   
       // --- background -----------------------------------------------
       try {
         const [c1] = theme.bgGradient
         const { width: w, height: h } = this.scale
         const gbg = this.add.graphics()
         gbg.fillStyle(c1, 1).fillRect(0, 0, w, h)
         this.add.rectangle(0, 0, w, h, 0x000000)
           .setOrigin(0, 0)
           .setAlpha(theme.vignetteAlpha)
       } catch {
         this.add
           .rectangle(0, 0, width, height, 0x0d0f14)
           .setOrigin(0, 0)
           .setAlpha(0.9)
       }
   
       // --- node positions (percent -> px) ---------------------------
       const fromCfg = map.nodes[this.currentLevelId] ?? { x: 45, y: 65 }
       const toCfg   = map.nodes[this.nextLevelId]    ?? { x: 75, y: 35 }
   
       const { width: w, height: h } = this.scale
       const p1 = {
         x: Math.round((fromCfg.x / 100) * w),
         y: Math.round((fromCfg.y / 100) * h)
       }
       const p2 = {
         x: Math.round((toCfg.x / 100) * w),
         y: Math.round((toCfg.y / 100) * h)
       }
   
       const edgeKey = `${this.currentLevelId}->${this.nextLevelId}`
       const ms      = map.edges[edgeKey] ?? 1200
       this.durationMs = Phaser.Math.Clamp(ms, 300, 6000)
   
       LogBus.log('MapTransition', 'resolved', {
         durationMs: this.durationMs,
         from,
         to,
         edge
       })
   
       // --- path line + (hidden) dot ---------------------------------
       let dot: Phaser.GameObjects.Arc | undefined
       try {
         const g = this.add.graphics().setBlendMode(
           theme.wheel.glow ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL
         )
         g.lineStyle(theme.wheel.lineWidth, theme.lineColor, theme.lineAlpha)
         g.beginPath().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).strokePath()
   
         dot = this.add.circle(
           p1.x,
           p1.y,
           Math.max(8, theme.wheel.nodeRadius * 0.4),
           theme.dotFill
         )
       } catch {
         const g = this.add.graphics()
         g.lineStyle(4, 0xffffff, 0.95)
           .beginPath()
           .moveTo(p1.x, p1.y)
           .lineTo(p2.x, p2.y)
           .strokePath()
   
         dot = this.add.circle(p1.x, p1.y, 8, 0x00e5ff)
       }
   
           // --- Ruut setup (spritesheet animation) -----------------------
    if (!this.anims.exists('ruut_walk_right')) {
      this.anims.create({
        key: 'ruut_walk_right',
        frames: this.anims.generateFrameNumbers('ruut_walk', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    this.ruut = this.add
      .sprite(p1.x, p1.y, 'ruut_walk', 0)
      .setOrigin(0.5, 0.9)
      .setScale(0.35);

    this.ruut.play('ruut_walk_right');

    if (dot) dot.setVisible(false);

   
       // --- handoff logic --------------------------------------------
       const targetRef = parseLevelId(this.nextLevelId) || parseLevelId(this.currentLevelId)
       let handedOff = false
   
       const safeStart = () => {
         if (handedOff) return
         handedOff = true
   
         this.cameras.main.once('camerafadeoutcomplete', () => {
           if (!targetRef) {
             this.scene.start('GameplayScene', { land: 1, level: 1 })
             return
           }
           try {
             goToGameplay(this, targetRef)
           } catch {
             this.scene.start('GameplayScene', {
               land: targetRef.land,
               level: targetRef.level
             })
           }
         })
   
         this.cameras.main.fadeOut(150, 0, 0, 0)
       }
   
       LogBus.log('MapTransition', 'tween.start', { to: this.nextLevelId })
   
       if (this.ruut) {
        this.tweens.add({
          targets: this.ruut,
          x: p2.x,
          y: p2.y,
          duration: this.durationMs,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.ruut!.anims.stop();
            LogBus.log('MapTransition', 'handoff', { to: this.nextLevelId });
            safeStart();
          }
        });
      } else {
        safeStart();
      }
  
       // watchdog ------------------------------------------------------
       this.time.delayedCall(this.durationMs + 800, () => {
         LogBus.warn('MapTransition', 'watchdog', { to: this.nextLevelId })
         safeStart()
       })
   
       // debug text ----------------------------------------------------
       this.add.text(
         12,
         60,
         `map: ${edgeKey}  p1=(${fromCfg.x},${fromCfg.y})  p2=(${toCfg.x},${toCfg.y})`,
         { fontSize: '11px', color: '#9ee6ff' }
       )
   
       if (this.debugOverlay) {
         const lines = [
           'MapTransition',
           `from: ${this.currentLevelId} ${from ? `(${from.map_node_id})` : '(no node)'}`,
           `to:   ${this.nextLevelId} ${to ? `(${to.map_node_id})` : '(no node)'}`,
           `edge: ${edge ? edge.edge_id : 'none'} dur=${this.durationMs}ms`,
           issues.length ? `⚠ ${issues.join(' | ')}` : 'OK'
         ]
         this.add.text(12, 12, lines.join('\n'), {
           fontSize: '12px',
           color: '#9ee6ff'
         })
       }
     }
   
     private async resolveTravel (): Promise<{
       from: NodeRow | null;
       to: NodeRow | null;
       edge: EdgeRow | null;
       issues: string[];
     }> {
       const issues: string[] = []
   
       const { data: levels } = await supabase
         .from('levels')
         .select('level_id,map_node_id,next_level_id_on_win')
         .in('level_id', [this.currentLevelId, this.nextLevelId])
   
       const cur = levels?.find(l => l.level_id === this.currentLevelId) || null
       const nxt = levels?.find(l => l.level_id === this.nextLevelId)   || null
   
       if (!cur) issues.push('missing current level row')
       if (!nxt) issues.push('missing next level row')
   
       const fromId = cur?.map_node_id ?? this.currentLevelId
       const toId   = nxt?.map_node_id ?? this.nextLevelId
   
       let from: NodeRow | null = null
       let to:   NodeRow | null = null
       let edge: EdgeRow | null = null
   
       if (fromId && toId) {
         const { data: nodes } = await supabase
           .from('map_nodes')
           .select('map_node_id,x_pct,y_pct,world_id')
           .in('map_node_id', [fromId, toId])
   
         from = nodes?.find(n => n.map_node_id === fromId) || null
         to   = nodes?.find(n => n.map_node_id === toId)   || null
   
         if (!from) issues.push(`node missing: ${fromId}`)
         if (!to)   issues.push(`node missing: ${toId}`)
   
         if (from && to) {
           const { data: edges } = await supabase
             .from('map_edges')
             .select('edge_id,from_node_id,to_node_id,path_style,walk_duration_ms,world_id')
             .eq('from_node_id', from.map_node_id)
             .eq('to_node_id', to.map_node_id)
             .limit(1)
   
           edge = edges && edges.length ? edges[0] : null
           if (!edge) issues.push('edge not found (straight line)')
         }
       } else {
         issues.push('no node ids')
       }
   
       return { from, to, edge, issues }
     }
   }
   
   export default MapTransition
   