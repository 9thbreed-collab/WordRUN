/* =========================================
   FILE: src/scenes/MapScene.ts
   PURPOSE: Data-driven world map with node progression
   ========================================= */

import Phaser from 'phaser';
import { initScale } from '../utils';
import { DataManager } from '../DataManager';
import { AssetLoader } from '../AssetLoader';
import { getLandMeta } from '../landMeta';


type MapParams = { world_id?: string; current_node_id?: string; land?: number; level?: number };

export class MapScene extends Phaser.Scene {
  private params!: MapParams;
  private dataManager!: DataManager;
  private assetLoader!: AssetLoader;
  private currentWorldId = 'world1';
  private currentNodeId = 'level1';

  constructor() { super('MapScene'); }

  init(data: MapParams) { 
    this.params = data ?? { land: 1, level: 1 };
    this.dataManager = DataManager.getInstance();
    this.assetLoader = new AssetLoader(this);
        // Set land-based visual flag on <body> for map screen
        const landId = typeof this.params.land === 'number' ? this.params.land : 0;
        const landMeta = getLandMeta(landId);
        document.body.dataset.land = String(landMeta.id);
    
    // Use database world/node if provided, otherwise fallback to legacy params
    if (data.world_id && data.current_node_id) {
      this.currentWorldId = data.world_id;
      this.currentNodeId = data.current_node_id;
    } else {
      // Map legacy params to database IDs
      this.currentNodeId = data.level === 1 ? 'level1' : 'level2';
    }
  }

  preload() {
    // Async loading wrapped for Phaser compatibility
    this.loadMapAssetsAsync();
  }

  private async loadMapAssetsAsync() {
    try {
      // Load any additional map-specific assets if needed
      await this.assetLoader.loadCurrentArtPackAssets();
      this.load.start();
    } catch (error) {
      console.error('Failed to load map assets:', error);
      this.load.start(); // Fallback to start loading anyway
    }
  }

  create() {
    // Async create wrapped for Phaser compatibility  
    this.createMapAsync();
  }

  private async createMapAsync() {
    // Fade in from MapTransition
    this.cameras.main.fadeIn(150, 0, 0, 0);

    const { width, height } = this.scale;

    // Load world map data
    const nodes = await this.dataManager.getMapNodes(this.currentWorldId);
    const edges = await this.dataManager.getMapEdges(this.currentWorldId);
    const currentNode = nodes.find(n => n.map_node_id === this.currentNodeId);

    // Background grid (simple 8-bit vibe)
    const g = this.add.graphics();
    g.lineStyle(1, 0x2a2a35, 1);
    for (let x = 0; x <= width; x += 16) g.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 16) g.lineBetween(0, y, width, y);

    // Render map nodes
    const nodeElements: Map<string, any> = new Map();
    
    for (const node of nodes) {
      const nodeX = (node.x_pct / 100) * width;
      const nodeY = (node.y_pct / 100) * height;
      
      // Pin node
      const pin = this.add.ellipse(nodeX, nodeY, 10, 10, 0xffd166).setStrokeStyle(2, 0xffc300);
      
      // Avatar/icon
      let nodeIcon: Phaser.GameObjects.GameObject;
      const avatarKey = node.icon_key;
      
      if (this.textures.exists(avatarKey)) {
        const spr = this.add.image(nodeX, nodeY - 18, avatarKey);
        initScale(spr, { x: 0.5, y: 1.0 }, undefined, 64); // 64px display height
        nodeIcon = spr;
      } else {
        const circ = this.add.circle(nodeX, nodeY - 18, 12, 0x88c0d0).setStrokeStyle(2, 0x5e81ac);
        nodeIcon = circ;
      }

      // Node label
      this.add.text(nodeX, nodeY - 58, node.display_name, {
        color: '#ffffff', fontSize: '14px',
      }).setOrigin(0.5);

      nodeElements.set(node.map_node_id, { pin, icon: nodeIcon, x: nodeX, y: nodeY });
      
      // Highlight current node
      if (node.map_node_id === this.currentNodeId) {
        // Tiny idle bob for current node
        this.tweens.add({ 
          targets: nodeIcon, 
          y: (nodeIcon as any).y - 2, 
          duration: 800, 
          yoyo: true, 
          repeat: -1, 
          ease: 'Sine.easeInOut' 
        });
      }
    }

    // Draw paths between nodes
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(3, 0x5e81ac, 0.8);
    
    for (const edge of edges) {
      const fromNode = nodeElements.get(edge.from_node_id);
      const toNode = nodeElements.get(edge.to_node_id);
      
      if (fromNode && toNode) {
        // Simple straight line for now (could be enhanced with curve styles)
        pathGraphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
      }
    }

    // Start Button for current node
    if (currentNode) {
      const startBtnText = await this.dataManager.getString('start_level', 'en');
      const btn = this.add.rectangle(width / 2, height * 0.8, 160, 40, 0x2b2e3b)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });
        
      this.add.text(btn.x, btn.y, startBtnText || 'Start Round', { 
        color: '#ffffff', fontSize: '16px' 
      }).setOrigin(0.5);

      btn.on('pointerup', async () => {
        // Get level configuration from database
        const level = await this.dataManager.getLevel(this.currentNodeId === 'level1' ? 'L001' : 'L002');
        
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          // Pass both legacy and new parameters for compatibility
          this.scene.start('GameplayScene', { 
            land: this.params.land || 1, 
            level: this.params.level || (this.currentNodeId === 'level1' ? 1 : 2),
            level_id: level?.level_id,
            world_id: this.currentWorldId,
            node_id: this.currentNodeId
          });
        });
      });
    }
  }
}