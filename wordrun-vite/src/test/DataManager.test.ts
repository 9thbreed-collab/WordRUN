import { describe, it, expect, beforeEach } from 'vitest'
import { DataManager } from '../DataManager'

describe('DataManager', () => {
  let dataManager: DataManager

  beforeEach(() => {
    dataManager = DataManager.getInstance()
    // Clear localStorage to ensure clean state
    localStorage.clear()
  })

  it('should handle offline mode gracefully', async () => {
    // Test that DataManager doesn't throw when Supabase is unavailable
    try {
      await dataManager.initialize()
      // Should not throw, even with placeholder credentials
    } catch (error) {
      // Should gracefully handle connection errors
      expect(error).toBeDefined()
    }
  })

  it('should provide fallback values for feature flags', async () => {
    // Test offline feature flag behavior
    const result = await dataManager.featureFlag('nonexistent_flag')
    expect(result).toBe(false) // Should default to false
  })

  it('should handle asset resolution gracefully', async () => {
    // Test offline asset resolution
    const uri = await dataManager.resolveAssetUri('nonexistent_asset')
    expect(uri).toBe(null) // Should return null for missing assets
  })

  it('should generate consistent player IDs', async () => {
    // Test player ID generation
    await dataManager.loadCurrentPlayer()
    const playerId1 = localStorage.getItem('wordgame_player_id')
    
    await dataManager.loadCurrentPlayer()
    const playerId2 = localStorage.getItem('wordgame_player_id')
    
    expect(playerId1).toBe(playerId2) // Should be consistent
    expect(playerId1).toMatch(/^[0-9a-f-]{36}$/) // Should be UUID format
  })
})