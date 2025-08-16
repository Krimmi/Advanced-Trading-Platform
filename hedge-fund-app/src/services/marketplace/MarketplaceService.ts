import WidgetRegistry, { WidgetDefinition } from '../dashboard/WidgetRegistry';

export interface WidgetMetadata {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  releaseDate: Date;
  lastUpdated: Date;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  isPremium: boolean;
  price?: number;
  tags: string[];
  screenshots: string[];
  demoUrl?: string;
  documentationUrl?: string;
}

export interface UserWidgetData {
  userId: string;
  installedWidgets: {
    widgetId: string;
    installDate: Date;
    isFavorite: boolean;
    lastUsed?: Date;
  }[];
}

/**
 * Service for managing the widget marketplace
 */
class MarketplaceService {
  private static instance: MarketplaceService;
  private widgetRegistry = WidgetRegistry.getInstance();
  private apiUrl = '/api/marketplace';
  
  private constructor() {}
  
  public static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }
  
  /**
   * Get all available widgets in the marketplace
   */
  public async getAvailableWidgets(): Promise<WidgetMetadata[]> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data based on the widget registry
      return this.getMockWidgetMetadata();
    } catch (error) {
      console.error('Error fetching available widgets:', error);
      throw error;
    }
  }
  
  /**
   * Get widgets by category
   */
  public async getWidgetsByCategory(category: string): Promise<WidgetMetadata[]> {
    try {
      const allWidgets = await this.getAvailableWidgets();
      return allWidgets.filter(widget => widget.category === category);
    } catch (error) {
      console.error(`Error fetching widgets for category ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Search widgets
   */
  public async searchWidgets(query: string): Promise<WidgetMetadata[]> {
    try {
      const allWidgets = await this.getAvailableWidgets();
      
      if (!query) {
        return allWidgets;
      }
      
      const lowerQuery = query.toLowerCase();
      
      return allWidgets.filter(widget => 
        widget.name.toLowerCase().includes(lowerQuery) ||
        widget.description.toLowerCase().includes(lowerQuery) ||
        widget.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error(`Error searching widgets for "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Get widget details
   */
  public async getWidgetDetails(widgetId: string): Promise<WidgetMetadata | null> {
    try {
      const allWidgets = await this.getAvailableWidgets();
      return allWidgets.find(widget => widget.id === widgetId) || null;
    } catch (error) {
      console.error(`Error fetching widget details for ${widgetId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get user's installed widgets
   */
  public async getUserWidgets(userId: string): Promise<UserWidgetData> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data
      return {
        userId,
        installedWidgets: [
          {
            widgetId: 'market-overview',
            installDate: new Date('2025-07-15'),
            isFavorite: true,
            lastUsed: new Date('2025-08-13')
          },
          {
            widgetId: 'portfolio-summary',
            installDate: new Date('2025-07-15'),
            isFavorite: true,
            lastUsed: new Date('2025-08-14')
          },
          {
            widgetId: 'watchlist',
            installDate: new Date('2025-07-20'),
            isFavorite: false,
            lastUsed: new Date('2025-08-10')
          },
          {
            widgetId: 'news-feed',
            installDate: new Date('2025-08-01'),
            isFavorite: false,
            lastUsed: new Date('2025-08-14')
          }
        ]
      };
    } catch (error) {
      console.error(`Error fetching user widgets for ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Install a widget for a user
   */
  public async installWidget(userId: string, widgetId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      console.log(`Installing widget ${widgetId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error installing widget ${widgetId} for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Uninstall a widget for a user
   */
  public async uninstallWidget(userId: string, widgetId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      console.log(`Uninstalling widget ${widgetId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error uninstalling widget ${widgetId} for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Toggle favorite status for a widget
   */
  public async toggleFavorite(userId: string, widgetId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      console.log(`Toggling favorite status for widget ${widgetId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error toggling favorite for widget ${widgetId} for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Rate a widget
   */
  public async rateWidget(userId: string, widgetId: string, rating: number): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      console.log(`Rating widget ${widgetId} with ${rating} stars by user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error rating widget ${widgetId} by user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get mock widget metadata
   */
  private getMockWidgetMetadata(): WidgetMetadata[] {
    const widgetDefinitions = this.widgetRegistry.getAllWidgetDefinitions();
    
    return widgetDefinitions.map(def => this.createMetadataFromDefinition(def));
  }
  
  /**
   * Create widget metadata from widget definition
   */
  private createMetadataFromDefinition(def: WidgetDefinition): WidgetMetadata {
    // Generate a widget ID from the type
    const widgetId = def.type.toLowerCase().replace(/widget$/i, '').replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Generate random dates within the last year
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const releaseDate = new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
    const lastUpdated = new Date(releaseDate.getTime() + Math.random() * (now.getTime() - releaseDate.getTime()));
    
    // Generate random stats
    const rating = 3.5 + Math.random() * 1.5; // Between 3.5 and 5.0
    const ratingCount = Math.floor(Math.random() * 500) + 50; // Between 50 and 550
    const downloadCount = Math.floor(Math.random() * 10000) + 1000; // Between 1000 and 11000
    
    // Determine if premium based on category
    const isPremium = Math.random() > 0.7; // 30% chance of being premium
    const price = isPremium ? Math.floor(Math.random() * 20) + 5 : undefined; // Between $5 and $25
    
    // Generate tags based on category and type
    const tags = [def.category];
    if (def.type.includes('Chart')) tags.push('chart');
    if (def.type.includes('Portfolio')) tags.push('portfolio');
    if (def.type.includes('Market')) tags.push('market');
    if (def.type.includes('ML')) tags.push('machine-learning', 'ai');
    if (def.type.includes('News')) tags.push('news', 'feed');
    if (def.type.includes('Risk')) tags.push('risk', 'analysis');
    
    // Add some generic tags
    tags.push('trading', 'finance');
    
    return {
      id: widgetId,
      type: def.type,
      name: def.name,
      description: def.description,
      category: def.category,
      author: 'NinjaTech AI',
      version: '1.0.0',
      releaseDate,
      lastUpdated,
      rating,
      ratingCount,
      downloadCount,
      isPremium,
      price,
      tags,
      screenshots: [
        `https://source.unsplash.com/random/800x600?${def.category.toLowerCase()},finance`,
        `https://source.unsplash.com/random/800x600?${def.category.toLowerCase()},trading`
      ],
      demoUrl: `https://example.com/widgets/${widgetId}/demo`,
      documentationUrl: `https://example.com/widgets/${widgetId}/docs`
    };
  }
}

export default MarketplaceService;