/**
 * AssetLoader - Dynamic asset loading based on Supabase data
 * Replaces hardcoded asset paths with data-driven loading while maintaining backward compatibility
 */
 import { DataManager } from './DataManager'
 const CDN_BASE =
 (import.meta as any).env?.VITE_CDN_BASE_URL ||
 "https://cdn-game-mcp-test.gambo.ai";



 export class AssetLoader {
   private scene: Phaser.Scene
   private dataManager: DataManager
   private normalizeUri(uri: string): string {
    if (!uri) return uri;
  
    // Convert cdn://path/to/file -> https://<CDN_BASE>/path/to/file
    if (uri.startsWith("cdn://")) {
      const path = uri.slice("cdn://".length);
      return `${CDN_BASE}/${path}`;
    }
  
    return uri;
  }
  
 
   constructor(scene: Phaser.Scene) {
     this.scene = scene
     this.dataManager = DataManager.getInstance()
   }
 
   /**
    * Load an asset by key from the database
    * Falls back to direct path loading if asset not found in database
    */
   async loadAsset(assetKey: string, fallbackPath?: string): Promise<boolean> {
     try {
       const assetUri = await this.dataManager.getAssetUri(assetKey)
 
       if (assetUri) {
         // Asset found in database, load from URI
         const asset = await this.dataManager.getAsset(assetKey)
         if (asset) {
           this.loadAssetByType(asset.type, assetKey, assetUri)
           return true
         }
       }
 
       // Fallback: try to load using fallback path
       if (fallbackPath) {
         console.warn(`Loading asset ${assetKey} from fallback path: ${fallbackPath}`)
         // Determine type from file extension
         const type = this.getAssetTypeFromPath(fallbackPath)
         this.loadAssetByType(type, assetKey, fallbackPath)
         return true
       }
 
       console.error(`Failed to load asset: ${assetKey} (no database entry or fallback)`)
       return false
     } catch (error) {
       console.error(`Error loading asset ${assetKey}:`, error)
       return false
     }
   }
 
   /**
    * Load multiple assets for current art pack
    */
   async loadCurrentArtPackAssets(): Promise<void> {
     const artPackAssets = await this.dataManager.getCurrentArtPackAssets()
 
     // Load assets directly from URIs since we already have the resolved paths
     if (artPackAssets.avatar_uri) {
       const type = this.getAssetTypeFromPath(artPackAssets.avatar_uri)
       this.loadAssetByType(type, 'current_avatar', artPackAssets.avatar_uri)
     }
 
     if (artPackAssets.tile_set_uri) {
       const type = this.getAssetTypeFromPath(artPackAssets.tile_set_uri)
       this.loadAssetByType(type, 'current_tileset', artPackAssets.tile_set_uri)
     }
 
     if (artPackAssets.bg_world_uri) {
       const type = this.getAssetTypeFromPath(artPackAssets.bg_world_uri)
       this.loadAssetByType(type, 'current_background', artPackAssets.bg_world_uri)
     }
   }
 
   /**
    * Load all required game assets from database
    */
    async loadGameAssets(): Promise<void> {
      // Load fonts
      await this.loadAsset('font_supercell_magic', 'https://cdn-game-mcp-test.gambo.ai/shared/supercell-magic_0.ttf');
      await this.loadAsset('font_retro_pixel', 'https://cdn-game-mcp-test.gambo.ai/shared/retro-pixel-arcade.otf.woff2');
      
      // Load UI assets
      await this.loadAsset('ui_pixel_container', 'assets/ui/pixel_style/container_pixel.png');
      await this.loadAsset('ui_pixel_container_clickable', 'assets/ui/pixel_style/container_pixel_clickable.png');
      await this.loadAsset('ui_pixel_container_slot', 'assets/ui/pixel_style/container_pixel_slot.png');
      await this.loadAsset('ui_pixel_container_progress_fill', 'assets/ui/pixel_style/container_pixel_progress_fill.png');
      
      await this.loadAsset('ui_3d_container', 'assets/ui/3d_style/container_3d.png');
      await this.loadAsset('ui_3d_container_clickable', 'assets/ui/3d_style/container_3d_clickable.png');
      await this.loadAsset('ui_3d_container_slot', 'assets/ui/3d_style/container_3d_slot.png');
      await this.loadAsset('ui_3d_container_progress_fill', 'assets/ui/3d_style/container_3d_progress_fill.png');
  
      // --- Ruut walk cycle spritesheet -------------------------------
// Tight 4-frame sheet (no gaps) so Phaser slices correctly.
this.scene.load.spritesheet(
  'ruut_walk',
  'assets/characters/ruut_walk_cycle.png',
  {
    frameWidth: 208,
    frameHeight: 467
  }
);

      
      // Load current art pack assets
      await this.loadCurrentArtPackAssets();
    }
  
 
   /**
    * Get asset type from file extension
    */
   private getAssetTypeFromPath(path: string): string {
     const ext = path.split('.').pop()?.toLowerCase()
 
     switch (ext) {
       case 'png':
       case 'jpg':
       case 'jpeg':
       case 'gif':
         return 'image'
       case 'mp3':
       case 'wav':
       case 'ogg':
         return 'audio'
       case 'woff2':
       case 'woff':
       case 'ttf':
       case 'otf':
         return 'font'
       default:
         return 'image' // Default to image
     }
   }
 
   /**
    * Load asset based on its type
    */
    public loadAssetByType(type: string, key: string, uri: string): void {
      uri = this.normalizeUri(uri);
    
      switch (type) {
    
       case 'image':
         this.scene.load.image(key, uri)
         break
       case 'sprite':
         // Generic sprite-type loader; assumes the asset definition in Supabase
         // was created with the correct configuration.
         this.scene.load.spritesheet(key, uri)
         break
       case 'atlas':
         this.scene.load.atlas(key, uri)
         break
       case 'audio':
         this.scene.load.audio(key, uri)
         break
       case 'font': {
         // Determine font type from extension
         const fontType = uri.includes('.woff') ? 'opentype' : 'truetype'
         this.scene.load.font(key, uri, fontType)
         break
       }
       default:
         console.warn(`Unknown asset type: ${type} for ${key}`)
         this.scene.load.image(key, uri)
     }
   }
 
   /**
    * Resolve asset key to URI for direct use
    */
   async getAssetUri(assetKey: string): Promise<string | null> {
     return this.dataManager.getAssetUri(assetKey)
   }
 
   /**
    * Check if feature flag is enabled
    */
   async isFeatureEnabled(flagKey: string): Promise<boolean> {
     return this.dataManager.featureFlag(flagKey)
   }
 
   /**
    * Get localized string
    */
   async getString(stringKey: string, language = 'en'): Promise<string> {
     return this.dataManager.getString(stringKey, language)
   }
 }
 