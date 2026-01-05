export type AdSlot = 
  | 'interstitial_level_end'
  | 'interstitial_land_gate'
  | 'rewarded_revive'
  | 'rewarded_booster'
  | 'banner_main_menu'
  | 'banner_leaderboard'
  | 'native_sponsored_card'
  | 'takeover_on_first_login_of_day';

export type AdPriority = 'HOUSE' | 'DIRECT-SOLD' | 'NETWORK' | 'CROSS-PROMO';

export interface AdConfig {
  id: string;
  slot: AdSlot;
  priority: AdPriority;
  eCPM: number;
  enabled: boolean;
  creative?: AdCreative;
  targeting?: AdTargeting;
  frequencyCap?: FrequencyCap;
}

export interface AdCreative {
  type: 'image' | 'video' | 'html';
  url: string;
  width: number;
  height: number;
  duration?: number; // for video
}

export interface AdTargeting {
  geo?: string[];
  device?: string[];
  language?: string[];
  landRange?: { min: number; max: number };
  levelRange?: { min: number; max: number };
  userSegment?: string[];
}

export interface FrequencyCap {
  maxImpressions: number;
  timeWindow: number; // in hours
}

export interface AdRequest {
  slot: AdSlot;
  land: number;
  level: number;
  geo: string;
  device: string;
  language: string;
  userSegment?: string;
}

export interface AdResponse {
  success: boolean;
  config?: AdConfig;
  error?: string;
}

export class AdManager {
  private static instance: AdManager;
  private configs: Map<string, AdConfig>;
  private impressionCounts: Map<string, { count: number; timestamp: number }[]>;
  private lastInterstitialTime: number = 0;
  private interstitialCount: number = 0;

  private constructor() {
    this.configs = new Map();
    this.impressionCounts = new Map();
    this.loadAdConfigs();
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private loadAdConfigs(): void {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('linkedMindsAdConfigs');
    if (saved) {
      const configs = JSON.parse(saved);
      configs.forEach((config: AdConfig) => {
        this.configs.set(config.id, config);
      });
    } else {
      this.setDefaultConfigs();
    }
  }

  private setDefaultConfigs(): void {
    // Default ad configurations
    const defaultConfigs: AdConfig[] = [
      {
        id: 'house_interstitial_1',
        slot: 'interstitial_level_end',
        priority: 'HOUSE',
        eCPM: 5.00,
        enabled: true,
        creative: {
          type: 'image',
          url: 'https://via.placeholder.com/320x480/4285f4/ffffff?text=Play+More+Games',
          width: 320,
          height: 480
        },
        frequencyCap: {
          maxImpressions: 3,
          timeWindow: 24
        }
      },
      {
        id: 'network_interstitial_1',
        slot: 'interstitial_level_end',
        priority: 'NETWORK',
        eCPM: 2.50,
        enabled: true,
        frequencyCap: {
          maxImpressions: 6,
          timeWindow: 24
        }
      },
      {
        id: 'rewarded_revive_1',
        slot: 'rewarded_revive',
        priority: 'NETWORK',
        eCPM: 8.00,
        enabled: true,
        creative: {
          type: 'video',
          url: 'https://example.com/rewarded_video.mp4',
          width: 320,
          height: 240,
          duration: 30
        }
      },
      {
        id: 'banner_main_1',
        slot: 'banner_main_menu',
        priority: 'NETWORK',
        eCPM: 1.20,
        enabled: true,
        creative: {
          type: 'image',
          url: 'https://via.placeholder.com/320x50/34a853/ffffff?text=Banner+Ad',
          width: 320,
          height: 50
        }
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
    this.saveConfigs();
  }

  private saveConfigs(): void {
    const configArray = Array.from(this.configs.values());
    localStorage.setItem('linkedMindsAdConfigs', JSON.stringify(configArray));
  }

  async requestAd(request: AdRequest): Promise<AdResponse> {
    // Get eligible ads for this slot
    const eligibleAds = this.getEligibleAds(request);
    
    if (eligibleAds.length === 0) {
      return { success: false, error: 'No eligible ads available' };
    }

    // Apply frequency capping
    const availableAds = eligibleAds.filter(ad => this.canShowAd(ad));
    
    if (availableAds.length === 0) {
      return { success: false, error: 'Frequency cap exceeded' };
    }

    // Apply slot-specific rules
    if (!this.checkSlotRules(request.slot)) {
      return { success: false, error: 'Slot rules not met' };
    }

    // Sort by priority and eCPM (waterfall)
    availableAds.sort((a, b) => {
      const priorityOrder = { 'HOUSE': 1, 'DIRECT-SOLD': 2, 'NETWORK': 3, 'CROSS-PROMO': 4 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.eCPM - a.eCPM; // Higher eCPM first
    });

    const selectedAd = availableAds[0];
    this.recordImpression(selectedAd);

    return { success: true, config: selectedAd };
  }

  private getEligibleAds(request: AdRequest): AdConfig[] {
    return Array.from(this.configs.values()).filter(config => {
      if (!config.enabled || config.slot !== request.slot) {
        return false;
      }

      // Check targeting
      if (config.targeting) {
        const targeting = config.targeting;
        
        if (targeting.geo && !targeting.geo.includes(request.geo)) {
          return false;
        }
        
        if (targeting.device && !targeting.device.includes(request.device)) {
          return false;
        }
        
        if (targeting.language && !targeting.language.includes(request.language)) {
          return false;
        }
        
        if (targeting.landRange) {
          if (request.land < targeting.landRange.min || request.land > targeting.landRange.max) {
            return false;
          }
        }
        
        if (targeting.levelRange) {
          if (request.level < targeting.levelRange.min || request.level > targeting.levelRange.max) {
            return false;
          }
        }
        
        if (targeting.userSegment && request.userSegment) {
          if (!targeting.userSegment.includes(request.userSegment)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private canShowAd(config: AdConfig): boolean {
    if (!config.frequencyCap) return true;

    const key = config.id;
    const impressions = this.impressionCounts.get(key) || [];
    const now = Date.now();
    const timeWindowMs = config.frequencyCap.timeWindow * 60 * 60 * 1000;

    // Clean old impressions
    const recentImpressions = impressions.filter(imp => 
      now - imp.timestamp < timeWindowMs
    );

    return recentImpressions.length < config.frequencyCap.maxImpressions;
  }

  private checkSlotRules(slot: AdSlot): boolean {
    const now = Date.now();
    
    switch (slot) {
      case 'interstitial_level_end':
      case 'interstitial_land_gate':
        // Max 1 interstitial per 2 levels, max 6 per day
        const timeSinceLastInterstitial = now - this.lastInterstitialTime;
        const minInterval = 2 * 60 * 1000; // 2 minutes minimum (simplified)
        
        if (timeSinceLastInterstitial < minInterval) {
          return false;
        }
        
        // Check daily cap (simplified - should be more sophisticated)
        if (this.interstitialCount >= 6) {
          return false;
        }
        
        return true;
        
      case 'rewarded_revive':
      case 'rewarded_booster':
        // Always allowed for rewarded ads (user opt-in)
        return true;
        
      case 'banner_main_menu':
      case 'banner_leaderboard':
        // Banner refresh rules (simplified)
        return true;
        
      default:
        return true;
    }
  }

  private recordImpression(config: AdConfig): void {
    const key = config.id;
    const impressions = this.impressionCounts.get(key) || [];
    impressions.push({ count: 1, timestamp: Date.now() });
    this.impressionCounts.set(key, impressions);

    // Update interstitial tracking
    if (config.slot === 'interstitial_level_end' || config.slot === 'interstitial_land_gate') {
      this.lastInterstitialTime = Date.now();
      this.interstitialCount++;
    }

    // Save to localStorage
    this.saveImpressionData();
  }

  private saveImpressionData(): void {
    const data = Array.from(this.impressionCounts.entries()).map(([key, impressions]) => ({
      key,
      impressions
    }));
    localStorage.setItem('linkedMindsAdImpressions', JSON.stringify(data));
  }

  // Admin methods (would be called by admin console)
  addAdConfig(config: AdConfig): void {
    this.configs.set(config.id, config);
    this.saveConfigs();
  }

  updateAdConfig(id: string, config: Partial<AdConfig>): void {
    const existing = this.configs.get(id);
    if (existing) {
      this.configs.set(id, { ...existing, ...config });
      this.saveConfigs();
    }
  }

  removeAdConfig(id: string): void {
    this.configs.delete(id);
    this.saveConfigs();
  }

  getAdConfigs(): AdConfig[] {
    return Array.from(this.configs.values());
  }

  // Simulate rewarded ad completion
  completeRewardedAd(slot: AdSlot): boolean {
    // In real implementation, this would be called by the ad SDK
    console.log(`Rewarded ad completed for slot: ${slot}`);
    return true;
  }

  // Reset daily counters (should be called at midnight)
  resetDailyCounters(): void {
    this.interstitialCount = 0;
    // Clear old impression data
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    this.impressionCounts.forEach((impressions, key) => {
      const filtered = impressions.filter(imp => imp.timestamp > oneDayAgo);
      this.impressionCounts.set(key, filtered);
    });
    
    this.saveImpressionData();
  }
}