// FILE: src/scenes/WorldMapScene.ts
import Phaser from "phaser";
import { GameDataManager } from '../GameDataManager';
import { mountDom, basicColumn } from '../utils';
import { getCurrentProfile } from '../ProfileStore';
import { showNameOverlay } from '../ui/NameOverlay';
import { DataManager } from '../DataManager';





const MAP_BANNER_SAFE_PX = 70;
const LAND1_BG_KEY = "land1-bg";
const LAND1_BG_URL =
  "https://dxzayhugyjroseetvrye.supabase.co/storage/v1/object/public/game-assets/map/Land%20Map/1A584A40-9EDA-47ED-96DE-2B034FA34E60.PNG";

// --- TYPES -------------------------------------------------------

type MapNodeDef = {
  id: string;
  label: string; // what shows inside the circle ("1", "2", ...)
  xPct: number;  // 0–100: percentage across screen
  yPct: number;  // 0–100: percentage down screen
};

type MapEdgeDef = {
  from: string; // node id
  to: string;   // node id

  /**
   * Curve strength in pixels.
   *  0   = straight line
   *  > 0 = curve to one side
   *  < 0 = curve to opposite side
   */
  bend?: number;
};

type NodePosition = {
  x: number;
  y: number;
  node: MapNodeDef;
};

// --- STATIC LAND 1 DATA -----------------------------------------

const LAND1_NODES: MapNodeDef[] = [
  // Row 1 (bottom)
  { id: "land1_n01", label: "1",  xPct: 25, yPct: 90 },
  { id: "land1_n02", label: "2",  xPct: 45, yPct: 90 },
  { id: "land1_n03", label: "3",  xPct: 52, yPct: 77 },
  { id: "land1_n04", label: "4",  xPct: 73, yPct: 80 },
  { id: "land1_n05", label: "5",  xPct: 86, yPct: 75 },

  // Row 2
  { id: "land1_n06", label: "6",  xPct: 87, yPct: 68 },
  { id: "land1_n07", label: "7",  xPct: 80, yPct: 61 },
  { id: "land1_n08", label: "8",  xPct: 63, yPct: 59 },
  { id: "land1_n09", label: "9",  xPct: 37, yPct: 65 },
  { id: "land1_n10", label: "10", xPct: 17, yPct: 70 },

  // Row 3
  { id: "land1_n11", label: "11", xPct: 40, yPct: 74 },
  { id: "land1_n12", label: "12", xPct: 18, yPct: 63 },
  { id: "land1_n13", label: "13", xPct: 23, yPct: 56 },
  { id: "land1_n14", label: "14", xPct: 20, yPct: 46 },
  { id: "land1_n15", label: "15", xPct: 45, yPct: 48 },

  // Row 4
  { id: "land1_n16", label: "16", xPct: 70, yPct: 51 },
  { id: "land1_n17", label: "17", xPct: 77, yPct: 46 },
  { id: "land1_n18", label: "18", xPct: 58, yPct: 38 },
  { id: "land1_n19", label: "19", xPct: 45, yPct: 38 },
  { id: "land1_n20", label: "20", xPct: 28, yPct: 35 },

  // Row 5 (top)
  { id: "land1_n21", label: "21", xPct: 22, yPct: 27 },
  { id: "land1_n22", label: "22", xPct: 35, yPct: 22 },
  { id: "land1_n23", label: "23", xPct: 52, yPct: 22 },
  { id: "land1_n24", label: "24", xPct: 64, yPct: 25 },
  { id: "land1_n25", label: "25", xPct: 83, yPct: 25 },
];

const LAND1_EDGES: MapEdgeDef[] = [
  { from: "land1_n01", to: "land1_n02", bend: 20 },
  { from: "land1_n02", to: "land1_n03", bend: -27 },
  { from: "land1_n03", to: "land1_n04", bend: 5 },
  { from: "land1_n04", to: "land1_n05", bend: 0 },

  { from: "land1_n05", to: "land1_n06", bend: 10 },
  { from: "land1_n06", to: "land1_n07", bend: -10 },
  { from: "land1_n07", to: "land1_n08", bend: 0 },
  { from: "land1_n08", to: "land1_n09", bend: 15 },
  { from: "land1_n09", to: "land1_n10", bend: 10 },

  { from: "land1_n10", to: "land1_n11", bend: 25 },
  { from: "land1_n11", to: "land1_n12" },
  { from: "land1_n12", to: "land1_n13", bend: 0 },
  { from: "land1_n13", to: "land1_n14", bend: -10 },
  { from: "land1_n14", to: "land1_n15", bend: -7 },

  { from: "land1_n15", to: "land1_n16", bend: 20 },
  { from: "land1_n16", to: "land1_n17", bend: 0 },
  { from: "land1_n17", to: "land1_n18", bend: 14 },
  { from: "land1_n18", to: "land1_n19", bend: 0 },
  { from: "land1_n19", to: "land1_n20", bend: -5 },

  { from: "land1_n20", to: "land1_n21", bend: -22 },
  { from: "land1_n21", to: "land1_n22", bend: -5 },
  { from: "land1_n22", to: "land1_n23", bend: -4 },
  { from: "land1_n23", to: "land1_n24", bend: -5 },
  { from: "land1_n24", to: "land1_n25", bend: 4 },
];

// --- SCENE -------------------------------------------------------

export class WorldMapScene extends Phaser.Scene {
  private nodeDots: Record<string, Phaser.GameObjects.Arc> = {};
  private edgesGraphics?: Phaser.GameObjects.Graphics;
  private menuDom?: Phaser.GameObjects.DOMElement;  // ← add this
  private nodePositions: Record<string, NodePosition> = {};

  // Player token data
  private playerDot?: Phaser.GameObjects.Arc;
  private ruutSprite?: Phaser.GameObjects.Sprite;
  private currentNodeId: string = "land1_n01";
  private isMoving: boolean = false;
  private readonly playerYOffset: number = -24;

  private livesIcons: Phaser.GameObjects.Image[] = [];
  private nodeLayer?: Phaser.GameObjects.Container;
  private awningLayer?: Phaser.GameObjects.Container;



  private completedNodes = new Set<string>();

  private outOfLivesGroup?: Phaser.GameObjects.Container;




  // Popup state
  private selectedNode: MapNodeDef | null = null;
  private levelPopupGroup?: Phaser.GameObjects.Container;
  private gameData!: GameDataManager;


  constructor() {
    super("WorldMapScene");
  }

  /**
   * data?: {
   *   fromLevelLabel?: number | string; // level just completed
   *   autoAdvance?: boolean;            // auto-walk to next node if true
   * }
   */
   create(data?: { fromLevelLabel?: number | string; autoAdvance?: boolean }) {
    // Reset popup/movement
    this.selectedNode = null;
    this.levelPopupGroup = undefined;
    this.isMoving = false;
    this.cameras.main.setViewport(
      0,
      0,
      this.scale.width,
      this.scale.height - MAP_BANNER_SAFE_PX
    );
    
  
    // ⭐ init game data FIRST (used by drawStaticLand1)
    this.gameData = GameDataManager.getInstance();
  
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x14532d);
  
    // Background image + trees
    this.drawBackgroundImage();
    // this.drawBackgroundTrees(width, height);

    // NEW: draw lives HUD at top using player_state.lives
  this.drawLivesHud();
  
    // Title
    this.add
      .text(width / 2, 32, "Land 1 Map", {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  
    // Back button
    const backBtn = this.add
      .text(24, 24, "Back", {
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "16px",
        color: "#9ca3af",
      })
      .setInteractive({ useHandCursor: true });
  
    backBtn.on("pointerup", () => {
      this.closeLevelPopup();
      this.scene.start("TitleScreen");
    });
  
    // If we arrived here from a completed level, mark it BEFORE drawing
    if (data?.fromLevelLabel != null) {
      const labelStr = String(data.fromLevelLabel);
      const node = LAND1_NODES.find((n) => n.label === labelStr);
      if (node) {
        // ✅ mark this node as completed
        this.completedNodes.add(node.id);
        // place the token here for spawn
        this.currentNodeId = node.id;
      }
    }
  
    // Now draw paths + nodes (uses completedNodes + gameData)
    this.drawStaticLand1();
  
    // Spawn player token at current node
    this.initPlayerToken();
  
    // If autoAdvance is requested, walk to the next node in sequence
    if (data?.fromLevelLabel != null && data.autoAdvance) {
      const labelStr = String(data.fromLevelLabel);
      const nodeIndex = LAND1_NODES.findIndex((n) => n.label === labelStr);
      const nextIndex = nodeIndex + 1;
      if (nodeIndex !== -1 && nextIndex < LAND1_NODES.length) {
        const nextNode = LAND1_NODES[nextIndex];
        // Give a small delay so spawn is visible
        this.time.delayedCall(400, () => {
          this.movePlayerToNode(nextNode);
        });
      }
    }

    this.createMenuButton();


    // 👇 One-time name overlay gate (now passes data)
    this.checkNameOverlayGate(data);

    // Handle resize
    this.scale.on("resize", this.handleResize, this);

    const layout = () => {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
    
      // Recompute map bounds + any safe-anchored HUD
      // If you already have a menu button created, ensure it uses safe rect:
      // this.menuText.setPosition(safe.right - 8, safe.top + 8);
    
      // If your nodes are positioned in percentages, re-draw land or refresh node positions here:
      // this.refreshMapLayout?.();
    };
    
    layout();
    
    this.scale.on('resize', layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', layout);
    });
    


  }
  

  private createMenuButton(): void {
    const menuText = this.add.text(this.cameras.main.width - 16, 16, '≡', {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
  
    menuText.on('pointerup', () => {
      this.openMapMenu();
    });
  }
  
  private openMapMenu(): void {
    if (this.menuDom) return;
  
    // Full-screen overlay that closes when you click outside the panel
    const html = `
      <div id="menu-overlay" style="
        position:absolute;inset:0;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.35);
        pointer-events:auto;
      ">
        <div id="menu-panel" style="
          background:rgba(15,23,42,0.92);
          padding:16px 20px;border-radius:12px;min-width:240px;
          box-shadow:0 12px 30px rgba(0,0,0,0.35);
        ">
          <h2 style="margin:0 0 12px 0;font-size:18px;">Map Menu</h2>
  
          <button id="btn-resume" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
            Close
          </button>
  
          <button id="btn-settings" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
            Settings
          </button>
  
          <button id="btn-store" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
            Store
          </button>
  
          <button id="btn-exit-title" style="display:block;width:100%;margin-bottom:8px;padding:8px 12px;">
            Exit to Title
          </button>
  
          <button id="btn-logout" style="display:block;width:100%;padding:8px 12px;">
            Logout
          </button>
        </div>
      </div>
    `;
  
    const { dom, el } = mountDom(this, html);
    this.menuDom = dom;
  
    const overlay = el.querySelector<HTMLDivElement>('#menu-overlay')!;
    const panel = el.querySelector<HTMLDivElement>('#menu-panel')!;
  
    const resumeBtn = el.querySelector<HTMLButtonElement>('#btn-resume')!;
    const settingsBtn = el.querySelector<HTMLButtonElement>('#btn-settings')!;
    const storeBtn = el.querySelector<HTMLButtonElement>('#btn-store')!;
    const exitTitleBtn = el.querySelector<HTMLButtonElement>('#btn-exit-title')!;
    const logoutBtn = el.querySelector<HTMLButtonElement>('#btn-logout')!;
  
    const closeMenu = () => {
      this.menuDom?.destroy();
      this.menuDom = undefined;
    };
  
    // Click outside closes
    overlay.onclick = () => closeMenu();
    // Click inside should NOT close
    panel.onclick = (ev) => ev.stopPropagation();
  
    const openStub = (title: string) => {
      const stubHtml = `
        <div id="stub-overlay" style="
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.35);pointer-events:auto;
        ">
          <div id="stub-panel" style="background:rgba(15,23,42,0.92);padding:16px 20px;border-radius:12px;min-width:240px;">
            <h2 style="margin:0 0 10px 0;font-size:18px;">${title}</h2>
            <div style="opacity:.85;margin:0 0 12px 0;">Coming soon.</div>
            <button id="stub-close" style="display:block;width:100%;padding:8px 12px;">Close</button>
          </div>
        </div>
      `;
      const stub = mountDom(this, stubHtml);
      const stubOverlay = stub.el.querySelector<HTMLDivElement>('#stub-overlay')!;
      const stubPanel = stub.el.querySelector<HTMLDivElement>('#stub-panel')!;
      const closeBtn = stub.el.querySelector<HTMLButtonElement>('#stub-close')!;
  
      stubOverlay.onclick = () => stub.dom.destroy();
      stubPanel.onclick = (ev) => ev.stopPropagation();
      closeBtn.onclick = () => stub.dom.destroy();
    };
  
    resumeBtn.onclick = () => closeMenu();
    settingsBtn.onclick = () => openStub('Settings');
    storeBtn.onclick = () => openStub('Store');
  
    exitTitleBtn.onclick = () => {
      closeMenu();
      this.scene.stop();
      this.scene.start('TitleScreen');
    };
  
    logoutBtn.onclick = () => {
      closeMenu();
      const dm = DataManager.getInstance();
      dm.logout();
      this.scene.stop();
      this.scene.start('TitleScreen');
    };
  
    // Safety: if scene shuts down while menu is open, remove it
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeMenu());
  }
  
  
  

  private async loseLifeAndReturnToMap(): Promise<void> {
    const dataManager = DataManager.getInstance();
    const playerState = dataManager.getCachedPlayerState?.() ?? null;
  
    const DEFAULT_MAX_LIVES = 3;
    const DEFAULT_MAX_HEARTS = 4;
  
    const maxLives = playerState?.max_lives ?? DEFAULT_MAX_LIVES;
    const currentLivesRaw = playerState?.lives ?? maxLives;
    const newLives = Math.max(0, currentLivesRaw - 1);
  
    const maxHearts =
      playerState?.max_hearts ?? (this.heartSlots || DEFAULT_MAX_HEARTS);
  
    // ✅ Update locally (cache) immediately so UI reflects instantly
    dataManager.setCachedPlayerState?.({
      ...(playerState ?? {
        player_id: dataManager.getPlayerId?.() ?? '',
        current_level_id: '',
        current_node_id: '',
        unlocked_nodes: '',
        currency: 0,
        flags: {},
      }),
      lives: newLives,
      max_lives: maxLives,
      hearts: maxHearts,
      max_hearts: maxHearts,
    });
  
    // ✅ Then persist to Supabase
    await dataManager.updatePlayerState({
      lives: newLives,
      max_lives: maxLives,
      hearts: maxHearts,
      max_hearts: maxHearts,
    });
  
    this.closeLivesModal();
    this.scene.start('WorldMapScene', { land: 1, level: 1 });
  }
  


  
  

    // Get the level key for a map node
private getLevelKeyForNode(node: MapNodeDef): string {
  // Land 1 map → land = 1
  const land = 1;
  const level = Number(node.label); // "1", "2", "3", ...
  return this.gameData.getLevelKey(land, level);
}

  // --- NAME OVERLAY GATE -----------------------------------------

  /**
   * One-time gate for the name overlay.
   * We show it when:
   *  - A profile exists
   *  - The name is NOT locked
   *  - We either just came from tutorial 2, OR
   *    we are at/after Land 1, Level 3 (first non-tutorial level)
   */
   private checkNameOverlayGate(data?: { fromLevelLabel?: number | string; autoAdvance?: boolean }): void {
    const profile = getCurrentProfile();
    if (!profile) {
      console.log('[NameGate] No profile loaded; skipping overlay');
      return;
    }

    const meta = profile.meta ?? {};
    const nameLocked = !!meta.name_locked;

    if (nameLocked) {
      console.log('[NameGate] Name already locked; skipping overlay');
      return;
    }

    // 1) Did we just come from tutorial level 2?
    const fromLabel = data?.fromLevelLabel;
    const cameFromTutorial2 = fromLabel === 2 || fromLabel === '2';

    // 2) Fallback: look at GameDataManager land/level,
    //    in case the player resumes later.
    let land = 1;
    let level = 1;
    try {
      if (typeof this.gameData.getLand === 'function') {
        land = this.gameData.getLand();
      }
      if (typeof this.gameData.getLevel === 'function') {
        level = this.gameData.getLevel();
      }
    } catch (e) {
      console.log('[NameGate] Could not read land/level from GameDataManager');
    }

    const isAfterSecondTutorial = (land === 1 && level >= 3);

    console.log(
      '[NameGate] land/level from GameData:',
      land,
      level,
      'cameFromTutorial2:',
      cameFromTutorial2
    );

    if (!cameFromTutorial2 && !isAfterSecondTutorial) {
      console.log('[NameGate] Not past tutorial 2 yet; skipping overlay');
      return;
    }

    console.log('[NameGate] Showing name overlay...');
    showNameOverlay(this, profile, { reason: 'post_tutorial' });
  }


  

  // --- RESIZE HANDLER --------------------------------------------

  private handleResize() {
    this.scene.restart();
  }

  // --- BACKGROUND IMAGE ------------------------------------------

  private drawBackgroundImage() {
    const { width, height } = this.scale;

    const placeBg = () => {
      const bg = this.add.image(width / 2, (height / 2) - MAP_BANNER_SAFE_PX, LAND1_BG_KEY);
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
      bg.setDepth(-20);
    };

    if (this.textures.exists(LAND1_BG_KEY)) {
      placeBg();
      return;
    }

    this.load.image(LAND1_BG_KEY, LAND1_BG_URL);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      placeBg();
    });
    this.load.start();
  }

  // --- PLAYER TOKEN ----------------------------------------------

  private initPlayerToken() {
    const pos = this.nodePositions[this.currentNodeId];
    if (!pos) return;

    // Underlying logical dot (can stay invisible)
    this.playerDot = this.add.circle(
      pos.x,
      pos.y + this.playerYOffset,
      10,
      0xfff176
    );
    this.playerDot.setDepth(5);
    this.playerDot.setVisible(false); // hide yellow dot, Ruut replaces it

    // Ruut walk animation (create once)
    if (!this.anims.exists("ruut_walk_right")) {
      this.anims.create({
        key: "ruut_walk_right",
        frames: this.anims.generateFrameNumbers("ruut_walk", {
          start: 0,
          end: 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Ruut sprite sitting where the dot is
    this.ruutSprite = this.add
      .sprite(this.playerDot.x, this.playerDot.y, "ruut_walk", 0)
      .setOrigin(0.5, 0.9)
      .setScale(0.35 * 0.7) // side scaling
      .setDepth(7); // above pins/edges

    this.ruutSprite.play("ruut_walk_right");
  }

  private movePlayerToNode(targetNode: MapNodeDef) {
    if (!this.playerDot) {
      this.currentNodeId = targetNode.id;
      this.initPlayerToken();
      this.openLevelPopup(targetNode);
      return;
    }

    if (this.isMoving) {
      return;
    }

    if (targetNode.id === this.currentNodeId) {
      this.openLevelPopup(targetNode);
      return;
    }

    const path = this.findPath(this.currentNodeId, targetNode.id);
    if (!path || path.length < 2) {
      this.openLevelPopup(targetNode);
      return;
    }

    // SPEED LOGIC:
    // path.length = number of nodes visited (N nodes = N-1 edges)
    const totalNodes = path.length;
    const speedMultiplier = totalNodes >= 11 ? 1 : 8; // <=10 nodes → 8x slower

    this.isMoving = true;
    this.moveAlongPath(path, 0, targetNode, speedMultiplier);
  }

  private drawLivesHud() {
    const dataManager = DataManager.getInstance();
    const playerState = dataManager.getCachedPlayerState();
  
    const DEFAULT_MAX_LIVES = 3;
    const maxLives = playerState?.max_lives ?? DEFAULT_MAX_LIVES;
    const lives = playerState?.lives ?? maxLives;
  
    // Clear any prior icons
    this.livesIcons.forEach(icon => icon.destroy());
    this.livesIcons = [];
  
    const topY = 40;   // tweak as needed
    const startX = 40;
    const spacing = 40;
  
    // For now: draw one small Ruut sprite per *current* life
    const count = Math.max(0, Math.min(lives, maxLives));
  
    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
  
      const icon = this.add
        .sprite(x, topY, 'ruut_walk', 0) // reuse existing ruut sprite/frame 0
        .setScale(0.25)                  // smaller
        .setOrigin(0.5, 1);
  
      this.livesIcons.push(icon);
    }
  }
  

  // --- PATHFINDING (BFS over edges as undirected, but only ±1 labels) -----

private findPath(startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId];

  const neighbors: Record<string, Set<string>> = {};

  // Build adjacency, but ONLY for edges whose labels differ by exactly 1
  LAND1_EDGES.forEach((edge) => {
    const fromNode = LAND1_NODES.find((n) => n.id === edge.from);
    const toNode   = LAND1_NODES.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return;

    const a = Number(fromNode.label);
    const b = Number(toNode.label);
    const labelsAreNumeric = !Number.isNaN(a) && !Number.isNaN(b);
    const areConsecutive   = labelsAreNumeric && Math.abs(a - b) === 1;

    // If labels aren't numeric, fall back to including the edge (safety).
    if (!labelsAreNumeric || areConsecutive) {
      if (!neighbors[edge.from]) neighbors[edge.from] = new Set();
      if (!neighbors[edge.to])   neighbors[edge.to]   = new Set();
      neighbors[edge.from].add(edge.to);
      neighbors[edge.to].add(edge.from);
    }
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous: Record<string, string | null> = { [startId]: null };

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) break;

    const nbrs = neighbors[current] || new Set<string>();
    for (const next of nbrs) {
      if (!visited.has(next)) {
        visited.add(next);
        previous[next] = current;
        queue.push(next);
      }
    }
  }

  if (!visited.has(endId)) {
    return null;
  }

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.push(cur);
    cur = previous[cur] ?? null;
  }
  path.reverse();
  return path;
}


  // --- MOVE ALONG MULTI-EDGE PATH -------------------------------

  private moveAlongPath(
    path: string[],
    index: number,
    finalNode: MapNodeDef,
    speedMultiplier: number
  ) {
    if (index >= path.length - 1) {
      this.isMoving = false;
      this.currentNodeId = finalNode.id;

      const finalPos = this.nodePositions[finalNode.id];
      if (finalPos) {
        if (this.playerDot) {
          this.playerDot.x = finalPos.x;
          this.playerDot.y = finalPos.y + this.playerYOffset;
        }
        if (this.ruutSprite) {
          this.ruutSprite.x = finalPos.x;
          this.ruutSprite.y = finalPos.y + this.playerYOffset;
        }
      }

      this.openLevelPopup(finalNode);
      return;
    }

    const fromId = path[index];
    const toId = path[index + 1];

    this.tweenAlongCurve(fromId, toId, speedMultiplier, () => {
      this.currentNodeId = toId;
      this.moveAlongPath(path, index + 1, finalNode, speedMultiplier);
    });
  }

  // --- TWEEN ALONG EXACT DRAWN CURVE -----------------------------

  /**
   * Tween the player along the *same* sin-wave curve used
   * to draw the edge, regardless of travel direction.
   * Ruut simply rides the same curve (with Y offset).
   */
  private tweenAlongCurve(
    fromId: string,
    toId: string,
    speedMultiplier: number,
    onComplete: () => void
  ) {
    if (!this.playerDot) {
      onComplete();
      return;
    }

    const fromPos = this.nodePositions[fromId];
    const toPos = this.nodePositions[toId];
    if (!fromPos || !toPos) {
      onComplete();
      return;
    }

    // Snap to node center (no offset while traveling)
    this.playerDot.x = fromPos.x;
    this.playerDot.y = fromPos.y;

    // Direction for Ruut's facing (base art faces right)
    if (this.ruutSprite) {
      const goingRight = toPos.x >= fromPos.x;
      this.ruutSprite.setFlipX(!goingRight);
      this.ruutSprite.x = fromPos.x;
      this.ruutSprite.y = fromPos.y + this.playerYOffset;
    }

    // 1) Find the edgeDef and its *drawing orientation*
    const edgeDefForward = LAND1_EDGES.find(
      (e) => e.from === fromId && e.to === toId
    );
    const edgeDefBackward = LAND1_EDGES.find(
      (e) => e.from === toId && e.to === fromId
    );

    let edgeDef: MapEdgeDef | undefined;
    let travelingForward: boolean;

    if (edgeDefForward) {
      edgeDef = edgeDefForward;
      travelingForward = true;
    } else if (edgeDefBackward) {
      edgeDef = edgeDefBackward;
      travelingForward = false;
    } else {
      // No curve data: straight line fallback
      const targets: any[] = [this.playerDot];
      if (this.ruutSprite) targets.push(this.ruutSprite);

      this.tweens.add({
        targets,
        x: toPos.x,
        y: (target: any) =>
          target === this.playerDot ? toPos.y : toPos.y + this.playerYOffset,
        duration: 500 * speedMultiplier,
        ease: "Sine.inOut",
        onComplete: () => {
          this.playerDot!.setPosition(toPos.x, toPos.y);
          if (this.ruutSprite) {
            this.ruutSprite.setPosition(
              toPos.x,
              toPos.y + this.playerYOffset
            );
          }
          onComplete();
        },
      });
      return;
    }

    const DEFAULT_BEND = 32;
    const bend = edgeDef.bend ?? DEFAULT_BEND;

    const fromDrawPos = this.nodePositions[edgeDef.from];
    const toDrawPos = this.nodePositions[edgeDef.to];
    if (!fromDrawPos || !toDrawPos) {
      onComplete();
      return;
    }

    const x1 = fromDrawPos.x;
    const y1 = fromDrawPos.y;
    const x2 = toDrawPos.x;
    const y2 = toDrawPos.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const nx = -dy / len;
    const ny = dx / len;

    const baseDuration = 500;
    const distanceFactor = Phaser.Math.Clamp(len / 400, 0.5, 2);
    const duration = baseDuration * distanceFactor * speedMultiplier;

    const travel = { t: 0 };

    this.tweens.add({
      targets: travel,
      t: 1,
      duration,
      ease: "Sine.inOut",
      onUpdate: () => {
        let t = travel.t;

        // Preserve original "travelingForward" behavior
        if (!travelingForward) {
          t = 1 - t;
        }

        const baseX = x1 + dx * t;
        const baseY = y1 + dy * t;

        const wave = Math.sin(Math.PI * t);
        const offset = bend * wave;

        const px = baseX + nx * offset;
        const py = baseY + ny * offset;

        // Dot follows exactly as before
        this.playerDot!.setPosition(px, py);

        // Ruut rides the same curve, with Y offset
        if (this.ruutSprite) {
          this.ruutSprite.setPosition(px, py + this.playerYOffset);
        }
      },
      onComplete: () => {
        this.playerDot!.setPosition(toPos.x, toPos.y);
        if (this.ruutSprite) {
          this.ruutSprite.setPosition(
            toPos.x,
            toPos.y + this.playerYOffset
          );
        }
        onComplete();
      },
    });
  }

  // --- Draw static Land 1 with curved-ish paths ------------------

  private drawStaticLand1() {
    const { width, height } = this.scale;
  
    if (this.edgesGraphics) this.edgesGraphics.destroy();
    Object.values(this.nodeDots).forEach((dot) => dot.destroy());
    // --- Layers (ensure correct stacking everywhere) ---
if (this.nodeLayer) this.nodeLayer.destroy(true);
if (this.awningLayer) this.awningLayer.destroy(true);

this.nodeLayer = this.add.container(0, 0).setDepth(4);   // nodes + labels
this.awningLayer = this.add.container(0, 0).setDepth(5); // stars/diamond ALWAYS above nodes

    this.nodeDots = {};
    this.nodePositions = {};

    const makeStarPolygon = (
  cx: number,
  cy: number,
  spikes: number,
  innerR: number,
  outerR: number,
  rotationDeg = -90
) => {
  const pts: number[] = [];
  const rot = Phaser.Math.DegToRad(rotationDeg);
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = rot + i * step;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
};

  
    // 1️⃣ Percentage-based positions
    for (const n of LAND1_NODES) {
      const x = (n.xPct / 100) * width;
      const y = (n.yPct / 100) * height - MAP_BANNER_SAFE_PX;
      this.nodePositions[n.id] = { x, y, node: n };
    }
  
    // 2️⃣ Draw edges
    const g = this.add.graphics();
    g.clear();
  
    const nodeRadius = 20;
    const DEFAULT_THICKNESS_FACTOR = 0.5;
    const DEFAULT_BEND = 32;
    const segments = 12;
    const tanColor = 0xe5c38b;
  
    LAND1_EDGES.forEach((edge) => {
      const from = this.nodePositions[edge.from];
      const to = this.nodePositions[edge.to];
      if (!from || !to) return;
  
      const x1 = from.x;
      const y1 = from.y;
      const x2 = to.x;
      const y2 = to.y;
  
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
      const nx = -dy / len;
      const ny = dx / len;
  
      const bend = edge.bend ?? DEFAULT_BEND;
  
      const edgeThickness = nodeRadius * 2 * DEFAULT_THICKNESS_FACTOR;
      g.lineStyle(edgeThickness, tanColor, 0.95);
  
      g.beginPath();
  
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
  
        const baseX = x1 + dx * t;
        const baseY = y1 + dy * t;
  
        const wave = Math.sin(Math.PI * t);
        const offset = bend * wave;
  
        const px = baseX + nx * offset;
        const py = baseY + ny * offset;
  
        if (i === 0) {
          g.moveTo(px, py);
        } else {
          g.lineTo(px, py);
        }
      }
  
      g.strokePath();
    });
  
    this.edgesGraphics = g;
  
    // 3️⃣ Clickable nodes + awning locked to node (with 20% bigger underlayer)
for (const n of LAND1_NODES) {
  const pos = this.nodePositions[n.id];
  if (!pos) continue;

  const isCompleted = this.completedNodes.has(n.id);
  const baseColor = isCompleted ? 0x166534 : 0x1a2a3f;

  // ⭐ Look up best stars + diamond
  let bestStars = 0;
  let bestDiamond = false;

  if (this.gameData) {
    const levelKey = this.getLevelKeyForNode(n);
    bestStars = this.gameData.getLevelStars(levelKey);
    if (typeof (this.gameData as any).getLevelDiamond === "function") {
      bestDiamond = (this.gameData as any).getLevelDiamond(levelKey) === true;
    }
  }

  const isCurrent = n.id === this.currentNodeId;

  // --- Node container (node + label) ---
  const unit = this.add.container(pos.x, pos.y);
  unit.setDepth(0); // depth handled by nodeLayer
  this.nodeLayer!.add(unit);

  // --- Awning container (stars/diamond) ---
  const awningUnit = this.add.container(pos.x, pos.y);
  awningUnit.setDepth(0); // depth handled by awningLayer
  this.awningLayer!.add(awningUnit);

  // --- Geometry (local coordinates) ---
  const nodeRadiusLocal = 20;
  const arcRadius = nodeRadiusLocal + 12;
  const baseAngle = -90;
  const spread = 30;

  const U = 1.2; // 20% bigger underlayer
  const underAlpha = isCurrent ? 0.9 : 0.55;
  const underThickness = isCurrent ? 4 : 3;

  // --- UNDERLAYER: node circle (white stroke) ---
  const underNode = this.add.circle(0, 0, nodeRadiusLocal * U, 0x000000, 0);
  underNode.setStrokeStyle(underThickness, 0xffffff, underAlpha);
  unit.add(underNode);

  // --- ACTIVE: node circle (interactive) ---
  const circle = this.add.circle(0, 0, nodeRadiusLocal, baseColor);
  circle.setInteractive({ useHandCursor: true });
  unit.add(circle);

  // store reference like before
  this.nodeDots[n.id] = circle as any;

  // --- UNDERLAYER + ACTIVE: awning (always above nodes) ---
  if (bestDiamond) {
    const DIAMOND_SIZE = 30;
    const DIAMOND_Y_OFFSET = 7;

    const angleRad = Phaser.Math.DegToRad(baseAngle);
    const dx = arcRadius * Math.cos(angleRad);
    const dy = arcRadius * Math.sin(angleRad) + DIAMOND_Y_OFFSET;

    // Underlayer diamond (bigger, white)
    const underDiamond = this.add.text(dx, dy, "💎", {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: `${Math.round(DIAMOND_SIZE * U)}px`,
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    underDiamond.setAlpha(underAlpha);
    awningUnit.add(underDiamond);

    // Active diamond
    const diamondIcon = this.add.text(dx, dy, "💎", {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: `${DIAMOND_SIZE}px`,
      color: "#7dd3fc",
      fontStyle: "bold",
    }).setOrigin(0.5);
    awningUnit.add(diamondIcon);

    // Diamond tweens
    this.tweens.add({
      targets: diamondIcon,
      scale: { from: 1.0, to: 1.15 },
      duration: 650,
      yoyo: true,
      repeatDelay: 2000,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.tweens.add({
      targets: diamondIcon,
      alpha: { from: 1.0, to: 0.75 },
      duration: 320,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1300,
      ease: "Sine.inOut",
      delay: 120,
    });

    this.tweens.add({
      targets: diamondIcon,
      angle: { from: -2, to: 2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1100,
      ease: "Sine.inOut",
    });

  } else {
    // Stars default awning (ALL levels show them, dim when unearned)
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * spread;
      const angleRad = Phaser.Math.DegToRad(baseAngle + offset);

      const sx = arcRadius * Math.cos(angleRad);
      const sy = arcRadius * Math.sin(angleRad);

      const filled = i < bestStars;
      const fillColor = filled ? 0xffd54f : 0x303848;
      const strokeColor = filled ? 0x000000 : 0x555555;

      // Underlayer star (bigger, white stroke)
      const underStar = this.add.star(sx, sy, 5, 4 * U, 7 * U, 0x000000, 0);
      underStar.setStrokeStyle(underThickness, 0xffffff, underAlpha);
      awningUnit.add(underStar);

      // Active star
      const star = this.add.star(sx, sy, 5, 4, 7, fillColor);
      star.setStrokeStyle(1, strokeColor, 0.85);
      awningUnit.add(star);
    }
  }

  // --- Label ---
  const label = this.add.text(0, 0, n.label, {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "16px",
    color: "#ffffff",
  }).setOrigin(0.5);
  unit.add(label);

  // ✅ Keep original movement behavior (ruut walks edge)
  circle.on("pointerup", () => {
    this.movePlayerToNode(n);
  });
}


  }
  

  // --- Optional decoration trees ---------------------------------

  private drawBackgroundTrees(width: number, height: number) {
    const g = this.add.graphics();
    g.setDepth(-5);

    const pineSpots = [
      { x: width * 0.15, y: height * 0.8, scale: 2.0 },
      { x: width * 0.3,  y: height * 0.7, scale: 1.7 },
      { x: width * 0.7,  y: height * 0.78, scale: 2.1 },
      { x: width * 0.85, y: height * 0.68, scale: 1.8 },
      { x: width * 0.4,  y: height * 0.55, scale: 1.6 },
      { x: width * 0.65, y: height * 0.45, scale: 1.5 },
    ];

    const roundSpots = [
      { x: width * 0.2,  y: height * 0.6,  scale: 1.4 },
      { x: width * 0.55, y: height * 0.75, scale: 1.8 },
      { x: width * 0.8,  y: height * 0.52, scale: 1.5 },
      { x: width * 0.35, y: height * 0.4,  scale: 1.3 },
    ];

    pineSpots.forEach((p) => this.drawPineTree(g, p.x, p.y, p.scale));
    roundSpots.forEach((p) => this.drawRoundTree(g, p.x, p.y, p.scale));
  }

  private drawPineTree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number
  ) {
    const s = scale;
    const trunkWidth = 4 * s;
    const trunkHeight = 8 * s;

    g.fillStyle(0x4b3b2a, 1);
    g.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);

    g.fillStyle(0x14532d, 1);
    g.fillRect(x - 8 * s, y - trunkHeight - 4 * s, 16 * s, 4 * s);

    g.fillStyle(0x166534, 1);
    g.fillRect(x - 6 * s, y - trunkHeight - 8 * s, 12 * s, 4 * s);

    g.fillStyle(0x16a34a, 1);
    g.fillRect(x - 4 * s, y - trunkHeight - 12 * s, 8 * s, 4 * s);
  }

  private drawRoundTree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number
  ) {
    const s = scale;
    const trunkWidth = 3 * s;
    const trunkHeight = 6 * s;

    g.fillStyle(0x4b3b2a, 1);
    g.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);

    g.fillStyle(0x15803d, 1);
    g.fillRect(x - 7 * s, y - trunkHeight - 5 * s, 6 * s, 6 * s);
    g.fillRect(x + 1 * s, y - trunkHeight - 5 * s, 6 * s, 6 * s);

    g.fillStyle(0x16a34a, 1);
    g.fillRect(x - 3 * s, y - trunkHeight - 7 * s, 6 * s, 6 * s);

    g.fillStyle(0x22c55e, 1);
    g.fillRect(x - 2 * s, y - trunkHeight - 3 * s, 4 * s, 4 * s);
  }


  private closeOutOfLivesPopup() {
    if (this.outOfLivesGroup) {
      this.outOfLivesGroup.destroy(true);
      this.outOfLivesGroup = undefined;
    }
  }
  
  private openOutOfLivesPopup() {
    this.closeLevelPopup(); // close begin/cancel popup if open
  
    if (this.outOfLivesGroup) {
      this.outOfLivesGroup.setVisible(true);
      return;
    }
  
    const dm = DataManager.getInstance();
    const ps = dm.getCachedPlayerState();
  
    const flags = ps?.flags ?? {};
    const progress = Number(flags.lives_ad_progress ?? 0); // 0..3
  
    const { width, height } = this.scale;
  
    const bg = this.add
      .rectangle(width / 2, height / 2, Math.min(360, width * 0.86), 220, 0x000000, 0.82)
      .setStrokeStyle(2, 0xffffff);
  
    const title = this.add
      .text(width / 2, height / 2 - 80, "Out of Lives", {
        fontSize: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  
    const subtitle = this.add
      .text(width / 2, height / 2 - 45, "Watch ad to replenish a life, or upgrade Power Pack.", {
        fontSize: "20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#d1d5db",
        align: "center",
        wordWrap: { width: Math.min(360, width * 0.86) - 40 },
      })
      .setOrigin(0.5);
  
    const progressText = this.add
      .text(width / 2, height / 2 - 15, `Ad progress: ${progress} / 3`, {
        fontSize: "14px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#facc15",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  
    const watchBtn = this.add
      .text(width / 2 - 110, height / 2 + 45, "Watch Ad", {
        fontSize: "18px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#22c55e",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  
    const buyBtn = this.add
      .text(width / 2, height / 2 + 45, "Upgrade", {
        fontSize: "18px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#60a5fa",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  
    const waitBtn = this.add
      .text(width / 2 + 110, height / 2 + 45, "Return", {
        fontSize: "18px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#9ca3af",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  
    // Wire behavior
    watchBtn.on("pointerup", async () => {
      const cur = dm.getCachedPlayerState();
      const curFlags = cur?.flags ?? {};
      const curProgress = Number(curFlags.lives_ad_progress ?? 0);
      const nextProgress = Math.min(3, curProgress + 1);
  
      // If they reach 3, grant 1 life and reset progress
      const maxLives = cur?.max_lives ?? 3;
      const newLives = nextProgress >= 3 ? Math.min(maxLives, 1) : (cur?.lives ?? 0);
      const newProgress = nextProgress >= 3 ? 0 : nextProgress;
  
      await dm.updatePlayerState({
        lives: newLives,
        flags: { ...curFlags, lives_ad_progress: newProgress },
      });
  
      progressText.setText(`Ad progress: ${newProgress} / 3`);
      this.drawLivesHud();
  
      // If revived, close modal so they can press Begin again
      if (newLives > 0) this.closeOutOfLivesPopup();
    });
  
    buyBtn.on("pointerup", () => {
      // Store not wired yet — leave as stub for now
      alert("Purchase flow not wired yet.");
    });
  
    waitBtn.on("pointerup", () => {
      this.closeOutOfLivesPopup();
    });
  
    const group = this.add.container(0, 0, [
      bg,
      title,
      subtitle,
      progressText,
      watchBtn,
      buyBtn,
      waitBtn,
    ]);
    group.setDepth(10000);
  
    this.outOfLivesGroup = group;
  }
  

  // --- POPUP: "Begin Level?" -------------------------------------

  private openLevelPopup(node: MapNodeDef) {
    this.selectedNode = node;

    if (this.levelPopupGroup) {
      this.levelPopupGroup.destroy(true);
      this.levelPopupGroup = undefined;
    }

    const { width, height } = this.scale;
    const levelLabel = node.label ?? "?";

        // ⭐ Look up best stars for this node
        const levelKey = this.getLevelKeyForNode(node);
        const bestStars = this.gameData.getLevelStars(levelKey); // 0–3

        // 💎 Diamond flag for this level (guarded so it won't crash if method doesn't exist)
const bestDiamond =
  (typeof (this.gameData as any).getLevelDiamond === "function")
    ? (this.gameData as any).getLevelDiamond(levelKey) === true
    : false;

    

    const bg = this.add
      .rectangle(
        width / 2,
        height / 2,
        Math.min(320, width * 0.8),
        180,
        0x000000,
        0.8
      )
      .setStrokeStyle(2, 0xffffff);

    const title = this.add
      .text(width / 2, height / 2 - 50, `Level ${levelLabel}`, {
        fontSize: "24px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
      })
      .setOrigin(0.5);

          // ⭐ Star/Diamond awning above the title
const starAwning: Phaser.GameObjects.Text[] = [];
const starY = title.y - 28;
const baseX = title.x;
const gap = 26;

if (bestDiamond === true) {
  // 💎 If this level has Diamond, show ONLY a Diamond badge (no stars)
  const diamondText = this.add.text(
    baseX,
    starY,
    "💎",
    {
      fontSize: "50px",
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: "#7dd3fc", // icy blue
      fontStyle: "bold",
    }
  ).setOrigin(0.5);

  starAwning.push(diamondText);
} else {
  // ⭐ Otherwise show normal stars
  for (let i = 0; i < 3; i++) {
    const star = this.add.text(
      baseX + (i - 1) * gap,
      starY,
      "★",
      {
        fontSize: "20px",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        color: i < bestStars ? "#facc15" : "#9ca3af",
      }
    ).setOrigin(0.5);

    starAwning.push(star);
  }
}



    const subtitle = this.add
      .text(
        width / 2,
        height / 2 - 10,
        "Begin this level with your current loadout?",
        {
          fontSize: "14px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#d1d5db",
          align: "center",
          wordWrap: { width: Math.min(320, width * 0.8) - 40 },
        }
      )
      .setOrigin(0.5);

    const beginBtn = this.add
      .text(width / 2 - 60, height / 2 + 40, "Begin", {
        fontSize: "18px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#22c55e",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const cancelBtn = this.add
      .text(width / 2 + 60, height / 2 + 40, "Cancel", {
        fontSize: "18px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#9ca3af",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const group = this.add.container(0, 0, [
      bg,
      ...starAwning,   // ⭐ new star awning
      title,
      subtitle,
      beginBtn,
      cancelBtn,
    ]);
    group.setDepth(9999);
    

    beginBtn.on("pointerup", () => {
      if (!this.selectedNode) return;
      this.startLevelFromNode(this.selectedNode);
    });

    cancelBtn.on("pointerup", () => {
      this.closeLevelPopup();
    });
    

    this.levelPopupGroup = group;
    
  }

  

  private closeLevelPopup() {
    if (this.levelPopupGroup) {
      this.levelPopupGroup.destroy(true);
      this.levelPopupGroup = undefined;
    }
    this.selectedNode = null;
  }

  // --- Map node → GameplayScene ----------------------------------

  private startLevelFromNode(node: MapNodeDef) {
    const dataManager = DataManager.getInstance();
    const ps = dataManager.getCachedPlayerState();
  
    const DEFAULT_MAX_LIVES = 3;
    const maxLives = ps?.max_lives ?? DEFAULT_MAX_LIVES;
    const lives = ps?.lives ?? maxLives;
  
    // If out of lives, block starting and show the out-of-lives modal
    if (lives <= 0) {
      this.openOutOfLivesPopup();
      return;
    }
  
    const land = 1;
    const level = Number(node.label ?? 1);
    this.scene.start("GameplayScene", { land, level });
  }
  



}

export default WorldMapScene;
