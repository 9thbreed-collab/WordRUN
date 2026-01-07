import { DataManager } from './DataManager';

/**
 * Level Manager - Data-driven level progression and navigation
 * Now integrates with Supabase for dynamic level management
 */
export class LevelManager {
  private static dataManager: DataManager;
  
  // Legacy level order for fallback (keeps current behavior if DB unavailable)
  static readonly LEVEL_ORDER: string[] = [
    "Level1Scene",
    "Level2Scene"
  ];

  private static getDataManager(): DataManager {
    if (!this.dataManager) {
      this.dataManager = DataManager.getInstance();
    }
    return this.dataManager;
  }

  // Get the next level based on database configuration
  static async getNextLevel(currentLevelId: string): Promise<string | null> {
    try {
      const level = await this.getDataManager().getLevel(currentLevelId);
      return level?.next_level_id_on_win || null;
    } catch (error) {
      console.error('Failed to get next level from database:', error);
      // Fallback to legacy behavior
      return this.getNextLevelScene(currentLevelId);
    }
  }

  // Get the next level on failure
  static async getNextLevelOnFail(currentLevelId: string): Promise<string | null> {
    try {
      const level = await this.getDataManager().getLevel(currentLevelId);
      return level?.next_level_id_on_fail || null;
    } catch (error) {
      console.error('Failed to get fail level from database:', error);
      return null;
    }
  }

  // Get level configuration
  static async getLevelConfig(levelId: string) {
    try {
      return await this.getDataManager().getLevel(levelId);
    } catch (error) {
      console.error('Failed to get level config:', error);
      return null;
    }
  }

  // Check if it's the last level in the chapter
  static async isLastLevel(levelId: string): Promise<boolean> {
    try {
      const level = await this.getDataManager().getLevel(levelId);
      if (!level) return false;
      
      // Check if there's a next level defined
      return !level.next_level_id_on_win;
    } catch (error) {
      console.error('Failed to check if last level:', error);
      // Fallback to legacy behavior
      return this.isLastLevelLegacy(levelId);
    }
  }

  // Get levels for a specific chapter
  static async getChapterLevels(chapter: number) {
    try {
      return await this.getDataManager().getLevelsByChapter(chapter);
    } catch (error) {
      console.error('Failed to get chapter levels:', error);
      return [];
    }
  }

  // Legacy methods (kept for fallback compatibility)
  static getNextLevelScene(currentSceneKey: string): string | null {
    const currentIndex = LevelManager.LEVEL_ORDER.indexOf(currentSceneKey);
    
    if (currentIndex === -1 || currentIndex >= LevelManager.LEVEL_ORDER.length - 1) {
      return null;
    }
    
    return LevelManager.LEVEL_ORDER[currentIndex + 1];
  }

  static isLastLevelLegacy(currentSceneKey: string): boolean {
    const currentIndex = LevelManager.LEVEL_ORDER.indexOf(currentSceneKey);
    return currentIndex === LevelManager.LEVEL_ORDER.length - 1;
  }

  static getFirstLevelScene(): string | null {
    return LevelManager.LEVEL_ORDER.length > 0 ? LevelManager.LEVEL_ORDER[0] : null;
  }

  // Get the first level from database
  static async getFirstLevel(): Promise<string | null> {
    try {
      const levels = await this.getDataManager().getLevelsByChapter(1);
      return levels.length > 0 ? levels[0].level_id : null;
    } catch (error) {
      console.error('Failed to get first level:', error);
      return 'L001'; // Fallback to default
    }
  }

  // Check if map transitions are enabled
  static async isMapTransitionEnabled(): Promise<boolean> {
    try {
      return await this.getDataManager().featureFlag('use_map_transition');
    } catch (error) {
      console.error('Failed to check map transition feature flag:', error);
      return true; // Default to enabled
    }
  }

  // Navigate to next level with optional map transition
  static async navigateToNextLevel(currentLevelId: string, success: boolean = true, sceneManager: Phaser.Scenes.SceneManager): Promise<void> {
    try {
      // Get next level ID
      const nextLevelId = success 
        ? await this.getNextLevel(currentLevelId)
        : await this.getNextLevelOnFail(currentLevelId);

      if (!nextLevelId) {
        console.warn('No next level found for:', currentLevelId);
        return;
      }

      // Check if map transitions are enabled
      const useMapTransition = await this.isMapTransitionEnabled();

      if (useMapTransition) {
        // Use map transition
        sceneManager.start('MapTransition', {
          currentLevelId,
          nextLevelId,
          success
        });
      } else {
        // Direct transition (legacy behavior)
        sceneManager.start(nextLevelId);
      }
    } catch (error) {
      console.error('Failed to navigate to next level:', error);
      // Fallback to legacy behavior
      const nextLevelScene = this.getNextLevelScene(currentLevelId);
      if (nextLevelScene) {
        sceneManager.start(nextLevelScene);
      }
    }
  }

  // Test method for admin console - check if map transition data exists
  static async testMapTransitionData(levelId: string): Promise<{
    hasCurrentNode: boolean;
    hasNextNode: boolean;
    hasEdge: boolean;
    message: string;
  }> {
    try {
      const level = await this.getDataManager().getLevel(levelId);
      const nextLevelId = await this.getNextLevel(levelId);
      
      if (!level || !nextLevelId) {
        return {
          hasCurrentNode: false,
          hasNextNode: false,
          hasEdge: false,
          message: 'Level or next level not found'
        };
      }

      const nextLevel = await this.getDataManager().getLevel(nextLevelId);
      if (!nextLevel) {
        return {
          hasCurrentNode: !!level.map_node_id,
          hasNextNode: false,
          hasEdge: false,
          message: 'Next level data not found'
        };
      }

      // Check if nodes exist
      const nodes = await this.getDataManager().getMapNodes('world1');
      const currentNode = nodes.find(n => n.map_node_id === level.map_node_id);
      const nextNode = nodes.find(n => n.map_node_id === nextLevel.map_node_id);

      // Check if edge exists
      const edges = await this.getDataManager().getMapEdges('world1');
      const edge = edges.find(e => 
        e.from_node_id === level.map_node_id && e.to_node_id === nextLevel.map_node_id
      );

      const hasCurrentNode = !!currentNode;
      const hasNextNode = !!nextNode;
      const hasEdge = !!edge;

      let message = 'Map transition data check: ';
      if (hasCurrentNode && hasNextNode && hasEdge) {
        message += 'All data available for smooth transition';
      } else {
        message += 'Missing data - fallback animation will be used. ';
        if (!hasCurrentNode) message += 'Current node missing. ';
        if (!hasNextNode) message += 'Next node missing. ';
        if (!hasEdge) message += 'Edge missing. ';
      }

      return {
        hasCurrentNode,
        hasNextNode,
        hasEdge,
        message
      };
    } catch (error) {
      return {
        hasCurrentNode: false,
        hasNextNode: false,
        hasEdge: false,
        message: `Error testing map transition data: ${error.message}`
      };
    }
  }
}
