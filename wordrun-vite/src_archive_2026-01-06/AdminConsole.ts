/* =================================================================
   FILE: src/AdminConsole.ts
   PURPOSE: Admin web console with RBAC for ad management and analytics
   ================================================================= */

export interface AdminUser {
  id: string;
  username: string;
  role: 'Owner' | 'Manager' | 'Analyst';
  permissions: string[];
}

export interface Campaign {
  id: string;
  name: string;
  type: 'HOUSE' | 'DIRECT-SOLD' | 'NETWORK' | 'CROSS-PROMO';
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  targeting: {
    geo?: string[];
    device?: string[];
    language?: string[];
    landRange?: { min: number; max: number };
    levelRange?: { min: number; max: number };
    userSegment?: string[];
  };
  pacing: {
    dailyBudget: number;
    hourlyBudget?: number;
  };
  frequencyCap: {
    maxImpressions: number;
    timeWindow: number;
  };
  floorECPM: number;
  creativeIds: string[];
  startDate: Date;
  endDate: Date;
  analytics: {
    impressions: number;
    clicks: number;
    revenue: number;
    eCPM: number;
    fillRate: number;
  };
}

export interface Creative {
  id: string;
  name: string;
  type: 'image' | 'video' | 'html';
  url: string;
  width: number;
  height: number;
  duration?: number;
  fileSize: number;
  status: 'active' | 'pending' | 'rejected';
  uploadDate: Date;
}

export interface Analytics {
  date: string;
  slot: string;
  campaign?: string;
  geo: string;
  requests: number;
  fills: number;
  fillRate: number;
  impressions: number;
  clicks: number;
  revenue: number;
  eCPM: number;
  rewardedOptInRate?: number;
  reviveConversionRate?: number;
}

export class AdminConsole {
  private static instance: AdminConsole;
  private currentUser?: AdminUser;
  private campaigns: Map<string, Campaign> = new Map();
  private creatives: Map<string, Creative> = new Map();
  private analytics: Analytics[] = [];

  private constructor() {
    this.loadData();
  }

  static getInstance(): AdminConsole {
    if (!this.instance) {
      this.instance = new AdminConsole();
    }
    return this.instance;
  }

  // Authentication & Authorization
  async authenticate(username: string, password: string): Promise<boolean> {
    // Mock authentication - in production would validate against API
    const mockUsers: AdminUser[] = [
      {
        id: '1',
        username: 'admin',
        role: 'Owner',
        permissions: ['*'] // All permissions
      },
      {
        id: '2',
        username: 'manager',
        role: 'Manager',
        permissions: ['campaigns.*', 'creatives.*', 'analytics.read']
      },
      {
        id: '3',
        username: 'analyst',
        role: 'Analyst',
        permissions: ['analytics.*']
      }
    ];

    const user = mockUsers.find(u => u.username === username);
    if (user && password === 'admin123') { // Mock password
      this.currentUser = user;
      localStorage.setItem('adminUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = undefined;
    localStorage.removeItem('adminUser');
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    
    return this.currentUser.permissions.some(p => 
      p === '*' || 
      p === permission || 
      (p.endsWith('*') && permission.startsWith(p.slice(0, -1)))
    );
  }

  // Campaign Management
  async createCampaign(campaignData: Partial<Campaign>): Promise<string> {
    if (!this.hasPermission('campaigns.create')) {
      throw new Error('Insufficient permissions');
    }

    const campaign: Campaign = {
      id: this.generateId(),
      name: campaignData.name || 'New Campaign',
      type: campaignData.type || 'NETWORK',
      status: 'active',
      budget: campaignData.budget || 1000,
      spent: 0,
      targeting: campaignData.targeting || {},
      pacing: campaignData.pacing || { dailyBudget: 100 },
      frequencyCap: campaignData.frequencyCap || { maxImpressions: 5, timeWindow: 24 },
      floorECPM: campaignData.floorECPM || 1.0,
      creativeIds: campaignData.creativeIds || [],
      startDate: campaignData.startDate || new Date(),
      endDate: campaignData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      analytics: {
        impressions: 0,
        clicks: 0,
        revenue: 0,
        eCPM: 0,
        fillRate: 0
      }
    };

    this.campaigns.set(campaign.id, campaign);
    this.saveData();
    return campaign.id;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
    if (!this.hasPermission('campaigns.update')) {
      throw new Error('Insufficient permissions');
    }

    const campaign = this.campaigns.get(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    Object.assign(campaign, updates);
    this.campaigns.set(id, campaign);
    this.saveData();
  }

  async deleteCampaign(id: string): Promise<void> {
    if (!this.hasPermission('campaigns.delete')) {
      throw new Error('Insufficient permissions');
    }

    this.campaigns.delete(id);
    this.saveData();
  }

  getCampaigns(): Campaign[] {
    if (!this.hasPermission('campaigns.read')) {
      return [];
    }

    return Array.from(this.campaigns.values());
  }

  // Creative Management
  async uploadCreative(file: File, metadata: Partial<Creative>): Promise<string> {
    if (!this.hasPermission('creatives.create')) {
      throw new Error('Insufficient permissions');
    }

    // Mock file upload - in production would upload to CDN
    const creative: Creative = {
      id: this.generateId(),
      name: metadata.name || file.name,
      type: this.getFileType(file.type),
      url: URL.createObjectURL(file), // Mock URL
      width: metadata.width || 320,
      height: metadata.height || 50,
      duration: metadata.duration,
      fileSize: file.size,
      status: 'active',
      uploadDate: new Date()
    };

    this.creatives.set(creative.id, creative);
    this.saveData();
    return creative.id;
  }

  async updateCreative(id: string, updates: Partial<Creative>): Promise<void> {
    if (!this.hasPermission('creatives.update')) {
      throw new Error('Insufficient permissions');
    }

    const creative = this.creatives.get(id);
    if (!creative) {
      throw new Error('Creative not found');
    }

    Object.assign(creative, updates);
    this.creatives.set(id, creative);
    this.saveData();
  }

  getCreatives(): Creative[] {
    if (!this.hasPermission('creatives.read')) {
      return [];
    }

    return Array.from(this.creatives.values());
  }

  // Analytics
  getAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    slot?: string;
    geo?: string;
    campaign?: string;
  }): Analytics[] {
    if (!this.hasPermission('analytics.read')) {
      return [];
    }

    let filteredAnalytics = [...this.analytics];

    if (filters.dateFrom) {
      filteredAnalytics = filteredAnalytics.filter(a => 
        new Date(a.date) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filteredAnalytics = filteredAnalytics.filter(a => 
        new Date(a.date) <= filters.dateTo!
      );
    }

    if (filters.slot) {
      filteredAnalytics = filteredAnalytics.filter(a => a.slot === filters.slot);
    }

    if (filters.geo) {
      filteredAnalytics = filteredAnalytics.filter(a => a.geo === filters.geo);
    }

    if (filters.campaign) {
      filteredAnalytics = filteredAnalytics.filter(a => a.campaign === filters.campaign);
    }

    return filteredAnalytics;
  }

  // A/B Testing
  createABTest(testConfig: {
    name: string;
    variants: { id: string; weight: number; config: any }[];
    userSegments: string[];
  }): string {
    if (!this.hasPermission('campaigns.create')) {
      throw new Error('Insufficient permissions');
    }

    // Mock A/B test creation
    const testId = this.generateId();
    
    // Store test configuration
    localStorage.setItem(`ab_test_${testId}`, JSON.stringify(testConfig));
    
    return testId;
  }

  // Compliance & Consent
  getComplianceLogs(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    regulation?: 'GDPR' | 'CCPA' | 'COPPA';
    userId?: string;
  }): any[] {
    if (!this.hasPermission('compliance.read')) {
      return [];
    }

    // Mock compliance logs
    return [
      {
        id: '1',
        userId: 'user123',
        regulation: 'GDPR',
        action: 'consent_given',
        timestamp: new Date(),
        details: { purposes: ['analytics', 'advertising'] }
      }
    ];
  }

  // Waterfall Management
  getWaterfall(slot: string, geo?: string): any[] {
    if (!this.hasPermission('campaigns.read')) {
      return [];
    }

    // Mock waterfall configuration
    return [
      { priority: 1, type: 'HOUSE', eCPM: 5.0, fillRate: 0.85 },
      { priority: 2, type: 'DIRECT-SOLD', eCPM: 3.0, fillRate: 0.70 },
      { priority: 3, type: 'NETWORK', eCPM: 2.5, fillRate: 0.90 },
      { priority: 4, type: 'CROSS-PROMO', eCPM: 1.0, fillRate: 0.95 }
    ];
  }

  updateWaterfall(slot: string, waterfall: any[], geo?: string): void {
    if (!this.hasPermission('campaigns.update')) {
      throw new Error('Insufficient permissions');
    }

    // Mock waterfall update
    const key = geo ? `waterfall_${slot}_${geo}` : `waterfall_${slot}`;
    localStorage.setItem(key, JSON.stringify(waterfall));
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getFileType(mimeType: string): 'image' | 'video' | 'html' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'html';
  }

  private loadData(): void {
    // Load from localStorage (in production would load from API)
    try {
      const campaignsData = localStorage.getItem('admin_campaigns');
      if (campaignsData) {
        const campaigns = JSON.parse(campaignsData);
        campaigns.forEach((c: Campaign) => this.campaigns.set(c.id, c));
      }

      const creativesData = localStorage.getItem('admin_creatives');
      if (creativesData) {
        const creatives = JSON.parse(creativesData);
        creatives.forEach((c: Creative) => this.creatives.set(c.id, c));
      }

      const analyticsData = localStorage.getItem('admin_analytics');
      if (analyticsData) {
        this.analytics = JSON.parse(analyticsData);
      }

      const userData = localStorage.getItem('adminUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }

    // Generate mock data if empty
    if (this.campaigns.size === 0) {
      this.generateMockData();
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('admin_campaigns', JSON.stringify(Array.from(this.campaigns.values())));
      localStorage.setItem('admin_creatives', JSON.stringify(Array.from(this.creatives.values())));
      localStorage.setItem('admin_analytics', JSON.stringify(this.analytics));
    } catch (e) {
      console.error('Failed to save admin data:', e);
    }
  }

  private generateMockData(): void {
    // Create mock campaigns
    const mockCampaign: Campaign = {
      id: 'camp_1',
      name: 'Premium Game Ads',
      type: 'HOUSE',
      status: 'active',
      budget: 5000,
      spent: 2340,
      targeting: { geo: ['US', 'CA'], device: ['mobile'] },
      pacing: { dailyBudget: 200 },
      frequencyCap: { maxImpressions: 3, timeWindow: 24 },
      floorECPM: 4.0,
      creativeIds: ['creative_1'],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      analytics: {
        impressions: 15680,
        clicks: 892,
        revenue: 234.50,
        eCPM: 4.12,
        fillRate: 0.87
      }
    };

    this.campaigns.set(mockCampaign.id, mockCampaign);

    // Create mock creative
    const mockCreative: Creative = {
      id: 'creative_1',
      name: 'Banner Ad 320x50',
      type: 'image',
      url: 'https://via.placeholder.com/320x50/4285f4/ffffff?text=Play+More+Games',
      width: 320,
      height: 50,
      fileSize: 15680,
      status: 'active',
      uploadDate: new Date()
    };

    this.creatives.set(mockCreative.id, mockCreative);

    // Generate mock analytics for the last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const analytics: Analytics = {
        date: date.toISOString().split('T')[0],
        slot: 'interstitial_level_end',
        campaign: 'camp_1',
        geo: 'US',
        requests: Math.floor(Math.random() * 1000) + 500,
        fills: Math.floor(Math.random() * 400) + 300,
        fillRate: 0.75 + Math.random() * 0.2,
        impressions: Math.floor(Math.random() * 300) + 200,
        clicks: Math.floor(Math.random() * 50) + 10,
        revenue: Math.random() * 50 + 20,
        eCPM: Math.random() * 3 + 2,
        rewardedOptInRate: Math.random() * 0.3 + 0.6,
        reviveConversionRate: Math.random() * 0.4 + 0.3
      };
      this.analytics.push(analytics);
    }

    this.saveData();
  }

  getCurrentUser(): AdminUser | undefined {
    return this.currentUser;
  }

  // API Methods for external access
  async apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    // Mock API endpoint handling
    const [resource, action] = endpoint.split('/');
    
    switch (resource) {
      case 'campaigns':
        switch (method) {
          case 'GET':
            return { success: true, data: this.getCampaigns() };
          case 'POST':
            const id = await this.createCampaign(data);
            return { success: true, data: { id } };
          default:
            return { success: false, error: 'Method not allowed' };
        }
      
      case 'analytics':
        if (method === 'GET') {
          return { success: true, data: this.getAnalytics(data || {}) };
        }
        return { success: false, error: 'Method not allowed' };
      
      default:
        return { success: false, error: 'Endpoint not found' };
    }
  }
}