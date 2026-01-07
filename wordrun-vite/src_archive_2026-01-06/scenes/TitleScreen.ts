/* =========================================
   FILE: src/scenes/TitleScreen.ts
   PURPOSE: Story Mode -> (dev skip?) Map or Gameplay
   ========================================= */
import Phaser from 'phaser';
import { mountDom, basicColumn } from '../utils';
import { GAME_CONFIG } from '../config';
import { DataManager } from '../DataManager';
import { AssetLoader } from '../AssetLoader';
import { requireAuthWithProfile } from '../auth';
import { showNameOverlay } from '../ui/NameOverlay';





export class TitleScreen extends Phaser.Scene {
  private dataManager!: DataManager;
  private assetLoader!: AssetLoader;

  constructor() { 
    super('TitleScreen'); 
  }

  async create(): Promise<void> {
    this.dataManager = DataManager.getInstance();
    this.assetLoader = new AssetLoader(this);



    
        // Get localized strings
        const gameTitle = await this.assetLoader.getString('game_title', 'en');
        const startGameText = await this.assetLoader.getString('start_game', 'en');
    
        // Dev-only row (test buttons + demo notes)
        const devHtml = (GAME_CONFIG.dev.enabled && GAME_CONFIG.dev.showTitleTestButtons)
          ? `
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:20px;">
            <button id="test-transition" style="padding:8px 16px;font-size:14px;background:#4CAF50;">Test MapTransition</button>
            <button id="admin" style="padding:8px 16px;font-size:14px;background:#FF9800;">Admin Console</button>
          </div>
         <small style="opacity:.7">scr/scenes/titlescreen/const devHtml = (GAME_CONFIG.dev.enabled && GAME_CONFIG.dev.showTitleTestButtons) text 1</small>
          <small style="opacity:.5;display:block;margin-top:10px;">scr/scenes/titlescreen/const devHtml = (GAME_CONFIG.dev.enabled && GAME_CONFIG.dev.showTitleTestButtons) text 2</small>
          `
          : '';
    
        const html = basicColumn(`
          <h1 style="margin:0;font-weight:700;">${gameTitle.toUpperCase()}</h1>
          <small style="opacity:.5;display:block;margin-top:10px;">scr/scenes/titlescreen/const html = basicColumn( This: is in supabase:$"-"{gameTitle.toUpperCase()}" ${gameTitle.toUpperCase()}. Hard code the above or place into supabase</small>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
            <button id="story" style="padding:12px 20px;font-size:16px;">${startGameText}</button>
            <button id="versus" style="padding:12px 20px;font-size:16px;background:#1f2933;color:#f9fafb;border-radius:6px;">
              1v1 Versus
            </button>
            <button id="hidden" style="padding:12px 20px;font-size:16px;opacity:.5;pointer-events:none;">Hidden Letter</button>
            <button id="scrabble" style="padding:12px 20px;font-size:16px;opacity:.5;pointer-events:none;">Scrabble</button>
          </div>
          ${devHtml}
        `);
    

    
    const { el } = mountDom(this, html);

    el.querySelector<HTMLButtonElement>('#story')!.onclick = async () => {
      // ✅ Ensure login + profile + starter name
      const authResult = await requireAuthWithProfile();
      if (!authResult) {
        // Either sign-in failed or we just triggered OAuth redirect
        return;
      }
      // const { userId, profile } = authResult;
      // We don't need them here yet, but the profile is now created and cached.
    
      const useNewMapPaths = await this.assetLoader.isFeatureEnabled('use_new_map_paths');
      
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (GAME_CONFIG.dev.skipMapScene || useNewMapPaths) {
          this.scene.start('WorldMapScene', { land: 1, level: 1 });
        } else {
          this.scene.start('MapScene', { land: 1, level: 1 });
        }
      });
    };
    
    

    // 1v1 Versus mode
el.querySelector<HTMLButtonElement>('#versus')!.onclick = async () => {
  const authResult = await requireAuthWithProfile();
  if (!authResult) return;

  const { profile } = authResult;
  const meta = profile.meta ?? {};
  const nameLocked = !!meta.name_locked;

  const startVersus = () => {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start('WordChainGameScene', { mode: 'versus' });
      }
    );
  };

  // 🧩 First-ever 1v1: show the name overlay if the name is not locked.
  if (!nameLocked) {
    showNameOverlay(this, profile, { reason: 'post_tutorial' }, () => {
      // After they choose/keep a name + celebration, enter Versus
      startVersus();
    });
  } else {
    // Name is already locked → go straight into Versus
    startVersus();
  }
};

    



        // Test MapTransition functionality (dev-only; buttons may not exist)
        const testTransitionBtn = el.querySelector<HTMLButtonElement>('#test-transition');
        if (testTransitionBtn) {
          testTransitionBtn.onclick = () => {
            this.cameras.main.fadeOut(250, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
              this.scene.start('TestLevel', { levelId: 'L001' });
            });
          };
        }
    
        // Open admin console (dev-only; button may not exist)
const adminBtn = el.querySelector<HTMLButtonElement>('#admin');
if (adminBtn) {
  adminBtn.onclick = () => {
    this.scene.launch('AdminConsole');
  };
}

    

   

    const layout = () => {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      const safe = getSafeRect(w, h, 0.05);
    
      // Examples — adjust these variable names to match what exists in your file:
      // this.titleText.setPosition(safe.centerX, safe.top + 90);
      // this.startBtn.setPosition(safe.centerX, safe.centerY + 80);
    
      // If you have a menu button:
      // this.menuBtn.setPosition(safe.right - 10, safe.top + 10);
    };
    
    layout();
    
    this.scale.on('resize', layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', layout);
    });
    
  }
}