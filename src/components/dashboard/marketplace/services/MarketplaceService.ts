/**
 * Marketplace Service
 * 
 * This service handles interactions with the widget marketplace,
 * including fetching available widgets, installation, and updates.
 */

import { WidgetMetadata, UserWidgetData, WidgetCategory } from '../models/WidgetMetadata';
import DashboardPreferenceService from '../../services/DashboardPreferenceService';
import WidgetRegistry from '../../WidgetSystem/WidgetRegistry';

// Sample marketplace data (in a real app, this would come from an API)
const SAMPLE_MARKETPLACE_DATA: WidgetMetadata[] = [
  {
    id: 'market-overview',
    type: 'market-overview',
    name: 'Market Overview',
    description: 'Display key market indices, sectors, and market breadth',
    longDescription: 'The Market Overview widget provides a comprehensive view of current market conditions, including major indices, sector performance, and market breadth indicators. Track the S&P 500, Nasdaq, Dow Jones, and more in real-time with customizable display options.',
    icon: 'TrendingUp',
    category: 'market',
    tags: ['market', 'indices', 'sectors', 'overview'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-01',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-01',
    updated: '2025-08-01',
    screenshots: [
      {
        url: 'https://example.com/screenshots/market-overview-1.jpg',
        caption: 'Market indices view',
        thumbnailUrl: 'https://example.com/screenshots/market-overview-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/market-overview-2.jpg',
        caption: 'Sector performance view',
        thumbnailUrl: 'https://example.com/screenshots/market-overview-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.7,
      totalRatings: 128,
      distribution: {
        '1': 2,
        '2': 3,
        '3': 8,
        '4': 25,
        '5': 90
      }
    },
    installCount: 5280,
    pricing: {
      type: 'free'
    },
    featured: true,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: false,
      hasInstanceSettings: true
    }
  },
  {
    id: 'portfolio-summary',
    type: 'portfolio-summary',
    name: 'Portfolio Summary',
    description: 'Display portfolio value, allocation, and performance',
    longDescription: 'The Portfolio Summary widget provides a comprehensive overview of your investment portfolio, including total value, asset allocation, top holdings, and performance metrics. Track your investments and monitor your portfolio\'s performance over time.',
    icon: 'AccountBalanceWallet',
    category: 'portfolio',
    tags: ['portfolio', 'allocation', 'performance', 'holdings'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-01',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-01',
    updated: '2025-08-01',
    screenshots: [
      {
        url: 'https://example.com/screenshots/portfolio-summary-1.jpg',
        caption: 'Portfolio overview',
        thumbnailUrl: 'https://example.com/screenshots/portfolio-summary-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/portfolio-summary-2.jpg',
        caption: 'Asset allocation view',
        thumbnailUrl: 'https://example.com/screenshots/portfolio-summary-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.5,
      totalRatings: 96,
      distribution: {
        '1': 3,
        '2': 4,
        '3': 10,
        '4': 20,
        '5': 59
      }
    },
    installCount: 4120,
    pricing: {
      type: 'free'
    },
    featured: true,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: false,
      hasInstanceSettings: true
    }
  },
  {
    id: 'watchlist',
    type: 'watchlist',
    name: 'Watchlist',
    description: 'Track securities with customizable columns and real-time updates',
    longDescription: 'The Watchlist widget allows you to monitor your favorite securities with customizable columns and real-time price updates. Track stocks, ETFs, and other securities with key metrics like price, change, volume, and more.',
    icon: 'ListAlt',
    category: 'market',
    tags: ['watchlist', 'stocks', 'prices', 'tracking'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-01',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-01',
    updated: '2025-08-01',
    screenshots: [
      {
        url: 'https://example.com/screenshots/watchlist-1.jpg',
        caption: 'Watchlist with price data',
        thumbnailUrl: 'https://example.com/screenshots/watchlist-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/watchlist-2.jpg',
        caption: 'Customizable columns view',
        thumbnailUrl: 'https://example.com/screenshots/watchlist-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.8,
      totalRatings: 156,
      distribution: {
        '1': 1,
        '2': 2,
        '3': 5,
        '4': 18,
        '5': 130
      }
    },
    installCount: 6340,
    pricing: {
      type: 'free'
    },
    featured: true,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: false,
      hasInstanceSettings: true
    }
  },
  {
    id: 'news',
    type: 'news',
    name: 'News Feed',
    description: 'Display financial news from various sources',
    longDescription: 'The News Feed widget displays the latest financial news from various sources, including Bloomberg, Reuters, WSJ, CNBC, and more. Stay up-to-date with market-moving news and events with customizable filters and display options.',
    icon: 'Article',
    category: 'news',
    tags: ['news', 'articles', 'headlines', 'research'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-01',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-01',
    updated: '2025-08-01',
    screenshots: [
      {
        url: 'https://example.com/screenshots/news-1.jpg',
        caption: 'News feed list view',
        thumbnailUrl: 'https://example.com/screenshots/news-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/news-2.jpg',
        caption: 'News feed card view',
        thumbnailUrl: 'https://example.com/screenshots/news-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.6,
      totalRatings: 112,
      distribution: {
        '1': 2,
        '2': 3,
        '3': 7,
        '4': 22,
        '5': 78
      }
    },
    installCount: 4980,
    pricing: {
      type: 'free'
    },
    featured: true,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: false,
      hasInstanceSettings: true
    }
  },
  {
    id: 'economic-calendar',
    type: 'economic-calendar',
    name: 'Economic Calendar',
    description: 'Track upcoming economic events and releases',
    longDescription: 'The Economic Calendar widget displays upcoming economic events, data releases, and central bank announcements. Stay informed about market-moving events with customizable filters and notifications.',
    icon: 'CalendarToday',
    category: 'market',
    tags: ['calendar', 'economic', 'events', 'releases'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-10',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-10',
    updated: '2025-08-10',
    screenshots: [
      {
        url: 'https://example.com/screenshots/economic-calendar-1.jpg',
        caption: 'Calendar view',
        thumbnailUrl: 'https://example.com/screenshots/economic-calendar-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/economic-calendar-2.jpg',
        caption: 'Event details view',
        thumbnailUrl: 'https://example.com/screenshots/economic-calendar-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.4,
      totalRatings: 85,
      distribution: {
        '1': 3,
        '2': 4,
        '3': 8,
        '4': 25,
        '5': 45
      }
    },
    installCount: 3250,
    pricing: {
      type: 'free'
    },
    featured: false,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: true,
      hasInstanceSettings: true
    }
  },
  {
    id: 'technical-chart',
    type: 'technical-chart',
    name: 'Technical Chart',
    description: 'Advanced technical analysis chart with indicators',
    longDescription: 'The Technical Chart widget provides advanced charting capabilities with multiple timeframes, chart types, and technical indicators. Analyze price action and identify trading opportunities with customizable chart settings.',
    icon: 'ShowChart',
    category: 'analysis',
    tags: ['chart', 'technical', 'analysis', 'indicators'],
    author: {
      id: 'ninjatech',
      name: 'NinjaTech AI',
      organization: 'NinjaTech AI',
      website: 'https://ninjatech.ai'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-12',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-12',
    updated: '2025-08-12',
    screenshots: [
      {
        url: 'https://example.com/screenshots/technical-chart-1.jpg',
        caption: 'Candlestick chart with indicators',
        thumbnailUrl: 'https://example.com/screenshots/technical-chart-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/technical-chart-2.jpg',
        caption: 'Drawing tools and annotations',
        thumbnailUrl: 'https://example.com/screenshots/technical-chart-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.9,
      totalRatings: 210,
      distribution: {
        '1': 1,
        '2': 1,
        '3': 3,
        '4': 15,
        '5': 190
      }
    },
    installCount: 7850,
    pricing: {
      type: 'free'
    },
    featured: true,
    verified: true,
    official: true,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: false,
      tablet: true
    },
    settings: {
      hasGlobalSettings: true,
      hasInstanceSettings: true
    }
  },
  {
    id: 'crypto-tracker',
    type: 'crypto-tracker',
    name: 'Crypto Tracker',
    description: 'Monitor cryptocurrency prices and market data',
    longDescription: 'The Crypto Tracker widget allows you to monitor cryptocurrency prices, market capitalization, volume, and other key metrics. Track Bitcoin, Ethereum, and other cryptocurrencies with real-time updates.',
    icon: 'CurrencyBitcoin',
    category: 'crypto',
    tags: ['crypto', 'bitcoin', 'ethereum', 'blockchain'],
    author: {
      id: 'cryptodev',
      name: 'CryptoDev',
      organization: 'CryptoDev Labs',
      website: 'https://cryptodev.io'
    },
    version: '1.2.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-06-15',
        changelog: 'Initial release'
      },
      {
        version: '1.1.0',
        releaseDate: '2025-07-20',
        changelog: 'Added support for more cryptocurrencies'
      },
      {
        version: '1.2.0',
        releaseDate: '2025-08-05',
        changelog: 'Added historical price charts'
      }
    ],
    created: '2025-06-15',
    updated: '2025-08-05',
    screenshots: [
      {
        url: 'https://example.com/screenshots/crypto-tracker-1.jpg',
        caption: 'Cryptocurrency price list',
        thumbnailUrl: 'https://example.com/screenshots/crypto-tracker-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/crypto-tracker-2.jpg',
        caption: 'Detailed coin view',
        thumbnailUrl: 'https://example.com/screenshots/crypto-tracker-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.3,
      totalRatings: 156,
      distribution: {
        '1': 5,
        '2': 8,
        '3': 15,
        '4': 35,
        '5': 93
      }
    },
    installCount: 4250,
    pricing: {
      type: 'free'
    },
    featured: false,
    verified: true,
    official: false,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: true,
      tablet: true
    },
    settings: {
      hasGlobalSettings: true,
      hasInstanceSettings: true
    }
  },
  {
    id: 'options-chain',
    type: 'options-chain',
    name: 'Options Chain',
    description: 'View and analyze options contracts',
    longDescription: 'The Options Chain widget displays options contracts for a selected underlying security, including calls and puts at different strike prices and expiration dates. Analyze implied volatility, open interest, and other options metrics.',
    icon: 'CallSplit',
    category: 'options',
    tags: ['options', 'derivatives', 'trading', 'volatility'],
    author: {
      id: 'optionstrader',
      name: 'Options Trader',
      organization: 'Options Trading Solutions',
      website: 'https://optionstrading.com'
    },
    version: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        releaseDate: '2025-08-08',
        changelog: 'Initial release'
      }
    ],
    created: '2025-08-08',
    updated: '2025-08-08',
    screenshots: [
      {
        url: 'https://example.com/screenshots/options-chain-1.jpg',
        caption: 'Options chain view',
        thumbnailUrl: 'https://example.com/screenshots/options-chain-1-thumb.jpg'
      },
      {
        url: 'https://example.com/screenshots/options-chain-2.jpg',
        caption: 'Options analytics view',
        thumbnailUrl: 'https://example.com/screenshots/options-chain-2-thumb.jpg'
      }
    ],
    rating: {
      averageScore: 4.7,
      totalRatings: 85,
      distribution: {
        '1': 1,
        '2': 2,
        '3': 5,
        '4': 15,
        '5': 62
      }
    },
    installCount: 2150,
    pricing: {
      type: 'paid',
      price: 9.99,
      currency: 'USD',
      trial: true,
      trialDays: 14
    },
    featured: false,
    verified: true,
    official: false,
    status: 'active',
    compatibility: {
      desktop: true,
      mobile: false,
      tablet: true
    },
    settings: {
      hasGlobalSettings: true,
      hasInstanceSettings: true
    }
  }
];

// Sample categories
const SAMPLE_CATEGORIES: WidgetCategory[] = [
  {
    id: 'market',
    name: 'Market Data',
    description: 'Widgets for displaying market data and information',
    icon: 'TrendingUp',
    count: 3,
    featured: true,
    order: 1
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Widgets for managing and analyzing your portfolio',
    icon: 'AccountBalanceWallet',
    count: 1,
    featured: true,
    order: 2
  },
  {
    id: 'news',
    name: 'News & Research',
    description: 'Widgets for displaying news and research content',
    icon: 'Article',
    count: 1,
    featured: true,
    order: 3
  },
  {
    id: 'analysis',
    name: 'Analysis',
    description: 'Widgets for technical and fundamental analysis',
    icon: 'ShowChart',
    count: 1,
    featured: false,
    order: 4
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Widgets for cryptocurrency tracking and analysis',
    icon: 'CurrencyBitcoin',
    count: 1,
    featured: false,
    order: 5
  },
  {
    id: 'options',
    name: 'Options',
    description: 'Widgets for options trading and analysis',
    icon: 'CallSplit',
    count: 1,
    featured: false,
    order: 6
  }
];

// Sample user widget data
const SAMPLE_USER_WIDGETS: Record<string, UserWidgetData> = {
  'market-overview': {
    widgetId: 'market-overview',
    installed: true,
    installDate: '2025-08-01T12:00:00Z',
    version: '1.0.0',
    instances: [
      {
        dashboardId: 'default',
        instanceId: 'market-overview',
        settings: {
          indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
          showSectors: true,
          showMarketBreadth: true,
          refreshInterval: 60,
          chartType: 'line'
        }
      }
    ],
    userRating: 5,
    usageStats: {
      lastUsed: '2025-08-14T10:30:00Z',
      totalUses: 42,
      totalTimeSpent: 3600
    }
  },
  'portfolio-summary': {
    widgetId: 'portfolio-summary',
    installed: true,
    installDate: '2025-08-01T12:05:00Z',
    version: '1.0.0',
    instances: [
      {
        dashboardId: 'default',
        instanceId: 'portfolio-summary',
        settings: {
          portfolioId: 'default',
          showAssetAllocation: true,
          showTopHoldings: true,
          topHoldingsCount: 5,
          showPerformance: true,
          performancePeriod: '1d'
        }
      }
    ],
    userRating: 4,
    usageStats: {
      lastUsed: '2025-08-14T09:45:00Z',
      totalUses: 38,
      totalTimeSpent: 3200
    }
  },
  'watchlist': {
    widgetId: 'watchlist',
    installed: true,
    installDate: '2025-08-01T12:10:00Z',
    version: '1.0.0',
    instances: [
      {
        dashboardId: 'default',
        instanceId: 'watchlist',
        settings: {
          symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
          columns: ['price', 'change', 'changePercent', 'volume', 'marketCap'],
          sortBy: 'changePercent',
          sortDirection: 'desc',
          refreshInterval: 30
        }
      }
    ],
    userRating: 5,
    usageStats: {
      lastUsed: '2025-08-14T11:15:00Z',
      totalUses: 56,
      totalTimeSpent: 4800
    }
  },
  'news': {
    widgetId: 'news',
    installed: true,
    installDate: '2025-08-01T12:15:00Z',
    version: '1.0.0',
    instances: [
      {
        dashboardId: 'default',
        instanceId: 'news',
        settings: {
          sources: ['bloomberg', 'reuters', 'wsj', 'cnbc', 'ft'],
          categories: ['markets', 'economy', 'companies', 'technology'],
          displayMode: 'list',
          showImages: true,
          articlesCount: 10,
          sortBy: 'latest'
        }
      }
    ],
    userRating: 4,
    usageStats: {
      lastUsed: '2025-08-14T10:00:00Z',
      totalUses: 32,
      totalTimeSpent: 2800
    }
  }
};

class MarketplaceService {
  private static instance: MarketplaceService;
  private widgets: WidgetMetadata[] = SAMPLE_MARKETPLACE_DATA;
  private categories: WidgetCategory[] = SAMPLE_CATEGORIES;
  private userWidgets: Record<string, UserWidgetData> = { ...SAMPLE_USER_WIDGETS };
  private preferenceService: DashboardPreferenceService;
  private widgetRegistry: WidgetRegistry;
  
  private constructor() {
    this.preferenceService = DashboardPreferenceService.getInstance();
    this.widgetRegistry = WidgetRegistry.getInstance();
    
    // Initialize user widgets based on installed widgets
    this.initializeUserWidgets();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }
  
  /**
   * Initialize user widgets based on installed widgets
   */
  private initializeUserWidgets(): void {
    // In a real app, this would fetch user widget data from an API
    // For now, we'll use the sample data
  }
  
  /**
   * Get all available widgets
   */
  public async getWidgets(): Promise<WidgetMetadata[]> {
    // In a real app, this would fetch widgets from an API
    return Promise.resolve([...this.widgets]);
  }
  
  /**
   * Get widget by ID
   */
  public async getWidget(id: string): Promise<WidgetMetadata | null> {
    // In a real app, this would fetch the widget from an API
    const widget = this.widgets.find(w => w.id === id);
    return Promise.resolve(widget || null);
  }
  
  /**
   * Get widgets by category
   */
  public async getWidgetsByCategory(categoryId: string): Promise<WidgetMetadata[]> {
    // In a real app, this would fetch widgets by category from an API
    const categoryWidgets = this.widgets.filter(w => w.category === categoryId);
    return Promise.resolve(categoryWidgets);
  }
  
  /**
   * Search widgets
   */
  public async searchWidgets(query: string): Promise<WidgetMetadata[]> {
    // In a real app, this would search widgets from an API
    if (!query) return Promise.resolve([...this.widgets]);
    
    const lowerQuery = query.toLowerCase();
    const results = this.widgets.filter(w => 
      w.name.toLowerCase().includes(lowerQuery) ||
      w.description.toLowerCase().includes(lowerQuery) ||
      w.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    return Promise.resolve(results);
  }
  
  /**
   * Get all categories
   */
  public async getCategories(): Promise<WidgetCategory[]> {
    // In a real app, this would fetch categories from an API
    return Promise.resolve([...this.categories]);
  }
  
  /**
   * Get category by ID
   */
  public async getCategory(id: string): Promise<WidgetCategory | null> {
    // In a real app, this would fetch the category from an API
    const category = this.categories.find(c => c.id === id);
    return Promise.resolve(category || null);
  }
  
  /**
   * Get featured widgets
   */
  public async getFeaturedWidgets(): Promise<WidgetMetadata[]> {
    // In a real app, this would fetch featured widgets from an API
    const featuredWidgets = this.widgets.filter(w => w.featured);
    return Promise.resolve(featuredWidgets);
  }
  
  /**
   * Get popular widgets
   */
  public async getPopularWidgets(): Promise<WidgetMetadata[]> {
    // In a real app, this would fetch popular widgets from an API
    const popularWidgets = [...this.widgets].sort((a, b) => b.installCount - a.installCount).slice(0, 5);
    return Promise.resolve(popularWidgets);
  }
  
  /**
   * Get new widgets
   */
  public async getNewWidgets(): Promise<WidgetMetadata[]> {
    // In a real app, this would fetch new widgets from an API
    const newWidgets = [...this.widgets].sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    ).slice(0, 5);
    
    return Promise.resolve(newWidgets);
  }
  
  /**
   * Get user's installed widgets
   */
  public async getUserWidgets(): Promise<UserWidgetData[]> {
    // In a real app, this would fetch user widgets from an API
    return Promise.resolve(Object.values(this.userWidgets).filter(w => w.installed));
  }
  
  /**
   * Check if a widget is installed
   */
  public isWidgetInstalled(widgetId: string): boolean {
    return !!this.userWidgets[widgetId]?.installed;
  }
  
  /**
   * Install a widget
   */
  public async installWidget(widgetId: string): Promise<boolean> {
    // In a real app, this would install the widget via an API
    const widget = await this.getWidget(widgetId);
    if (!widget) return false;
    
    // Create user widget data if it doesn't exist
    if (!this.userWidgets[widgetId]) {
      this.userWidgets[widgetId] = {
        widgetId,
        installed: true,
        installDate: new Date().toISOString(),
        version: widget.version,
        instances: [],
        usageStats: {
          lastUsed: new Date().toISOString(),
          totalUses: 0,
          totalTimeSpent: 0
        }
      };
    } else {
      // Update existing user widget data
      this.userWidgets[widgetId].installed = true;
      this.userWidgets[widgetId].installDate = new Date().toISOString();
      this.userWidgets[widgetId].version = widget.version;
    }
    
    return true;
  }
  
  /**
   * Uninstall a widget
   */
  public async uninstallWidget(widgetId: string): Promise<boolean> {
    // In a real app, this would uninstall the widget via an API
    if (!this.userWidgets[widgetId]) return false;
    
    // Mark as uninstalled
    this.userWidgets[widgetId].installed = false;
    
    // Remove all instances from dashboards
    const dashboards = this.preferenceService.getPreferences().dashboards;
    let updated = false;
    
    dashboards.forEach(dashboard => {
      const widgetInstances = dashboard.widgets.filter(w => w.widgetType === widgetId);
      if (widgetInstances.length > 0) {
        widgetInstances.forEach(instance => {
          this.preferenceService.removeWidget(dashboard.id, instance.id);
        });
        updated = true;
      }
    });
    
    return true;
  }
  
  /**
   * Add widget instance to dashboard
   */
  public async addWidgetToDashboard(
    dashboardId: string,
    widgetId: string,
    settings?: Record<string, any>
  ): Promise<string | null> {
    // In a real app, this would add the widget to the dashboard via an API
    const widget = await this.getWidget(widgetId);
    if (!widget) return null;
    
    // Ensure widget is installed
    if (!this.isWidgetInstalled(widgetId)) {
      const installed = await this.installWidget(widgetId);
      if (!installed) return null;
    }
    
    // Get default settings and size
    const widgetConfig = this.widgetRegistry.getWidget(widgetId);
    const defaultSettings = widgetConfig ? widgetConfig.defaultSettings : {};
    const defaultSize = widgetConfig ? widgetConfig.defaultSize : { width: 6, height: 4 };
    
    // Add widget to dashboard
    const instanceId = this.preferenceService.addWidget(dashboardId, {
      widgetType: widgetId,
      column: 0, // Will be adjusted by the dashboard
      order: 0, // Will be adjusted by the dashboard
      width: defaultSize.width,
      height: defaultSize.height,
      settings: settings || defaultSettings
    });
    
    if (instanceId) {
      // Update user widget data
      if (!this.userWidgets[widgetId].instances) {
        this.userWidgets[widgetId].instances = [];
      }
      
      this.userWidgets[widgetId].instances.push({
        dashboardId,
        instanceId,
        settings: settings || defaultSettings
      });
      
      // Update usage stats
      if (!this.userWidgets[widgetId].usageStats) {
        this.userWidgets[widgetId].usageStats = {
          lastUsed: new Date().toISOString(),
          totalUses: 1,
          totalTimeSpent: 0
        };
      } else {
        this.userWidgets[widgetId].usageStats.lastUsed = new Date().toISOString();
        this.userWidgets[widgetId].usageStats.totalUses++;
      }
    }
    
    return instanceId;
  }
  
  /**
   * Rate a widget
   */
  public async rateWidget(widgetId: string, rating: number): Promise<boolean> {
    // In a real app, this would submit the rating to an API
    if (!this.userWidgets[widgetId]) return false;
    
    this.userWidgets[widgetId].userRating = rating;
    
    return true;
  }
  
  /**
   * Submit a review for a widget
   */
  public async reviewWidget(widgetId: string, review: string): Promise<boolean> {
    // In a real app, this would submit the review to an API
    if (!this.userWidgets[widgetId]) return false;
    
    this.userWidgets[widgetId].userReview = review;
    
    return true;
  }
  
  /**
   * Update widget usage statistics
   */
  public async updateWidgetUsage(widgetId: string, timeSpent: number): Promise<boolean> {
    // In a real app, this would update usage stats via an API
    if (!this.userWidgets[widgetId]) return false;
    
    if (!this.userWidgets[widgetId].usageStats) {
      this.userWidgets[widgetId].usageStats = {
        lastUsed: new Date().toISOString(),
        totalUses: 1,
        totalTimeSpent: timeSpent
      };
    } else {
      this.userWidgets[widgetId].usageStats.lastUsed = new Date().toISOString();
      this.userWidgets[widgetId].usageStats.totalUses++;
      this.userWidgets[widgetId].usageStats.totalTimeSpent += timeSpent;
    }
    
    return true;
  }
}

export default MarketplaceService;