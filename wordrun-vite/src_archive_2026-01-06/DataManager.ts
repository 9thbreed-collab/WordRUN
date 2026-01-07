import { supabase } from './supabase'
import type { Asset, ArtPack, MapNode, MapEdge, Level, Season, FeatureFlag, Localization, PlayerState } from './supabase'

/**
 * DataManager - Centralized data access layer for Supabase integration
 * Handles caching, offline safety, and provides a clean API for game data
 */
export class DataManager {
  private static instance: DataManager
  private cache: Map<string, any> = new Map()
  private isOnline = true
  private currentPlayerId?: string
  private currentArtPackKey = 'base'

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  // Initialize and seed data if needed
  async initialize(): Promise<void> {
    try {
      await this.checkConnection()
      await this.seedDefaultData()
      await this.loadCurrentPlayer()

      // NEW: make sure this player actually has hearts & lives
      await this.ensurePlayerStateWithDefaults()

      this.currentArtPackKey = await this.getActiveArtPack()
    } catch (error) {
      console.warn('DataManager: Failed to initialize, using offline mode:', error)
      this.isOnline = false
      this.loadFromCache()
    }
  }


  private async checkConnection(): Promise<void> {
    const { data, error } = await supabase.from('assets').select('count').limit(1)
    if (error) throw error
    this.isOnline = true
  }

  private loadFromCache(): void {
    // Load cached data from localStorage
    const cached = localStorage.getItem('wordgame_cache')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        for (const [key, value] of Object.entries(data)) {
          this.cache.set(key, value)
        }
      } catch (error) {
        console.error('Failed to load cache:', error)
      }
    }
  }

  private saveToCache(): void {
    // Save current cache to localStorage
    try {
      const data = Object.fromEntries(this.cache.entries())
      localStorage.setItem('wordgame_cache', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save cache:', error)
    }
  }

  // Asset Management
  async getAsset(assetKey: string): Promise<Asset | null> {
    const cacheKey = `asset_${assetKey}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return null

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_key', assetKey)
        .single()

      if (error) throw error

      this.cache.set(cacheKey, data)
      this.saveToCache()
      return data
    } catch (error) {
      console.error('Failed to fetch asset:', assetKey, error)
      return null
    }
  }

  async getAllAssets(): Promise<Asset[]> {
    const cacheKey = 'all_assets'
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return []

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('asset_key')

      if (error) throw error

      this.cache.set(cacheKey, data || [])
      this.saveToCache()
      return data || []
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      return []
    }
  }

  // Art Pack Management
  async getArtPack(artPackKey: string): Promise<ArtPack | null> {
    const cacheKey = `artpack_${artPackKey}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return null

    try {
      const { data, error } = await supabase
        .from('art_packs')
        .select('*')
        .eq('art_pack_key', artPackKey)
        .single()

      if (error) throw error

      this.cache.set(cacheKey, data)
      this.saveToCache()
      return data
    } catch (error) {
      console.error('Failed to fetch art pack:', artPackKey, error)
      return null
    }
  }

  async getActiveArtPack(): Promise<string> {
    // Check for active season
    const activeSeason = await this.getActiveSeason()
    if (activeSeason) {
      return activeSeason.art_pack_key
    }

    // Default to base art pack
    return 'base'
  }

  // Season Management
  async getActiveSeason(): Promise<Season | null> {
    const cacheKey = 'active_season'
    const now = new Date().toISOString().split('T')[0]
    
    // Check cache first (but refresh every hour)
    const cached = this.cache.get(cacheKey)
    if (cached && cached.timestamp > Date.now() - 3600000) { // 1 hour
      return cached.data
    }

    if (!this.isOnline) return cached?.data || null

    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('priority', { ascending: false })
        .limit(1)

      if (error) throw error

      const season = data && data.length > 0 ? data[0] : null
      this.cache.set(cacheKey, { data: season, timestamp: Date.now() })
      this.saveToCache()
      return season
    } catch (error) {
      console.error('Failed to fetch active season:', error)
      return null
    }
  }

  // Level Management
  async getLevel(levelId: string): Promise<Level | null> {
    const cacheKey = `level_${levelId}`
  
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
  
    if (!this.isOnline) return null
  
    try {
      // 1) Get all versions of this level (base + seasonal variants)
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('level_id', levelId)
  
      if (error) throw error
      if (!data || data.length === 0) {
        console.warn('No level rows found for level_id:', levelId)
        return null
      }
  
      // 2) Figure out the active season (if any)
      const activeSeason = await this.getActiveSeason()
  
      let chosen: Level | null = null
  
      if (activeSeason) {
        // Try to find a matching seasonal variant first
        chosen =
          data.find(l => l.season_id === activeSeason.season_id) ??
          data.find(l => !l.season_id) ??
          data[0]
      } else {
        // No active season → prefer the base version (no season_id)
        chosen =
          data.find(l => !l.season_id) ??
          data[0]
      }
  
      // 3) Cache & return
      this.cache.set(cacheKey, chosen)
      this.saveToCache()
      return chosen
    } catch (error) {
      console.error('Failed to fetch level:', levelId, error)
      return null
    }
  }
  

  async getLevelsByChapter(chapter: number): Promise<Level[]> {
    const cacheKey = `levels_chapter_${chapter}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return []

    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('chapter', chapter)
        .order('level_id')

      if (error) throw error

      this.cache.set(cacheKey, data || [])
      this.saveToCache()
      return data || []
    } catch (error) {
      console.error('Failed to fetch levels for chapter:', chapter, error)
      return []
    }
  }

  // Map Management
  async getMapNodes(worldId: string): Promise<MapNode[]> {
    const cacheKey = `map_nodes_${worldId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return []

    try {
      const { data, error } = await supabase
        .from('map_nodes')
        .select('*')
        .eq('world_id', worldId)
        .order('map_node_id')

      if (error) throw error

      this.cache.set(cacheKey, data || [])
      this.saveToCache()
      return data || []
    } catch (error) {
      console.error('Failed to fetch map nodes for world:', worldId, error)
      return []
    }
  }

  async getMapEdges(worldId: string): Promise<MapEdge[]> {
    const cacheKey = `map_edges_${worldId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return []

    try {
      const { data, error } = await supabase
        .from('map_edges')
        .select('*')
        .eq('world_id', worldId)

      if (error) throw error

      this.cache.set(cacheKey, data || [])
      this.saveToCache()
      return data || []
    } catch (error) {
      console.error('Failed to fetch map edges for world:', worldId, error)
      return []
    }
  }

  // Feature Flags
  async featureFlag(flagKey: string): Promise<boolean> {
    const cacheKey = `flag_${flagKey}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return false

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_key', flagKey)
        .single()

      if (error) throw error

      let enabled = data.default_value || data.default

      // Apply target rules
      if (data.target_rule === 'all') {
        enabled = true
      } else if (data.target_rule.startsWith('pct:')) {
        const percentage = parseInt(data.target_rule.split(':')[1])
        const hash = this.hashString(this.currentPlayerId || 'anonymous')
        enabled = (hash % 100) < percentage
      } else if (data.target_rule === 'admin') {
        // TODO: Check if current user is admin
        enabled = false
      }

      this.cache.set(cacheKey, enabled)
      this.saveToCache()
      return enabled
    } catch (error) {
      console.error('Failed to fetch feature flag:', flagKey, error)
      return false
    }
  }

  // Localization
  async getString(stringKey: string, language = 'en'): Promise<string> {
    const cacheKey = `string_${stringKey}_${language}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return stringKey // Fallback to key

    try {
      const { data, error } = await supabase
        .from('localization')
        .select('*')
        .eq('string_key', stringKey)
        .single()

      if (error) throw error

      const text = data[language] || data.en || stringKey
      this.cache.set(cacheKey, text)
      this.saveToCache()
      return text
    } catch (error) {
      console.error('Failed to fetch localized string:', stringKey, error)
      return stringKey
    }
  }

  // Player State Management
  async loadCurrentPlayer(): Promise<void> {
    // For now, use a simple UUID stored in localStorage
    let playerId = localStorage.getItem('wordgame_player_id')
    if (!playerId) {
      playerId = this.generateUUID()
      localStorage.setItem('wordgame_player_id', playerId)
    }
    this.currentPlayerId = playerId
  }

  getCachedPlayerState(): PlayerState | null {
    if (!this.currentPlayerId) return null;
  
    const cacheKey = `player_${this.currentPlayerId}`;
    const cached = this.cache.get(cacheKey);
    return cached ?? null;
  }
  


  async getPlayerState(): Promise<PlayerState | null> {
    if (!this.currentPlayerId) return null

    const cacheKey = `player_${this.currentPlayerId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    if (!this.isOnline) return null

    try {
      const { data, error } = await supabase
        .from('player_state')
        .select('*')
        .eq('player_id', this.currentPlayerId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

      this.cache.set(cacheKey, data)
      this.saveToCache()
      return data
    } catch (error) {
      console.error('Failed to fetch player state:', error)
      return null
    }
  }

  async updatePlayerState(updates: Partial<PlayerState>): Promise<void> {
    if (!this.currentPlayerId || !this.isOnline) return

    try {
      const { error } = await supabase
        .from('player_state')
        .upsert({
          player_id: this.currentPlayerId,
          ...updates
        })

        

      if (error) throw error

      // Update cache
      const cacheKey = `player_${this.currentPlayerId}`
      const current = this.cache.get(cacheKey) || {}
      this.cache.set(cacheKey, { ...current, ...updates })
      this.saveToCache()
    } catch (error) {
      console.error('Failed to update player state:', error)
    }
  }

  async ensurePlayerStateWithDefaults(): Promise<PlayerState | null> {
    if (!this.currentPlayerId) return null

    // 1) Try to load existing state
    const existing = await this.getPlayerState()

    // 2) If it exists AND already has hearts/lives, just return it
    if (existing && existing.max_hearts != null && existing.max_lives != null) {
      return existing
    }

    // 3) Decide your default values
    const DEFAULT_MAX_HEARTS = 4;
const DEFAULT_MAX_LIVES = 3;

const maxHearts = (existing?.max_hearts ?? DEFAULT_MAX_HEARTS);
const maxLives  = (existing?.max_lives  ?? DEFAULT_MAX_LIVES);

// If existing hearts/lives are missing or invalid, reset them.
// Otherwise keep what they already have.
const hearts =
  (existing?.hearts == null || existing.hearts < 0 || existing.hearts > maxHearts)
    ? maxHearts
    : existing.hearts;

const lives =
  (existing?.lives == null || existing.lives < 0 || existing.lives > maxLives)
    ? maxLives
    : existing.lives;

const defaults: Partial<PlayerState> = {
  hearts,
  max_hearts: maxHearts,
  lives,
  max_lives: maxLives,
  next_heart_at: existing?.next_heart_at ?? null,
  next_life_at: existing?.next_life_at ?? null,
};

    // 4) Upsert into Supabase
    await this.updatePlayerState(defaults)

    // 5) Return merged result
    const merged: PlayerState = {
      player_id: this.currentPlayerId,
      current_level_id: existing?.current_level_id ?? '',
      current_node_id: existing?.current_node_id ?? '',
      unlocked_nodes: existing?.unlocked_nodes ?? '',
      currency: existing?.currency ?? 0,
      flags: existing?.flags ?? {},
      ...defaults,
    }

    // Update cache as well
    const cacheKey = `player_${this.currentPlayerId}`
    this.cache.set(cacheKey, merged)
    this.saveToCache()

    return merged
  }


  // Utility methods
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Asset resolution helper
  async resolveAssetUri(assetKey: string): Promise<string | null> {
    const asset = await this.getAsset(assetKey)
    return asset ? asset.uri : null
  }

  // Get current art pack for asset resolution
  getCurrentArtPackKey(): string {
    return this.currentArtPackKey
  }

  // Get asset URI with fallback to original path if not in database
  async getAssetUri(assetKey: string): Promise<string | null> {
    const asset = await this.getAsset(assetKey)
    if (asset) {
      return asset.uri
    }
    
    // Fallback: if asset not found in database, try to use the key as a relative path
    // This ensures backward compatibility during transition
    console.warn(`Asset ${assetKey} not found in database, using fallback path`)
    return null
  }

  // Get current art pack with all resolved asset URIs
  async getCurrentArtPackAssets(): Promise<{
    ui_skin_key?: string;
    avatar_uri?: string;
    tile_set_uri?: string;
    bg_world_uri?: string;
  }> {
    const artPack = await this.getArtPack(this.currentArtPackKey)
    if (!artPack) {
      return {}
    }

    const [avatarAsset, tileSetAsset, bgWorldAsset] = await Promise.all([
      artPack.avatar_key ? this.getAsset(artPack.avatar_key) : null,
      artPack.tile_set_key ? this.getAsset(artPack.tile_set_key) : null,
      artPack.bg_world_key ? this.getAsset(artPack.bg_world_key) : null
    ])

    return {
      ui_skin_key: artPack.ui_skin_key,
      avatar_uri: avatarAsset?.uri,
      tile_set_uri: tileSetAsset?.uri,
      bg_world_uri: bgWorldAsset?.uri
    }
  }

  // Seed default data (only runs if tables are empty)
  private async seedDefaultData(): Promise<void> {
    try {
      // Check if already seeded
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('asset_key')
        .limit(1)

      if (existingAssets && existingAssets.length > 0) {
        console.log('DataManager: Database already seeded, skipping seed operation')
        return
      }

      console.log('DataManager: Seeding default data...')
      await this.seedAssetsFromCSV()
      await this.seedArtPacks()
      await this.seedMapNodes()
      await this.seedMapEdges()
      await this.seedLevels()
      await this.seedSeasons()
      await this.seedFeatureFlags()
      await this.seedLocalization()
      console.log('DataManager: Default data seeding complete')
    } catch (error) {
      console.error('Failed to seed default data:', error)
    }
  }

  private async seedAssetsFromCSV(): Promise<void> {
    // Load and seed assets from the CSV file
    try {
      const response = await fetch('/sample-data/assets.csv')
      const csvText = await response.text()
      const lines = csvText.trim().split('\n')
      
      const assets: Asset[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        if (values.length >= 4) {
          assets.push({
            asset_key: values[0].trim(),
            type: values[1].trim() as Asset['type'],
            uri: values[2].trim(),
            version: parseInt(values[3].trim()) || 1
          })
        }
      }

      if (assets.length > 0) {
        const { error } = await supabase
          .from('assets')
          .insert(assets)
        
        if (error) {
          console.error('Failed to insert assets:', error)
        } else {
          console.log(`Seeded ${assets.length} assets from CSV`)
        }
      }
    } catch (error) {
      console.error('Failed to load assets from CSV:', error)
      // Fallback to hardcoded assets
      await this.seedAssets()
    }
  }

  private async seedAssets(): Promise<void> {
    const { data: existing } = await supabase.from('assets').select('asset_key').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultAssets: Asset[] = [
      {
        asset_key: 'font_supercell_magic',
        type: 'font',
        uri: 'https://cdn-game-mcp-test.gambo.ai/shared/supercell-magic_0.ttf',
        version: 1
      },
      {
        asset_key: 'ui_pixel_container',
        type: 'image', 
        uri: 'assets/ui/pixel_style/container_pixel.png',
        version: 1
      },
      {
        asset_key: 'ui_pixel_container_clickable',
        type: 'image',
        uri: 'assets/ui/pixel_style/container_pixel_clickable.png', 
        version: 1
      },
      {
        asset_key: 'avatar_default',
        type: 'image',
        uri: 'assets/ui/pixel_style/container_pixel.png', // Placeholder
        version: 1
      },
      {
        asset_key: 'tileset_default',
        type: 'image', 
        uri: 'assets/ui/pixel_style/container_pixel.png', // Placeholder
        version: 1
      },
      {
        asset_key: 'bg_world_default',
        type: 'image',
        uri: 'assets/ui/pixel_style/container_pixel.png', // Placeholder
        version: 1
      }
    ]

    const { error } = await supabase.from('assets').insert(defaultAssets)
    if (error) throw error
  }

  private async seedArtPacks(): Promise<void> {
    const { data: existing } = await supabase.from('art_packs').select('art_pack_key').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultArtPacks: ArtPack[] = [
      {
        art_pack_key: 'base',
        display_name: 'Base Theme',
        ui_skin_key: 'pixel',
        avatar_key: 'avatar_default',
        tile_set_key: 'tileset_default', 
        bg_world_key: 'bg_world_default'
      },
      {
        art_pack_key: 'winter',
        display_name: 'Winter Theme',
        ui_skin_key: 'pixel',
        avatar_key: 'avatar_default',
        tile_set_key: 'tileset_default',
        bg_world_key: 'bg_world_default'
      }
    ]

    const { error } = await supabase.from('art_packs').insert(defaultArtPacks)
    if (error) throw error
  }

  private async seedMapNodes(): Promise<void> {
    const { data: existing } = await supabase.from('map_nodes').select('map_node_id').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultNodes: MapNode[] = [
      {
        map_node_id: 'start',
        world_id: 'world1',
        display_name: 'Start',
        x_pct: 20,
        y_pct: 80,
        unlock_rule: 'always',
        icon_key: 'avatar_default'
      },
      {
        map_node_id: 'level1',
        world_id: 'world1', 
        display_name: 'Level 1',
        x_pct: 50,
        y_pct: 60,
        unlock_rule: 'always',
        icon_key: 'avatar_default'
      },
      {
        map_node_id: 'level2',
        world_id: 'world1',
        display_name: 'Level 2', 
        x_pct: 80,
        y_pct: 40,
        unlock_rule: 'after:L001',
        icon_key: 'avatar_default'
      }
    ]

    const { error } = await supabase.from('map_nodes').insert(defaultNodes)
    if (error) throw error
  }

  private async seedMapEdges(): Promise<void> {
    const { data: existing } = await supabase.from('map_edges').select('edge_id').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultEdges: MapEdge[] = [
      {
        edge_id: 'edge1',
        world_id: 'world1',
        from_node_id: 'start',
        to_node_id: 'level1',
        path_style: 'curve1',
        walk_duration_ms: 2000
      },
      {
        edge_id: 'edge2',
        world_id: 'world1', 
        from_node_id: 'level1',
        to_node_id: 'level2',
        path_style: 'curve2',
        walk_duration_ms: 3000
      }
    ]

    const { error } = await supabase.from('map_edges').insert(defaultEdges)
    if (error) throw error
  }

  private async seedLevels(): Promise<void> {
    const { data: existing } = await supabase.from('levels').select('level_id').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultLevels: Level[] = [
      {
        level_id: 'L001',
        chapter: 1,
        land_id: 1,              // NEW
        world_id: 'world1',
        map_node_id: 'level1',
        puzzle_bank_id: 'bank1',
        difficulty: 'easy',
        target_score: 1000,
        time_limit_seconds: 0,
        powerups_allowed: 'hint,shuffle',
        art_pack_key: 'base',
        music_key: 'font_supercell_magic', // Placeholder
        next_level_id_on_win: 'L002'
      },
      {
        level_id: 'L002',
        chapter: 1,
        land_id: 1,              // NEW
        world_id: 'world1', 
        map_node_id: 'level2',
        puzzle_bank_id: 'bank1',
        difficulty: 'medium',
        target_score: 1500,
        time_limit_seconds: 90,
        powerups_allowed: 'hint,shuffle',
        art_pack_key: 'base',
        music_key: 'font_supercell_magic' // Placeholder
      }
    ]

    const { error } = await supabase.from('levels').insert(defaultLevels)
    if (error) throw error
  }

  private async seedSeasons(): Promise<void> {
    const { data: existing } = await supabase.from('seasons').select('season_id').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultSeasons: Season[] = [
      {
        season_id: 'winter2024',
        art_pack_key: 'winter',
        start_date: '2024-12-01',
        end_date: '2025-02-28', 
        priority: 1,
        notes: 'Winter theme for holidays'
      }
    ]

    const { error } = await supabase.from('seasons').insert(defaultSeasons)
    if (error) throw error
  }

  private async seedFeatureFlags(): Promise<void> {
    const { data: existing } = await supabase.from('feature_flags').select('flag_key').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultFlags: any[] = [
      {
        flag_key: 'enable_wheel_mode_v2',
        default_value: false,
        target_rule: 'pct:0',
        notes: 'Enhanced wheel mode with RAF updates'
      },
      {
        flag_key: 'use_new_map_paths',
        default_value: false,
        target_rule: 'pct:0', 
        notes: 'New map path system'
      },
      {
        flag_key: 'admin_console_enabled',
        default_value: false,
        target_rule: 'admin',
        notes: 'Enable admin console access'
      }
    ]

    const { error } = await supabase.from('feature_flags').insert(defaultFlags)
    if (error) throw error
  }

  private async seedLocalization(): Promise<void> {
    const { data: existing } = await supabase.from('localization').select('string_key').limit(1)
    if (existing && existing.length > 0) return // Already seeded

    const defaultStrings: Localization[] = [
      {
        string_key: 'game_title',
        en: 'WordRun',
        es: 'WordRun' // or whatever Spanish name you want
      },
      {
        string_key: 'start_game',
        en: 'Start Game',
        es: 'Iniciar Juego'
      },
      {
        string_key: 'level_complete',
        en: 'Level Complete!',
        es: '¡Nivel Completado!'
      }
    ]

    const { error } = await supabase.from('localization').insert(defaultStrings)
    if (error) throw error
  }

  logout(): void {
    // Remove local player identity
    localStorage.removeItem('wordgame_player_id');
  
    // Clear DataManager cache
    this.cache.clear();
    this.saveToCache();
  
    // Reset runtime state
    this.currentPlayerId = null;
    this.currentArtPackKey = 'base';
  }
  
}
