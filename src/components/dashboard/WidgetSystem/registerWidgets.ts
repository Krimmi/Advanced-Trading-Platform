/**
 * Widget Registration
 * 
 * This file registers all available widgets with the widget registry.
 */

import WidgetRegistry from './WidgetRegistry';
import MarketOverviewWidget from './widgets/MarketOverviewWidget';
import PortfolioSummaryWidget from './widgets/PortfolioSummaryWidget';
import WatchlistWidget from './widgets/WatchlistWidget';
import NewsWidget from './widgets/NewsWidget';

// Import widget icons from Material UI
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArticleIcon from '@mui/icons-material/Article';

/**
 * Register all available widgets with the registry
 */
export function registerAllWidgets(): void {
  const registry = WidgetRegistry.getInstance();
  
  // Register widget categories
  registry.registerCategory('market', 'Market Data');
  registry.registerCategory('portfolio', 'Portfolio');
  registry.registerCategory('news', 'News & Research');
  registry.registerCategory('analytics', 'Analytics');
  
  // Register Market Overview Widget
  registry.registerWidget({
    type: 'market-overview',
    name: 'Market Overview',
    description: 'Display key market indices, sectors, and market breadth',
    icon: 'TrendingUp',
    component: MarketOverviewWidget,
    defaultSettings: {
      indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
      showSectors: true,
      showMarketBreadth: true,
      refreshInterval: 60,
      chartType: 'line'
    },
    defaultSize: {
      width: 12,
      height: 4
    },
    minSize: {
      width: 6,
      height: 2
    },
    category: 'market',
    tags: ['market', 'indices', 'sectors', 'overview']
  });
  
  // Register Portfolio Summary Widget
  registry.registerWidget({
    type: 'portfolio-summary',
    name: 'Portfolio Summary',
    description: 'Display portfolio value, allocation, and performance',
    icon: 'AccountBalanceWallet',
    component: PortfolioSummaryWidget,
    defaultSettings: {
      portfolioId: 'default',
      showAssetAllocation: true,
      showTopHoldings: true,
      topHoldingsCount: 5,
      showPerformance: true,
      performancePeriod: '1d'
    },
    defaultSize: {
      width: 6,
      height: 6
    },
    minSize: {
      width: 4,
      height: 4
    },
    category: 'portfolio',
    tags: ['portfolio', 'allocation', 'performance', 'holdings']
  });
  
  // Register Watchlist Widget
  registry.registerWidget({
    type: 'watchlist',
    name: 'Watchlist',
    description: 'Track securities with customizable columns and real-time updates',
    icon: 'ListAlt',
    component: WatchlistWidget,
    defaultSettings: {
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
      columns: ['price', 'change', 'changePercent', 'volume', 'marketCap'],
      sortBy: 'changePercent',
      sortDirection: 'desc',
      refreshInterval: 30
    },
    defaultSize: {
      width: 6,
      height: 6
    },
    minSize: {
      width: 4,
      height: 3
    },
    category: 'market',
    tags: ['watchlist', 'stocks', 'prices', 'tracking']
  });
  
  // Register News Widget
  registry.registerWidget({
    type: 'news',
    name: 'News Feed',
    description: 'Display financial news from various sources',
    icon: 'Article',
    component: NewsWidget,
    defaultSettings: {
      sources: ['bloomberg', 'reuters', 'wsj', 'cnbc', 'ft'],
      categories: ['markets', 'economy', 'companies', 'technology'],
      displayMode: 'list',
      showImages: true,
      articlesCount: 10,
      sortBy: 'latest'
    },
    defaultSize: {
      width: 6,
      height: 8
    },
    minSize: {
      width: 4,
      height: 4
    },
    category: 'news',
    tags: ['news', 'articles', 'headlines', 'research']
  });
}

/**
 * Register data providers for widgets
 */
export function registerWidgetDataProviders(): void {
  const stateService = require('../services/DashboardStateService').default.getInstance();
  
  // Register Market Overview data provider
  stateService.registerDataProvider('market-overview', async (widgetConfig) => {
    // In a real application, this would fetch data from an API
    // For now, we'll return sample data
    return {
      indices: [
        { symbol: 'SPY', name: 'S&P 500', price: 478.25, change: 1.25, percentChange: 0.26 },
        { symbol: 'QQQ', name: 'Nasdaq 100', price: 421.75, change: 2.35, percentChange: 0.56 },
        { symbol: 'DIA', name: 'Dow Jones', price: 389.12, change: -0.45, percentChange: -0.12 },
        { symbol: 'IWM', name: 'Russell 2000', price: 201.87, change: -1.23, percentChange: -0.61 },
        { symbol: 'VIX', name: 'Volatility Index', price: 14.32, change: -0.87, percentChange: -5.73 }
      ],
      sectors: [
        { name: 'Technology', performance: 0.85 },
        { name: 'Healthcare', performance: 0.32 },
        { name: 'Financials', performance: -0.41 },
        { name: 'Consumer Discretionary', performance: 0.12 },
        { name: 'Industrials', performance: -0.23 },
        { name: 'Energy', performance: 1.45 },
        { name: 'Materials', performance: 0.05 },
        { name: 'Utilities', performance: -0.67 },
        { name: 'Real Estate', performance: -0.38 },
        { name: 'Communication Services', performance: 0.74 }
      ],
      marketBreadth: {
        advancers: 285,
        decliners: 215,
        unchanged: 12,
        newHighs: 45,
        newLows: 23,
        advanceVolume: 0.58,
        declineVolume: 0.42
      }
    };
  });
  
  // Register Portfolio Summary data provider
  stateService.registerDataProvider('portfolio-summary', async (widgetConfig) => {
    // In a real application, this would fetch data from an API
    // For now, we'll return sample data
    return {
      summary: {
        totalValue: 1250750.25,
        cashBalance: 45250.75,
        dayChange: 3250.50,
        dayChangePercent: 0.26,
        totalGain: 250750.25,
        totalGainPercent: 25.07,
        riskScore: 65
      },
      performance: {
        '1d': 0.26,
        '1w': 1.35,
        '1m': -0.87,
        '3m': 4.25,
        '6m': 8.75,
        '1y': 15.32,
        'ytd': 7.45
      },
      assetAllocation: [
        { category: 'US Stocks', percentage: 45, value: 562837.61 },
        { category: 'International Stocks', percentage: 25, value: 312687.56 },
        { category: 'Bonds', percentage: 15, value: 187612.54 },
        { category: 'Real Estate', percentage: 8, value: 100060.02 },
        { category: 'Alternatives', percentage: 4, value: 50030.01 },
        { category: 'Cash', percentage: 3, value: 37522.51 }
      ],
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', value: 87552.52, weight: 7.0, dayChange: 1.2 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', value: 75045.02, weight: 6.0, dayChange: 0.8 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', value: 62537.51, weight: 5.0, dayChange: -0.5 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 50030.01, weight: 4.0, dayChange: 0.3 },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway', value: 43776.26, weight: 3.5, dayChange: -0.2 },
        { symbol: 'JNJ', name: 'Johnson & Johnson', value: 37522.51, weight: 3.0, dayChange: 0.5 },
        { symbol: 'PG', name: 'Procter & Gamble', value: 31268.76, weight: 2.5, dayChange: 0.1 },
        { symbol: 'V', name: 'Visa Inc.', value: 25015.01, weight: 2.0, dayChange: 0.7 }
      ]
    };
  });
  
  // Register Watchlist data provider
  stateService.registerDataProvider('watchlist', async (widgetConfig) => {
    // In a real application, this would fetch data from an API
    // For now, we'll return sample data filtered by the widget's symbols
    const allSymbols = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.72,
        change: 1.25,
        changePercent: 0.70,
        volume: 52500000,
        marketCap: 2800000000000,
        pe: 29.5,
        dividend: 0.92,
        yield: 0.51,
        '52wkHigh': 198.23,
        '52wkLow': 124.17,
        isFavorite: true
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 338.11,
        change: 2.35,
        changePercent: 0.70,
        volume: 21300000,
        marketCap: 2500000000000,
        pe: 36.2,
        dividend: 2.72,
        yield: 0.80,
        '52wkHigh': 366.78,
        '52wkLow': 219.35,
        isFavorite: false
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 137.14,
        change: -0.86,
        changePercent: -0.62,
        volume: 28700000,
        marketCap: 1700000000000,
        pe: 25.1,
        dividend: 0,
        yield: 0,
        '52wkHigh': 153.78,
        '52wkLow': 83.34,
        isFavorite: true
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        price: 145.24,
        change: 0.98,
        changePercent: 0.68,
        volume: 35600000,
        marketCap: 1500000000000,
        pe: 112.8,
        dividend: 0,
        yield: 0,
        '52wkHigh': 149.26,
        '52wkLow': 81.43,
        isFavorite: false
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 215.49,
        change: -3.27,
        changePercent: -1.49,
        volume: 108900000,
        marketCap: 680000000000,
        pe: 55.3,
        dividend: 0,
        yield: 0,
        '52wkHigh': 299.29,
        '52wkLow': 101.81,
        isFavorite: true
      },
      {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        price: 312.81,
        change: 4.23,
        changePercent: 1.37,
        volume: 15700000,
        marketCap: 800000000000,
        pe: 27.4,
        dividend: 0,
        yield: 0,
        '52wkHigh': 326.20,
        '52wkLow': 88.09,
        isFavorite: false
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corp.',
        price: 437.53,
        change: 9.87,
        changePercent: 2.31,
        volume: 42100000,
        marketCap: 1100000000000,
        pe: 104.2,
        dividend: 0.16,
        yield: 0.04,
        '52wkHigh': 502.66,
        '52wkLow': 108.13,
        isFavorite: true
      }
    ];
    
    // Filter by symbols in widget settings
    return allSymbols.filter(item => 
      widgetConfig.settings.symbols.includes(item.symbol)
    );
  });
  
  // Register News data provider
  stateService.registerDataProvider('news', async (widgetConfig) => {
    // In a real application, this would fetch data from an API
    // For now, we'll return sample data
    return [
      {
        id: '1',
        title: 'Fed Signals Potential Rate Cut as Inflation Cools',
        summary: 'Federal Reserve officials indicated they could begin cutting interest rates in the coming months if inflation continues to ease, minutes from their latest meeting showed.',
        source: 'bloomberg',
        category: 'economy',
        author: 'John Smith',
        publishedAt: '2025-08-14T14:30:00Z',
        url: 'https://bloomberg.com/news/fed-signals-rate-cut',
        imageUrl: 'https://example.com/images/fed-building.jpg',
        isBookmarked: false,
        isRead: false
      },
      {
        id: '2',
        title: 'Apple Unveils New AI Features for iPhone 17',
        summary: 'Apple announced a suite of new artificial intelligence features coming to the iPhone 17, including enhanced Siri capabilities and on-device language processing.',
        source: 'cnbc',
        category: 'technology',
        author: 'Sarah Johnson',
        publishedAt: '2025-08-14T12:15:00Z',
        url: 'https://cnbc.com/tech/apple-ai-features',
        imageUrl: 'https://example.com/images/iphone-17.jpg',
        isBookmarked: true,
        isRead: false
      },
      {
        id: '3',
        title: 'Oil Prices Surge on Middle East Tensions',
        summary: 'Crude oil prices jumped 3% on Thursday as geopolitical tensions in the Middle East raised concerns about potential supply disruptions.',
        source: 'reuters',
        category: 'markets',
        author: 'Michael Wong',
        publishedAt: '2025-08-14T10:45:00Z',
        url: 'https://reuters.com/business/energy/oil-prices-surge',
        imageUrl: 'https://example.com/images/oil-rig.jpg',
        isBookmarked: false,
        isRead: true
      },
      {
        id: '4',
        title: 'Tesla Breaks Ground on New Gigafactory in India',
        summary: 'Tesla has begun construction on its new manufacturing facility in India, marking the company\'s expansion into one of the world\'s fastest-growing automotive markets.',
        source: 'wsj',
        category: 'companies',
        author: 'Priya Patel',
        publishedAt: '2025-08-14T09:20:00Z',
        url: 'https://wsj.com/business/autos/tesla-india-factory',
        imageUrl: 'https://example.com/images/tesla-factory.jpg',
        isBookmarked: false,
        isRead: false
      },
      {
        id: '5',
        title: 'Amazon Acquires AI Startup for $2.5 Billion',
        summary: 'Amazon announced the acquisition of an artificial intelligence startup specializing in natural language processing for $2.5 billion, its largest AI acquisition to date.',
        source: 'ft',
        category: 'technology',
        author: 'David Chen',
        publishedAt: '2025-08-14T08:00:00Z',
        url: 'https://ft.com/tech/amazon-acquisition',
        imageUrl: 'https://example.com/images/amazon-hq.jpg',
        isBookmarked: true,
        isRead: false
      },
      {
        id: '6',
        title: 'Global Markets Rally as Economic Data Beats Expectations',
        summary: 'Stock markets around the world rallied on Thursday after a series of economic reports showed stronger-than-expected growth in major economies.',
        source: 'bloomberg',
        category: 'markets',
        author: 'Emma Wilson',
        publishedAt: '2025-08-14T07:30:00Z',
        url: 'https://bloomberg.com/markets/global-rally',
        imageUrl: 'https://example.com/images/stock-market.jpg',
        isBookmarked: false,
        isRead: false
      },
      {
        id: '7',
        title: 'Cryptocurrency Regulation Bill Advances in Congress',
        summary: 'A bipartisan bill establishing a regulatory framework for cryptocurrencies advanced in Congress, providing clarity for the industry while imposing new requirements.',
        source: 'cnbc',
        category: 'economy',
        author: 'Robert Taylor',
        publishedAt: '2025-08-13T22:15:00Z',
        url: 'https://cnbc.com/crypto/regulation-bill',
        imageUrl: 'https://example.com/images/cryptocurrency.jpg',
        isBookmarked: false,
        isRead: true
      },
      {
        id: '8',
        title: 'Microsoft Expands Cloud Services with New Data Centers',
        summary: 'Microsoft announced plans to open new data centers in Africa and the Middle East, expanding its global cloud infrastructure to meet growing demand.',
        source: 'reuters',
        category: 'companies',
        author: 'James Brown',
        publishedAt: '2025-08-13T18:40:00Z',
        url: 'https://reuters.com/technology/microsoft-data-centers',
        imageUrl: 'https://example.com/images/data-center.jpg',
        isBookmarked: false,
        isRead: false
      },
      {
        id: '9',
        title: 'Inflation Data Shows Continued Moderation in Prices',
        summary: 'The latest Consumer Price Index report showed inflation continuing to moderate, with core prices rising less than economists had forecast.',
        source: 'wsj',
        category: 'economy',
        author: 'Lisa Martinez',
        publishedAt: '2025-08-13T16:10:00Z',
        url: 'https://wsj.com/economy/inflation-data',
        imageUrl: 'https://example.com/images/inflation-chart.jpg',
        isBookmarked: false,
        isRead: false
      },
      {
        id: '10',
        title: 'Google Faces New Antitrust Challenge in Europe',
        summary: 'European regulators announced a new antitrust investigation into Google\'s advertising technology practices, potentially leading to additional fines.',
        source: 'ft',
        category: 'companies',
        author: 'Thomas Schmidt',
        publishedAt: '2025-08-13T14:25:00Z',
        url: 'https://ft.com/technology/google-antitrust',
        imageUrl: 'https://example.com/images/google-logo.jpg',
        isBookmarked: false,
        isRead: true
      }
    ];
  });
}

export default {
  registerAllWidgets,
  registerWidgetDataProviders
};